import { ApiError } from "../utils/ApiError.js"
import * as z from 'zod';

const ErrorHandler = (err,req,res,next) => {
    if(err instanceof z.ZodError){
        return res.status(400).json({success:false,message:err.issues[0].message});
    }
    else if(err instanceof ApiError){
        return res.status(err.statusCode).json({success: false,message:err.message});
    }
    return res.status(500).json({success:false,message: "Internal server error"});
}

export default ErrorHandler;