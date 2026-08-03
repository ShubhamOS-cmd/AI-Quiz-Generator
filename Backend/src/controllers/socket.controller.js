import { redis } from "../config/redis.js";
import QuestionsModel from "../models/Questions.model.js";


const roomJoinHandler = async (quizId,callback) => {
        try{
        const exists = await redis.get(`quiz:${quizId}:status`);
        if(!exists) return callback({success: false, message: "Quiz is not live now."});
        client.join(quizId);
        client.quizId = quizId;
        const questions = await QuestionsModel.find({quizId});
        const pipeline = redis.pipeline();
        for(let i=0;i<questions.length;i++){
            pipeline.get(`quiz:${quizId}:${questions[i].id}`);
        }
        const result  = await pipeline.exec();
        const responses = result.map(([err,val],i) => {
            if(err) return null;
            return val;
        })
        const questionWithResponse = questions.map((q,i) => (
            {
                ...q.toObject(),
                response: responses[i]
            }
        ))
        const top10 = await redis.zrevrange(`quiz:${client.quizId}:leaderboard`,0,9,"WITHSCORES");
        callback({leaderboard:top10,questionWithResponse,success: true});
        }
        catch(err){
            callback({success:false,message: "Internal server error"});
        }
};

const questionAttemptHandler = async({questionId,selectedOption},callback) => {
        if(!client.quizId) return callback({success:false,message:"Invalid request"});
        const quizId = client.quizId;
        const userId = client.user.userId;
        try{
            const [isAttempted, isSubmitted, isLive] = await redis.pipeline()
            .get(`quiz:${quizId}:${userId}:${questionId}`)
            .get(`quiz:${quizId}:${userId}:submitted`)
            .ttl(`quiz:${quizId}:status`)
            .exec();
            if(isAttempted[1] || isSubmitted[1] || isLive[1] <= 0) return callback({success:false,flag: isLive[1] <=0,message:"Already attempted"});

            const data = await redis.get(`quiz:${client.quizId}:${questionId}`);
            if(!data) return callback({success:false,message:"Invalid question"});
            const parseData = JSON.parse(data);
            const isCorrect = selectedOption == parseData.option;
            const toAdd = isCorrect ? parseData.posScore : parseData.negScore;
            const transaction = redis.multi();
            transaction.incrby(`quiz:${client.quizId}:${client.user.userId}:score`,toAdd); // For attempt record
            transaction.set(`quiz:${client.quizId}:${client.user.userId}:${questionId}`,JSON.stringify({isCorrect,submittedAt: new Date().toISOString(),selectedOption})); // For response record
            transaction.sadd(`quiz:${client.quizId}:${client.user.userId}:attempts`,questionId); // index
            transaction.zincrby(`quiz:${client.quizId}:leaderboard`,toAdd,`${client.user.userId}:${client.user.username}`); // leaderboard update

            await transaction.exec();

            const top10 = await redis.zrevrange(`quiz:${client.quizId}:leaderboard`,0,9,"WITHSCORES");
            io.to(client.quizId).emit("update",top10);
            callback({success:true});
        }
        catch(err){
            callback({success:false,message:"Internal server error"});
        }
    };

const quizSubmissionHandler = async(callback) => {
        if(!client.quizId) return callback({success:false,message:"Invalid request"});
        try{
            const expireAt = await redis.ttl(`quiz:${client.quizId}:status`);
            if(expireAt <= 0) return callback({success:false,message:"Quiz is not live now."});
            const score = await redis.zscore(`quiz:${client.quizId}:leaderboard`,`${client.user.userId}:${client.user.username}`)
            const isSubmitted = await redis.get(`quiz:${client.quizId}:${client.user.userId}:submitted`);
            if(isSubmitted) {
                callback({success:true,score,message:"Quiz already submitted"});
            }
            await redis.set(`quiz:${client.quizId}:${client.user.userId}:submitted`,new Date().toISOString());
            callback({success:true,score,message:"Quiz submitted"});
        }
        catch(err){
            callback({success:false,message:"Internal server error"});
        }
    };

export { roomJoinHandler, questionAttemptHandler, quizSubmissionHandler };

