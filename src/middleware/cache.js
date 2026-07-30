const cache = new Map();

function createCacheMiddleware(ttlMs = 60000) {
  return (req, res, next) => {
    if (req.method !== 'GET') {
      return next();
    }

    const key = `${req.originalUrl}`;
    const cached = cache.get(key);

    if (cached && Date.now() - cached.timestamp < ttlMs) {
      return res.json(cached.data);
    }

    const originalJson = res.json.bind(res);
    res.json = (data) => {
      cache.set(key, { data, timestamp: Date.now() });
      return originalJson(data);
    };

    next();
  };
}

function invalidateCache(pattern) {
  for (const key of cache.keys()) {
    if (key.includes(pattern)) {
      cache.delete(key);
    }
  }
}

function clearCache() {
  cache.clear();
}

module.exports = { createCacheMiddleware, invalidateCache, clearCache };
