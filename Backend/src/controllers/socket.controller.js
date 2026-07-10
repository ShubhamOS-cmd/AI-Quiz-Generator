import { redis } from "../config/redis";


const roomJoinHandler = async (quizId,callback) => {
        try{
        const exists = await redis.get(`quiz:${quizId}:status`);
        if(!exists) return callback({success: false, message: "Quiz not started yet!"});
        client.join(quizId);
        client.quizId = quizId;
        callback({success: true});
        }
        catch(err){
            callback({success:false,message: "Internal server error"});
        }
};

const questionAttemptHandler = async({questionId,selectedOption},callback) => {
        if(!client.quizId) return callback({success:false,message:"Invalid request"});
        try{
            const [isAttempted, isSubmitted] = await redis.pipeline()
            .get(`quiz:${client.quizId}:${client.user.userId}:${questionId}`)
            .get(`quiz:${client.quizId}:${client.user.userId}:submitted`)
            .exec();
            if(isAttempted[1] || isSubmitted[1]) return callback({success:false,message:"Already attempted"});

            const data = await redis.get(`quiz:${client.quizId}:${questionId}`);
            if(!data) return callback({success:false,message:"Invalid question"});
            const parseData = JSON.parse(data);
            const isCorrect = selectedOption == parseData.option;
            const toAdd = isCorrect ? parseData.posScore : parseData.negScore;
            const transaction = redis.multi();
            transaction.incrby(`quiz:${client.quizId}:${client.user.userId}:score`,toAdd); // For attempt record
            transaction.set(`quiz:${client.quizId}:${client.user.userId}:${questionId}`,JSON.stringify({isCorrect,submittedAt: new Date(),selectedOption})); // For response record
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
            if(expireAt <= 0) return callback({success:false,message:"Quiz already ended!"});
            const isSubmitted = await redis.get(`quiz:${client.quizId}:${client.user.userId}:submitted`);
            if(isSubmitted) callback({success:false,message:"Quiz already submitted"});
            await redis.set(`quiz:${client.quizId}:${client.user.userId}:submitted`,new Date().toISOString());
            callback({success:true});
        }
        catch(err){
            callback({success:false,message:"Internal server error"});
        }
    };

export { roomJoinHandler, questionAttemptHandler, quizSubmissionHandler };

