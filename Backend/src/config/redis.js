import Redis from 'ioredis';

export const redisConnection = { host:"localhost", port: 6379 };

export const redis = new Redis(redisConnection);

export const bullMQ_redis = new Redis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null
});