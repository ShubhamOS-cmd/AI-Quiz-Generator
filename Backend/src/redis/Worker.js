import { Worker } from "bullmq";
import { redis } from "./index.js";

const worker = new Worker("emails" , async(job) => {
    console.log("i am Inside work", job);
    await new Promise((resolve) => setTimeout(resolve , 1000));
    } , {
        redis,
        concurrency:5,
        stalledInterval:30000,
        maxStalledCount:2
    }
);

worker.on("completed" , (job) => {
    console.log("Completed job done" , job.id);
})

worker.on("failed" , (job) => {
    console.log("Job is Falied" , job.id);
})

