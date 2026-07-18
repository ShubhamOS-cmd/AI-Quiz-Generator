import jwt from 'jsonwebtoken';

const SocketMiddleware =  (client,next) => {
    const token = client.handshake.auth.token;
    if(!token) return next(new Error("Unauthorized"));
    try {
       const payload = jwt.verify(token,process.env.ACCESS_TOKEN);
       client.user = payload;
       next();
    }
    catch(err){
        return next(new Error("Unauthorized"));
    }
};

