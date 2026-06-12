import { Worker } from "bullmq";
import { redisConnection } from "./index.js";
import { sendMail } from "../utils/mailer.js";
import  QuizzModel  from "../models/Quizz.model.js";
import QuestionsModel from "../models/Questions.model.js";
import mongoose from "mongoose";
import redis from "ioredis";
import { quizQueue } from "./email.queue.js";

const emailWorker = new Worker("emails" , async(job) => {
    console.log("i am Inside work", job);
    const { to, subject, body } = job.data;
    await sendMail(to,subject,body);
    } , {
        redisConnection,
        concurrency:5,
        stalledInterval:30000,
        maxStalledCount:2
    }
);

Emailworker.on("completed" , (job) => {
    console.log("Completed job done" , job.id);
})

Emailworker.on("failed" , (job) => {
    console.log("Job is Falied" , job.id);
})

const activateQuiz = async(job) => {
    const { quizId } = job.data;
    const quiz = await QuizzModel.findByIdAndUpdate(quizId,{status:"active"},{new:true});

    const Questions = await QuestionsModel.find({quizId});

    const pipeline = redis.pipeline();
    pipeline.set(`quiz:${quizId}:status`,"active",'EX',quiz.duration*60);

    Questions.forEach(q => {
        pipeline.set(
            `quiz:${quizId}:${q._id}:answer`,
            q.correctOption.toString(),
            'EX',
            quiz.duration*60
        );
    })
    await pipeline.exec();

    await quizQueue.add("endQuiz",{ quizId },{delay : quiz.duration*60*1000});
}

const endQuiz = async(job) => {
    const { quizId } = job.data;
    const leaderboard = await redis.zrevrangebyscore(`quiz:${quizId}:leaderboard`,'+inf','-inf','WITHSCORES');

    const formatedData = [];

    for(let i=0;i<leaderboard.length;i+=2){
        formatedData.push(
            {
                userId:leaderboard[i],
                score: Number(leaderbord[i+1]),
                rank : formatedData.length + 1
            }
        )
    }

    await QuizzModel.findByIdAndUpdate(quizId,{
        status:"completed",
        leaderboard:formatedData,
    });

    await redis.del(`quiz:${quizId}:status`);
    await redis.del(`quiz:${quizId}:leaderboard`);
}

const quizWorker = new Worker("quiz", async(job) => {
    if(job.name === "activateQuiz"){
        await activateQuiz(job);
    }
    else if(job.name === "endQuiz"){
        await endQuiz(job);
    }
})

