const express = require('express');
const axios = require('axios');
const compression = require('compression');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cluster = require('cluster');
const os = require('os');
const app = express();
const port = 3000;

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

app.post('/api/chat', async (req, res) => {
  if (circuitOpen) {
    return res.status(503).json({ error: 'Service temporarily unavailable' });
  }

  if (requestQueue.length >= MAX_QUEUE_SIZE) {
    return res.status(429).json({ error: 'Too many requests' });
  }

  const cacheKey = JSON.stringify(req.body);
  const cached = apiCache.get(cacheKey);
  
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return res.json(cached.data);
  }

  try {
    const response = await axios.post('https://api-inference.huggingface.co/models/YOUR_MODEL_ID', {
      inputs: req.body.message,
      parameters: { return_full_text: false }
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        'Content-Type': 'application/json'
      },
      timeout: 5000
    });
    
    const responseData = { response: response.data[0].generated_text };
    apiCache.set(cacheKey, {
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

// Circuit breaker check
setInterval(() => {
  if (failureCount > 10) {
    circuitOpen = true;
    setTimeout(() => {
      circuitOpen = false;
      failureCount = 0;
    }, CIRCUIT_WINDOW);
  }
}, 10000);

// Clean cache periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of apiCache) {
    if (now - value.timestamp > CACHE_DURATION) {
      apiCache.delete(key);
    }
  }
}, CACHE_DURATION);

// Cache static assets
const staticOptions = {
  maxAge: '1d',
  etag: true,
  lastModified: true
};
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