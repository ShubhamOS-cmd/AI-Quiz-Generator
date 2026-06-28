import Redis from 'ioredis';

export const redisConnection = { host:"localhost", port: 6379 };

export const redis = new Redis(redisConnection);
