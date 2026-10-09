const { createClient } = require('redis');

let client = null;
let isConnected = false;

const initRedis = async () => {
  if (process.env.REDIS_ENABLED !== 'true') {
    console.log('⚠️ Redis disabled - using in-memory fallback');
    return null;
  }

  try {
    client = createClient({ url: process.env.REDIS_URL });
    client.on('error', (err) => console.error('Redis error:', err));
    client.on('connect', () => console.log('✅ Redis connected'));
    await client.connect();
    isConnected = true;
    return client;
  } catch (error) {
    console.error('Redis connection failed:', error.message);
    return null;
  }
};

// In-memory fallback cache
const memoryCache = new Map();

const cache = {
  async get(key) {
    if (isConnected && client) {
      const data = await client.get(key);
      return data ? JSON.parse(data) : null;
    }
    return memoryCache.get(key) || null;
  },

  async set(key, value, ttlSeconds = 300) {
    if (isConnected && client) {
      await client.setEx(key, ttlSeconds, JSON.stringify(value));
    } else {
      memoryCache.set(key, value);
      setTimeout(() => memoryCache.delete(key), ttlSeconds * 1000);
    }
  },

  async del(key) {
    if (isConnected && client) {
      await client.del(key);
    } else {
      memoryCache.delete(key);
    }
  },

  async invalidatePattern(pattern) {
    if (isConnected && client) {
      const keys = await client.keys(pattern);
      if (keys.length > 0) await client.del(keys);
    } else {
      for (const key of memoryCache.keys()) {
        if (key.includes(pattern.replace('*', ''))) memoryCache.delete(key);
      }
    }
  }
};

module.exports = { initRedis, cache };
