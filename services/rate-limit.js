const { Redis } = require('@upstash/redis');

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,
});

class RateLimiter {
  constructor() {
    this.redis = redis;
    this.backoffMap = new Map(); // Store dynamic backoff times
  }

  async isRateLimited(key, limit = 60, windowInSeconds = 60) {
    try {
      const now = Date.now();
      const windowStart = Math.floor(now / (windowInSeconds * 1000));
      const finalKey = `rate-limit:${key}:${windowStart}`;
      
      // Also check global rate limit
      const globalKey = `rate-limit:global:${windowStart}`;

      // Increment both session and global counters
      const [count, globalCount] = await Promise.all([
        this.redis.incr(finalKey),
        this.redis.incr(globalKey)
      ]);

      // Set expiry for both keys if they're new
      if (count === 1) {
        await this.redis.expire(finalKey, windowInSeconds);
      }
      if (globalCount === 1) {
        await this.redis.expire(globalKey, windowInSeconds);
      }

      // Global limit is 3x the per-session limit
      const globalLimit = limit * 3;

      // Get current backoff time for this key
      const currentBackoff = this.backoffMap.get(key) || 0;
      
      // Check if we've exceeded either limit
      if (count > limit || globalCount > globalLimit) {
        const ttl = await this.redis.ttl(finalKey);
        
        // Increase backoff time if limits are exceeded
        const newBackoff = currentBackoff ? Math.min(currentBackoff * 2, 60) : 35;
        this.backoffMap.set(key, newBackoff);
        
        return {
          limited: true,
          remainingTime: Math.max(ttl, newBackoff),
          remaining: 0,
          backoffTime: newBackoff
        };
      }

      // Reset backoff time if we're under limits
      if (count < limit * 0.8 && globalCount < globalLimit * 0.8) {
        this.backoffMap.set(key, 0);
      }
      
      return {
        limited: false,
        remainingTime: windowInSeconds,
        remaining: limit - count,
        backoffTime: currentBackoff
      };
    } catch (error) {
      console.error('Rate limiter error:', error);
      // If Redis is down, default to allowing the request
      return {
        limited: false,
        remainingTime: windowInSeconds,
        remaining: 1,
        error: true
      };
    }
  }

  async waitForRateLimit(key, limit = 60, windowInSeconds = 60) {
    const status = await this.isRateLimited(key, limit, windowInSeconds);
    if (status.limited) {
      // Wait for the rate limit window to reset
      await new Promise(resolve => setTimeout(resolve, status.remainingTime * 1000));
      return this.waitForRateLimit(key, limit, windowInSeconds);
    }
    return status;
  }
}

// Create a singleton instance
const rateLimiter = new RateLimiter();

module.exports = rateLimiter;
