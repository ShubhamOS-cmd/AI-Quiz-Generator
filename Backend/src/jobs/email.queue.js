import { Queue } from 'bullmq';
import { redisConnection } from '../config/redis.js';

export const redisConnection = new Redis({
    host: "localhost",
    port: 6379,
    maxRetriesPerRequest: null
});

export const emailQueue = new Queue("emails" , {
    connection: redisConnection
});

export const quizQueue = new Queue("quiz",{
    connection: redisConnection
})