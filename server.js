require('dotenv').config();

const express = require('express');
const app = express();
const https = require('https');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
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
const cluster = loadModule('cluster');
const os = loadModule('os');

// Security middleware
app.use(helmet());
app.use(compression());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});
app.use(limiter);

// Force HTTPS
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (!req.secure) {
      return res.redirect('https://' + req.headers.host + req.url);
    }
    next();
  });
}

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
  batchSize: parseInt(process.env.MAX_BATCH_SIZE) || 10,
  timeout: null,

  async process() {
    if (this.processing || this.queue.length === 0) return;
    this.processing = true;
    clearTimeout(this.timeout);
    
    const batch = this.queue.splice(0, this.batchSize);
    try {
      const responses = await Promise.allSettled(batch.map(req => 
        axios.post(req.modelConfig.url, req.body, {
          timeout: parseInt(process.env.INFERENCE_TIMEOUT) || 30000
        })
      ));
      
      responses.forEach((result, i) => {
        if (result.status === 'fulfilled') {
          apiCache.set(JSON.stringify(batch[i].body), {
            data: result.value.data,
            timestamp: Date.now()
          });
        }
      });
    } catch (error) {
      console.error('Batch processing error:', error);
      failureCount++;
    }
    this.processing = false;
    if (this.queue.length > 0) {
      this.timeout = setTimeout(() => this.process(), 100);
    }
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

// Add input sanitization
const sanitizeInput = (str) => {
  return str.trim()
    .slice(0, parseInt(process.env.INPUT_MAX_LENGTH) || 1000)
    .replace(/[<>]/g, ''); // Basic XSS protection
};

// Add input validation middleware
const validateInput = (req, res, next) => {
  const { message, model } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Invalid message format' });
  }
  req.body.message = sanitizeInput(message);
  if (model && !MODEL_CONFIG[model]) {
    return res.status(400).json({ error: 'Invalid model selection' });
  }
  next();
};

// Add request tracking
app.use((req, res, next) => {
  req._startTime = Date.now();
  req._requestId = Math.random().toString(36).substring(7);
  res.on('finish', () => {
    const duration = Date.now() - req._startTime;
    console.log(`Request ${req._requestId} completed in ${duration}ms`);
  });
  next();
});

// Add validation to chat endpoint
app.post('/api/chat', validateInput, async (req, res) => {
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
  console.log(`Server running on port ${port}`);
});

// Error handling
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    error: process.env.NODE_ENV === 'development' ? err.message : 'Internal Server Error'
  });
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