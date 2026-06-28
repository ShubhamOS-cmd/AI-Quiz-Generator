import { Worker } from "bullmq";
import { redisConnection } from "../jobs/email.queue.js"
import { sendMail } from "../utils/mailer.js";
import  QuizzModel  from "../models/Quizz.model.js";
import QuestionsModel from "../models/Questions.model.js";
import mongoose, { mongo } from "mongoose";
import { redis } from "../config/redis.js";
import { quizQueue } from "./email.queue.js";
import AttemptModel from "../models/Attempt.model.js";
import ResponseModel from "../models/Response.model.js";

const emailWorker = new Worker("emails" , async(job) => {
    console.log("i am Inside work");
    const { to, subject, body } = job.data;
    await sendMail(to,subject,body);
    } , {
        connection:redisConnection,
        concurrency:5,
        stalledInterval:30000,
        maxStalledCount:2
    }
);

emailWorker.on("completed" , (job) => {
    console.log("Completed job done" , job.id);
})

emailWorker.on("failed" , (job , err) => {
    console.log("Job is Falied" , job.id , err.message);
})

const activateQuiz = async(job) => {
    const { quizId } = job.data;
    const quiz = await QuizzModel.findByIdAndUpdate(quizId,{status:"active"},{new:true});

    const Questions = await QuestionsModel.find({quizId});

    const transaction = redis.multi();
    transaction.set(`quiz:${quizId}:status`,"active",'EX',quiz.duration*60);

    Questions.forEach(q => {
        transaction.set(
            `quiz:${quizId}:${q._id}`,
            Json.stringify({option:q.correctOption.toString(),posScore:q.scoreOnCorrect,negScore:q.scoreOnCorrect}),
            'EX',
            quiz.duration*60
        );
    })
    await transaction.exec();

    await quizQueue.add("endQuiz",{ quizId },{delay : quiz.duration*60*1000});
}

const endQuiz = async(job) => {
    const { quizId } = job.data;
    const leaderboard = await redis.zrevrange(`quiz:${quizId}:leaderboard`,0,-1,'WITHSCORES');

    const formatedData = [];
    const participants = [];
    const attempts = [];
    const responses = [];

    for(let i=0;i<leaderboard.length;i+=2){
        const userId = leaderboard[i].split(':')[0];
        const score = Number(leaderboard[i+1]);
        const rank = formatedData.length+1;
        formatedData.push(
            {
                userId,
                score,
                rank
            }
        )
        participants.push(userId);
        attempts.push({
            userId,
            quizId,
            score,
            rank,
        })
    }
    attempts.forEach(attempt => {
        attempt._id = new mongoose.Types.ObjectId();
    });
try{
    await Promise.all(attempts.map(async (attempt) => {
  const userId = attempt.userId;
  const questionIds = await redis.smembers(`quiz:${quizId}:${userId}:attempts`);
  if(!questionIds.length) return;

  const [values, submittedAt] = await Promise.all([
    redis.mget(...questionIds.map(q => `quiz:${quizId}:${userId}:${q}`)),
    redis.getdel(`quiz:${quizId}:${userId}:submitted`)
  ]);
  attempt.submittedAt = submittedAt ? new Date(submittedAt) : null;

  questionIds.forEach((qId, j) => {
    if(!values[j]) return;
    const response = JSON.parse(values[j]);
    responses.push({
      attemptId: attempt._id,
      questionId: qId,
      selectedOption: response.selectedOption,
      isCorrect: response.isCorrect,
      answeredAt: new Date(response.submittedAt)
    });
  });
}));

    await Promise.all([AttemptModel.insertMany(attempts),
        QuizzModel.findByIdAndUpdate(quizId,{
        status:"completed",
        leaderboard:formatedData,
        participants
    }),
     responses.length && ResponseModel.insertMany(responses)
    ]);
}catch(err){
    throw new Error("Failed to persist quiz results");
}

    let cursor = 0;
    do{
        const [newCursor,keys] = await redis.scan(cursor,"MATCH",`quiz:${quizId}:*`,"COUNT",100);
        cursor = parseInt(newCursor);
        if(keys.length) await redis.del(...keys);
    }while(cursor !== 0)
}

const quizWorker = new Worker("quiz", async(job) => {
    if(job.name === "activateQuiz"){
        await activateQuiz(job);
    }
    else if(job.name === "endQuiz"){
        await endQuiz(job);
    }
},{
    redisConnection,
    concurrency:5,
    stalledInterval:30000,
    maxStalledCount:2
})

