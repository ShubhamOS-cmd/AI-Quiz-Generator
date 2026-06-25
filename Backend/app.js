import express from 'express';
import helmet from 'helmet';
import morgan  from 'morgan';
import cookieParser from 'cookie-parser';
import cors from "cors";
import logger from './src/config/logger.js';
import { redisConnection } from './src/jobs/email.queue.js';
import authRoute from "./src/routes/auth.routes.js";
import quizRoute from './src/routes/quiz.routes.js';
import ErroHandler from './src/middlewares/Error.middleware.js';
import {} from './src/jobs/Worker.js'
const app = express();

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
export default app;