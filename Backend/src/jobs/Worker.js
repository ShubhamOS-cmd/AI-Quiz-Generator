import { Worker } from "bullmq";
import { sendMail } from "../utils/mailer.js";
import  QuizzModel  from "../models/Quizz.model.js";
import QuestionsModel from "../models/Questions.model.js";
import mongoose, { mongo } from "mongoose";
import { redis } from "../config/redis.js";
import { bullMQ_redis } from "../config/redis.js";
import { quizQueue } from "./email.queue.js";
import AttemptModel from "../models/Attempt.model.js";
import ResponseModel from "../models/Response.model.js";

const emailWorker = new Worker("emails" , async(job) => {
    console.log("i am Inside work");
    const { to, subject, body } = job.data;
    await sendMail(to,subject,body);
    } , {
        connection:bullMQ_redis,
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
    const quiz = await QuizzModel.findByIdAndUpdate(quizId,{status:"active"},{returnDocument: 'after'});

    const Questions = await QuestionsModel.find({quizId});

    const transaction = redis.multi();
    transaction.set(`quiz:${quizId}:status`,"active",'EX',quiz.duration*60);

    Questions.forEach(q => {
        transaction.set(
            `quiz:${quizId}:${q._id}`,
            JSON.stringify({option:q.correctOption,posScore:q.scoreOnCorrect,negScore:q.scoreOnIncorrect}),
            'EX',
            quiz.duration*60
        );
    })
    await transaction.exec();

    await quizQueue.add("endQuiz",{ quizId },{delay : quiz.duration*60*1000});
    console.log("Quiz started ");
}

const endQuiz = async(job) => {
    console.log("Quiz ended called");
    try {
        const { quizId } = job.data;
    const leaderboard = await redis.zrevrange(`quiz:${quizId}:leaderboard`,0,-1,'WITHSCORES');
    const formatedData = [];
    const participants = [];
    const attempts = [];
    const responses = [];

    const date = new Date().toISOString();

    for(let i=0;i<leaderboard.length;i+=2){
        const userId = leaderboard[i].split(':')[0];
        const score = Number(leaderboard[i+1]);
        const rank = formatedData.length + 1;

        let [subDate,questionIds]  = await Promise.all(
            [redis.get(`quiz:${quizId}:${userId}:submitted`),
            redis.smembers(`quiz:${quizId}:${userId}:attempts`)
            ]);
        if(!subDate) subDate = date;

        const attemptId = new mongoose.Types.ObjectId();
        const attempt = {
            _id: attemptId,
            userId,
            quizId,
            score,
            rank,
            submittedAt: subDate
        }
        attempts.push(attempt);
        participants.push({userId,questionIds});
        formatedData.push({userId,score,rank});

        if(questionIds.length > 0){
            const keys = questionIds.map((q) => `quiz:${quizId}:${userId}:${q}`);
            const rawData = await redis.mget(...keys);

            questionIds.forEach((q,idx) => {
                const data = rawData[idx];
                if(!data) return;
                const parsed = JSON.parse(data);
                const response = {
                    attemptId,
                    questionId:q,
                    selectedOption: parsed.selectedOption,
                    isCorrect: parsed.isCorrect,
                    answeredAt: parsed.submittedAt
                }
                responses.push(response);
            })
        }
    }
    console.log("Quiz ended call 2");
    const session = await mongoose.startSession();
    try{
        session.startTransaction();
        console.log("1");
        await AttemptModel.insertMany(attempts,{session});
        console.log("2");
        await ResponseModel.insertMany(responses,{session});
        console.log("3");
        await QuizzModel.updateOne(
            {_id:quizId},
            {$set:{participants: participants.map(p => p.userId),leaderboard:formatedData,status:'completed'}},
            {session}
        );
        console.log("4");
        await session.commitTransaction();
    } catch(err){
        await session.abortTransaction();
        console.error(err);
    } finally{
        await session.endSession();
    }

    const keys = [`quiz:${quizId}:leaderboard`];
    for(const {userId,questionIds} of participants){
        keys.push(`quiz:${quizId}:${userId}:submitted`);
        keys.push(`quiz:${quizId}:${userId}:attempts`);

        
        questionIds.forEach((qId) => { keys.push(`quiz:${quizId}:${userId}:${qId}`)});
    }

    if(keys.length > 0) await redis.del(...keys);
    } catch (error) {
        throw error;
    }
    console.log("Quiz ended");
};

const quizWorker = new Worker("quiz", async(job) => {
    if(job.name === "activateQuiz"){
        await activateQuiz(job);
    }
    else if(job.name === "endQuiz"){
        await endQuiz(job);
    }
},{
    connection: bullMQ_redis,
    concurrency:5,
    stalledInterval:30000,
    maxStalledCount:2
})
