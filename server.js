require('dotenv').config();

const express = require('express');
const app = express();
const port = process.env.PORT || 3000;

// Load dependencies with error handling
function loadModule(moduleName) {
    try {
        return require(moduleName);
    } catch (error) {
        console.error(`Failed to load ${moduleName}. Please run "npm install" first.`);
        process.exit(1);
    }
}

const axios = loadModule('axios');
const compression = loadModule('compression');
const helmet = loadModule('helmet');
const rateLimit = loadModule('express-rate-limit');
const cluster = loadModule('cluster');
const os = loadModule('os');

// Security and optimization middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

app.use(express.json());

// Memory cache for API responses
const apiCache = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const requestQueue = [];
const MAX_QUEUE_SIZE = 1000;
const CIRCUIT_WINDOW = 60000; // 1 minute
let failureCount = 0;
let circuitOpen = false;

const metrics = {
  requestCount: 0,
  errorCount: 0,
  avgResponseTime: 0
};

const requestBatcher = {
  queue: [],
  processing: false,
  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    
    const batch = this.queue.splice(0, 10);
    try {
      const responses = await Promise.all(batch.map(req => 
        axios.post('https://api-inference.huggingface.co/models/YOUR_MODEL_ID', req.body)
      ));
      
      batch.forEach((req, i) => {
        apiCache.set(JSON.stringify(req.body), {
          data: { response: responses[i].data[0].generated_text },
          timestamp: Date.now()
        });
      });
    } catch (error) {
      console.error('Batch processing error:', error);
    }
    this.processing = false;
    this.process();
  }
};

// Update model configuration
const MODEL_CONFIG = {
  'deepseek-local': {
    url: 'http://localhost:8000/api/chat',
    type: 'local'
  },
  'llama-cloud': {
    url: 'https://api-inference.huggingface.co/models/meta-llama/Llama-2-7b-chat-hf',
    type: 'cloud'
  }
};

app.post('/api/chat', async (req, res) => {
  if (circuitOpen) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  const { message, model = 'deepseek-local', turboMode = false } = req.body;
  const modelConfig = MODEL_CONFIG[model];

  if (!modelConfig) {
    return res.status(400).json({ error: 'Invalid model selection' });
  }

  try {
    let response;
    if (modelConfig.type === 'local') {
      // Use local model
      response = await axios.post(modelConfig.url, {
        message,
        turboMode
      });
    } else {
      // Use cloud model
      response = await axios.post(modelConfig.url, {
        inputs: message,
        parameters: { 
          max_length: 100,
          temperature: turboMode ? 0.9 : 0.7
        }
      }, {
        headers: {
          'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
    }

    const responseData = {
      response: response.data.generated_text || response.data[0].generated_text,
      metrics: {
        processingTime: Date.now() - req._startTime,
        model: model
      }
    };

    // Cache response
    apiCache.set(JSON.stringify(req.body), {
      data: responseData,
      timestamp: Date.now()
    });

    res.json(responseData);
  } catch (error) {
    console.error(`API Error: ${error.message}`);
    res.status(error.response?.status || 500).json({
      error: 'API request failed',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
    failureCount++;
  }
});
app.use(express.static(__dirname, staticOptions));

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Memory management
setInterval(() => {
  global.gc && global.gc();
  const usage = process.memoryUsage();
  if (usage.heapUsed > 750 * 1024 * 1024) { // 750MB
    apiCache.clear();
  }
}, 30000);

// Enhanced error handling
process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    process.exit(1);
});