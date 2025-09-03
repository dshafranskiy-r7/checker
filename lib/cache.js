// Simple in-memory cache with TTL
const cache = new Map();
const CACHE_TTL = 60 * 60 * 1000; // 1 hour in milliseconds

export function setCache(key, data) {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

export function getCache(key) {
  const cached = cache.get(key);
  if (!cached) return null;
  
  if (Date.now() - cached.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return cached.data;
}