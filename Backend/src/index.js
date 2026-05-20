import dotenv from "dotenv"
import connectDB from "./db/index.js";
import app from "./app.js";

dotenv.config({
    path : './.env'
})
connectDB()
.then(()=>{

    app.on("error",(err)=>{ // this error for if our app is not connected to databases
        console.log("Error is founding to connected app to databse");
            throw err
    });
    app.listen(process.env.PORT || 8000 , ()=>{
        console.log(`Server is running at port : ${process.env.PORT}`);
        
    })
})
.catch((err)=>{ // this error for if we not get connected to db
    console.log("Mongo db connection failed !!! ",err);
})