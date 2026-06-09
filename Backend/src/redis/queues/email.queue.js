import {redis} from '../index.js';

import { Queue } from 'bullmq';
export const emailQueue = new Queue("emails" , {
    connection:redis
});