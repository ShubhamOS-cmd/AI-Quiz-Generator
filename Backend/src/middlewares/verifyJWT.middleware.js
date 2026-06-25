import jwt from 'jsonwebtoken';
import { redisConnection as redis } from '../jobs/email.queue.js';

export const verifyJWT = async (req, res, next) => {
  console.log(req.cookies ,  req.headers);
  // const authHeader = req.headers.authorization;

  // if (!authHeader || !authHeader.startsWith('Bearer ')) {
  //   return res.status(401).json({
  //     message: 'Unauthorized',
  //   });
  // }

  const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
  if(!token){
    return res.status(401).json({
      message : "Unauthorized",
    })
  }

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN);

    const blacklisted = await redis.get(`blacklist:${token}`);

    if (blacklisted) {
      return res.status(401).json({
        message: 'Token invalidated',
      });
    }

    req.userId = decoded.userId;

    next();
  } catch (err) {
    return res.status(401).json({
      message: 'Invalid token',
    });
  }
};