import { Queue } from 'bullmq';
import Redis from "ioredis"

export const redisConnection = new Redis({
    host: "localhost",
    port: 6379,
});

export const emailQueue = new Queue("emails" , {
    connection:redisConnection
});

export const quizQueue = new Queue("quiz",{
    connection:redisConnection
})