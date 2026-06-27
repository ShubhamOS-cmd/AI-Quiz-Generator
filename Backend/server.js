import app from './app.js';
import connectDB from './src/config/db.js';
import dotenv from 'dotenv';dotenv.config();

const PORT = process.env.PORT || 8000;

const start = async () => {
    await connectDB();
    app.listen(PORT,(req,res) => {
        console.log(`Server started at port : ${process.env.PORT}`);
    });
}

await start();