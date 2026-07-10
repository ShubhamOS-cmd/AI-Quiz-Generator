import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import helmet from 'helmet';
import morgan  from 'morgan';
import cookieParser from 'cookie-parser';
import cors from "cors";
import logger from './src/config/logger.js';
import { redis } from './src/config/redis.js';
import authRoute from "./src/routes/auth.routes.js";
import quizRoute from './src/routes/quiz.routes.js';
import ErroHandler from './src/middlewares/Error.middleware.js';
import {roomJoinHandler , questionAttemptHandler , quizSubmissionHandler} from "./src/controllers/socket.controller.js"
import {} from './src/jobs/Worker.js'
const app = express();

const server = http.createServer(app);
const io = new Server(server,{
    cors:{origin : "*"}
})

app.use(helmet());
app.use(cors());
app.use(morgan('combined',{
    stream : { write : (message) => logger.info(message.trim())}
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.set('trust proxy',true);


app.get("/",(req,res) => { 
    return res.json({message:"Serve is Working"}); 
})
app.get("/redis" , async(req , res)=>{
    const reply = await redisConnection.ping();
    res.json({message_redisConnection: `redisConnection replied ${reply}`});
})


app.use('/api/v1/auth' , authRoute);

app.use('/quiz',quizRoute);


app.use(ErroHandler);

// Socket starts here

io.use(SocketMiddleware);


io.on("connection",(client) => {
    // console.log("A new client connected", client.id);

    client.on("join-room",roomJoinHandler);

    client.on("qAtempt", questionAttemptHandler);

    client.on("submit", quizSubmissionHandler);

    client.on("disconnect",() => {
        client.user = null;
        client.quizId = null;
    })
})


export default server;