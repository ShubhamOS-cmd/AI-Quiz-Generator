import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import cookieParser from 'cookie-parser';
import { z } from 'zod';

import { User } from '../models/User.model.js';
import { redis } from '../redis/index.js';
import { emailQueue } from '../redis/queues/email.queue.js';

import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
// =====================================================
// VALIDATORS
// =====================================================

const passwordSchema = z
  .string()
  .min(8, { message: 'Password must be at least 8 characters long.' })
  .refine((p) => /[A-Z]/.test(p), {
    message: 'Password must contain at least one uppercase letter.',
  })
  .refine((p) => /[a-z]/.test(p), {
    message: 'Password must contain at least one lowercase letter.',
  })
  .refine((p) => /[0-9]/.test(p), {
    message: 'Password must contain at least one number.',
  })
  .refine((p) => /[!@#$%^&*?]/.test(p), {
    message: 'Password must contain at least one special character.',
  });

const otpRequestParser = z.object({
  email: z.string().trim().email({
    message: 'Provide valid e-mail',
  }),
  type: z.enum(['register', 'password-reset']),
});

const otpVerifyParser = z.object({
  email: z.string().trim().email({
    message: 'Provide valid e-mail',
  }),
  otp: z.string(),
  type: z.enum(['register', 'password-reset']),
});

const registerParser = z.object({
  username: z.string().trim().min(3),
  email: z.string().trim().email(),
  password: passwordSchema,
});

const loginParser = z.object({
  username: z.string().trim().min(1),
  password: z.string().min(1),
});

const passwordChangeParser = z.object({
  email: z.string().trim().email(),
  password: passwordSchema,
});

// =====================================================
// HELPERS
// =====================================================

const generateAccessToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.ACCESS_TOKEN,
    { expiresIn: '30m' }
  );
};

const generateRefreshToken = (userId) => {
  return jwt.sign(
    { userId },
    process.env.REFRESH_TOKEN,
    { expiresIn: '7d' }
  );
};

const setRefreshCookie = (res, token) => {
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
};
const setAccessCookie = (res , token) => {
  res.cookie('accessToken' , token , {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 60 * 1000,
  })
}
const hashOtp = (otp) => {
  return crypto
    .createHash('sha256')
    .update(otp)
    .digest('hex');
};

const otpRequest = asyncHandler(async(req , res) => { // OTP Request
    const parsed = otpRequestParser.parse(req.body);
    const { email, type } = parsed;
    const user = await User.findOne({ email });
    if (!user && type === 'password-reset') { 
      throw new ApiError(404 , "Email not found");
    }

    if (user && type === 'register') { 
      throw new ApiError(409 , "Email already exists");
    }

    const limitKey = `otp:${email}:${type}:limit`;

    const limit = await redis.incr(limitKey);

    if (limit === 1) {
      await redis.expire(limitKey, 60);
    }

    if (limit > 3) {
      throw new ApiError(429 , "Too Many Requests , Try again Later");
    }

    const otp = crypto.randomInt(100000, 999999).toString();

    const hashedOtp = hashOtp(otp);

    await redis.set(
      `otp:${email}:${type}`,
      hashedOtp,
      'EX',
      300
    );

    await emailQueue.add(
      'otp-mail',
      {
        to: email,
        subject: 'OTP Verification',
        body: `
          <div>
            <h2>Your OTP Code</h2>
            <h1>${otp}</h1>
            <p>This OTP expires in 5 minutes.</p>
          </div>
        `,
      },
      {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      }
    );
    return  res.status(200).json(new ApiResponse(200 , {otp: otp} ,`OTP sent for ${type}`));
})

// =====================================================
// OTP VERIFY
// =====================================================
const otpVerify = asyncHandler(async(req , res) =>{

    const  parsed = otpVerifyParser.parse(req.body);
    const {email , type , otp} = parsed;
    const user = await User.findOne({ email });

    if (user && type === 'register') {
      throw new ApiError(409 , "Email Already Exist");
    }

    if (!user && type === 'password-reset') {
      throw new ApiError(404 , "User not found");
    }

    const storedOtp = await redis.get(`otp:${email}:${type}`);

    if (!storedOtp) {
      throw new ApiError(410 , "OTP expired or not found");
    }

    const attemptsKey = `otp:${email}:${type}:attempts`;

    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, 300);
    }

    if (attempts > 5) {
      await redis.del(`otp:${email}:${type}`);
      throw new ApiError(429 , "Too many invalid attempts");
    }

    const hashedOtp = hashOtp(otp);

    if (hashedOtp !== storedOtp) {
      throw new ApiError(401 , 'Invalid OTP');
    }

    await Promise.all([
      redis.del(`otp:${email}:${type}`),
      redis.del(attemptsKey),
      redis.set(
        `otp:${email}:${type}:verified`,
        'verified',
        'EX',
        300
      ),
    ]);

    return res.status(200).json(new ApiResponse(200 , "OTP verifed Successfully"));
})

const register = asyncHandler(async(req , res)=>{
    const parsed = registerParser.parse(req.body);
    const {email , username , password} = parsed;
    const verified = await redis.get(
      `otp:${email}:register:verified`
    );

    if (!verified) {
      throw new ApiError(401 , "Email not verifed");
    }

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      throw new ApiError(409 , "Email or username already Exists");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await Promise.all([
      redis.del(`otp:${email}:register:verified`),
      redis.set(
        `user:${user._id}:refresh-token`,
        refreshToken,
        'EX',
        7 * 24 * 60 * 60
      ),
    ]);

    setRefreshCookie(res, refreshToken);
    // setAccessCookie(res , accessToken);
    return res.status(201).json(new ApiResponse(200 , 
      {accessToken: accessToken},
      'User registered successfully'
    ));
})
const login = asyncHandler(async(req , res) => {
    const parsed = loginParser.parse(req.body);

    const {username , password} = parsed;
    const attemptsKey = `login:${username}:attempts`;

    const attempts = await redis.incr(attemptsKey);

    if (attempts === 1) {
      await redis.expire(attemptsKey, 15 * 60);
    }

    if (attempts > 5) {
      throw new ApiError(429 , "Too Many login Attempts");
    }

    const user = await User.findOne({ username });

    if (!user) {
      throw new ApiError(401 , "Invalid credentials");
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      throw new ApiError(401 , "Invalid credentials");
    }

    await redis.del(attemptsKey);

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    await redis.set(
      `user:${user._id}:refresh-token`,
      refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    setRefreshCookie(res, refreshToken);
    // setAccessCookie(res , accessToken);
    return res.status(200).json( new ApiResponse(200,
      {accessToken: accessToken},
      'Logged in successfully',
    ));
})
const refresh = asyncHandler(async(req , res) => {
    const userId = req.userId;
    const refreshToken = req.cookies?.refreshToken;
    const storedToken = await redis.get(
      `user:${userId}:refresh-token`
    );

    if (!storedToken || storedToken !== refreshToken) {
      throw new ApiError(401 , "Invalid token");
    }

    const new_accessToken = generateAccessToken(userId);
    const new_refreshToken = generateRefreshToken(userId);

    await redis.set(
      `user:${userId}:refresh-token`,
      new_refreshToken,
      'EX',
      7 * 24 * 60 * 60
    );

    setRefreshCookie(res, new_refreshToken);
    // setAccessCookie(res , new_accessToken);
    return res.status(200).json(new ApiResponse(200 , {accessToken : new_accessToken} , "Refresh token generated"));
})

const changePassword = asyncHandler(async(req , res) => {
    const parsed = passwordChangeParser.parse(req.body);

    const {email , password} = parsed;
    const verified = await redis.get(
      `otp:${email}:password-reset:verified`
    );

    if (!verified) { // ...
     throw new ApiError(403 , "Email not verifed");
    }

    const user = await User.findOne({ email });

    if (!user) { // ...
      throw new ApiError(404 , "User not found");
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
    });

    await Promise.all([
      redis.del(`otp:${email}:password-reset:verified`),
      redis.del(`user:${user._id}:refresh-token`),
    ]);

    return res.status(200).json(new ApiResponse(200 , "Password change succefully"));
})

// LogOut
const logout = asyncHandler(async(req , res) => {
 
  const refreshToken = req.cookies?.refreshToken;
  const accessToken = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer " , "");
  if (!refreshToken) {
    throw new ApiError(401 , "Not refreshToken found");
  }
  try {
    const decodedRefresh = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN
    );

    if (req.userId !== decodedRefresh.userId) {
      throw new ApiError(401 , "Invalid Token Pair");
    }

    const decodedAccess = jwt.decode(accessToken);
    const remainingTime =
      decodedAccess.exp - Math.floor(Date.now() / 1000);

    await Promise.all([
      remainingTime > 0
        ? redis.set(
            `blacklist:${accessToken}`,
            'blacklisted',
            'EX',
            remainingTime
          )
        : Promise.resolve(),

      redis.del(
        `user:${req.userId}:refresh-token`
      ),
    ]);

    res.clearCookie('refreshToken');
    // res.clearCookie('accessToken');
    return res.status(200).json(new ApiResponse(200 , null,"LogOut successfully"));
  } catch (err) {
    if (
      err.name === 'JsonWebTokenError' ||
      err.name === 'TokenExpiredError'
    ) {
      throw new ApiError(400 , err.message);
    }

    throw new Error("Internal server issues");
  }
})

// =====================================================
// PROTECTED ROUTE EXAMPLE
// =====================================================

// app.get('/profile', authMiddleware, async (req, res) => {
//   try {
//     const user = await Users.findById(req.userId).select('-password');

//     return res.status(200).json({
//       user,
//     });
//   } catch (err) {
//     return res.status(500).json({
//       message: 'Internal server error',
//     });
//   }
// });

export {
  otpRequest,
  otpVerify,
  register,
  login,
  logout,
  refresh,
  changePassword
}