import { redis } from "../config/redis.js";
import QuestionsModel from "../models/Questions.model.js";


const roomJoinHandler = async (client, quizId, callback) => { // socket.io event handler for when a client join quiz room 
        try{
        const exists = await redis.get(`quiz:${quizId}:status`); // is the quiz is present 
        if(!exists) return callback({success: false, message: "Quiz is not live now."});
        const remainingSeconds = await redis.ttl(`quiz:${quizId}:status`);
        if(remainingSeconds <= 0) return callback({success: false, message: "Quiz is not live now."});
        const userId = client.user.userId;
        const isSubmitted = await redis.get(`quiz:${quizId}:${userId}:submitted`);
        if(isSubmitted) return callback({success: false, message: "You have already submitted this quiz."});
        client.join(quizId); // client join quiz id 
        client.quizId = quizId; // add quiz id for future use 
        const questions = await QuestionsModel.find({quizId}); // fetch all question doc for this quiz form mongoDB 
        const questionWithResponse = questions.map((q) => {
            const question = q.toObject();
            delete question.correctOption;
            return question;
        })
        const top10 = await redis.zrevrange(`quiz:${client.quizId}:leaderboard`,0,9,"WITHSCORES"); // result a flat array 
        callback({leaderboard:top10,questionWithResponse,remainingSeconds,success: true});
        }
        catch(err){
            callback({success:false,message: "Internal server error"});
        }
};

const questionAttemptHandler = async(client, io, {questionId,selectedOption},callback) => {
        if(!client.quizId) return callback({success:false,message:"Invalid request"});
        const quizId = client.quizId;
        const userId = client.user.userId;
        try{

            const [isSubmitted, isLive] = await redis.pipeline()
            .get(`quiz:${quizId}:${userId}:submitted`)
            .ttl(`quiz:${quizId}:status`)
            .exec();
            if(isSubmitted[1] || isLive[1] == -2) return callback({success:false,flag: isLive[1] <=0,message:"User already submitted or quiz Ended "});

            // To prevent TOCTOU time of check to time of use 
            const claimed = await redis.sadd(`quiz:${quizId}:${userId}:attempts` , questionId); // returns an integer representing the number of elements successfully adde to the set // return 0 if the questioId is already there 
            if(!claimed) return callback({success:false , flag : false , message:"Already question submitted "}); // sadd is single atomic oprn 


            const data = await redis.get(`quiz:${client.quizId}:${questionId}`); // take the data from redis about question 
            if(!data) return callback({success:false,message:"Invalid question"});

            const parseData = JSON.parse(data); // parse the data in JSON 
            const isCorrect = selectedOption == parseData.option; // if the selectedOption is correct 
            const toAdd = isCorrect ? parseData.posScore : -Math.abs(parseData.negScore); // penalties are stored as positive magnitudes

            const transaction = redis.multi(); // all or nothing atomically 
            transaction.incrby(`quiz:${client.quizId}:${client.user.userId}:score`,toAdd); // For attempt record
            transaction.set(`quiz:${client.quizId}:${client.user.userId}:${questionId}`,JSON.stringify({isCorrect,submittedAt: new Date().toISOString(),selectedOption})); // For response record
            transaction.zincrby(`quiz:${client.quizId}:leaderboard`,toAdd,`${client.user.userId}:${client.user.username}`); // increments the score of member inside a redis sorted ZSET by increment 
            // in client not exist in set yet it's created with increment as its starting score 

            await transaction.exec(); // ttl issue 

            const top10 = await redis.zrevrange(`quiz:${client.quizId}:leaderboard`,0,9,"WITHSCORES"); // scale issue 
            io.to(client.quizId).emit("update",top10);
            callback({success:true, isCorrect, scoreDelta: toAdd});
        }
        catch(err){
            console.error(err);
            callback({success:false,message:"Internal server error"});
        }
    };

const quizSubmissionHandler = async(client,callback) => {
        if(!client.quizId) return callback({success:false,message:"Invalid request"});
        try{
            const expireAt = await redis.ttl(`quiz:${client.quizId}:status`);
            if(expireAt <= 0) return callback({success:false,message:"Quiz is not live now."});
            const score = await redis.zscore(`quiz:${client.quizId}:leaderboard`,`${client.user.userId}:${client.user.username}`)
            const isSubmitted = await redis.get(`quiz:${client.quizId}:${client.user.userId}:submitted`);
            if(isSubmitted) {
                return callback({success:true,score,message:"Quiz already submitted"});
            }
            await redis.set(`quiz:${client.quizId}:${client.user.userId}:submitted`,new Date().toISOString());
            callback({success:true,score,message:"Quiz submitted"});
        }
        catch(err){
            callback({success:false,message:"Internal server error"});
        }
    };

export { roomJoinHandler, questionAttemptHandler, quizSubmissionHandler };

