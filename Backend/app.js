import express from 'express';
import helmet from 'helmet';
import morgan  from 'morgan';
import cookieParser from 'cookie-parser';
import cors from "cors";
import logger from './src/config/logger.js';
import { redis } from './src/redis/index.js';
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
    const reply = await redis.ping();
    res.json({message_redis: `Redis replied ${reply}`});
})


import authRoute from "./src/routes/auth.routes.js";
app.use('/api/v1/auth' , authRoute);
export default app;