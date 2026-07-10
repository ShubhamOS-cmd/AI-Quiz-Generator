import { Queue } from 'bullmq';
import {redis} from '../config/redis.js';
export const emailQueue = new Queue("emails" , {
    connection: redis
});

export const quizQueue = new Queue("quiz",{
    connection: redis
})