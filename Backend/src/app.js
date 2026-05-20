import express from "express"
import cookieParser  from "cookie-parser";
// cookie parser is use for we can acess the cookie of user and also set the cookie
const app = express();

// app.use() is use for middleware or congiguration 

app.use(express.json({limit:"16kb"}))// this is use for to make limit of requesting data to 16kb

app.use(express.urlencoded({extended:true , limit : "16kb"})); // this is use for url encoded like if wes search fly plane then some url make this fly+plane or some make like fly%20plane

app.use(express.static("public"));

app.use(cookieParser())
export default app;