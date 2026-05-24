import IORedis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

export function createRedisConnection() {
  return new IORedis(REDIS_URL, {
    maxRetriesPerRequest: null, // Required by BullMQ
  });
}

// Shared connection for caching
let cacheConnection: IORedis | null = null;

export function getRedis(): IORedis {
  if (!cacheConnection) {
    cacheConnection = new IORedis(REDIS_URL);
  }
  return cacheConnection;
}
