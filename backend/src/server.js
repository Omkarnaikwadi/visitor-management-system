require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const http = require('http');
const fs = require('fs');
const routes = require('./routes');
const { initSocket } = require('./config/socket');
const { initRedis } = require('./config/redis');
const migrate = require('./db/migrate');

const app = express();
const server = http.createServer(app);

// Ensure upload directories exist
['uploads/photos', 'uploads/gatepasses'].forEach((dir) => {
  const full = path.join(__dirname, '..', dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

// Initialize Socket.io
initSocket(server);

// Initialize Redis (optional)
initRedis();

// Middleware
const allowedOrigins = process.env.FRONTEND_URL?.split(',') || ['http://localhost:3000'];
app.use(cors({ 
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  }, 
  credentials: true 
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Routes
app.use('/api', routes);

// Health check
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Root route
app.get('/', (req, res) => res.json({ message: 'VMS API is running' }));

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

const PORT = process.env.PORT || 5000;

// Run migration then start server
migrate()
  .then(() => {
    server.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ Failed to run migration:', err.message);
    process.exit(1);
  });
