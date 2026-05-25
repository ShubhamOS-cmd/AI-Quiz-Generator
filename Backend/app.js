import express from 'express';
import helmet from 'helmet';
import morgan  from 'morgan';
import cookieParser from 'cookie-parser';
import cors from "cors";
import logger from './src/config/logger.js';

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

// Add all routes here one by one
app.get("/",(req,res) => { 
    return res.json({message:"Serve is Working"}); 
})

// Add 404 handler 


// Add error handler

export default app;