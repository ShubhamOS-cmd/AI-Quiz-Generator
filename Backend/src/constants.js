export const COOKIE_OPTIONS = {
    httpOnly:true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'none',
    maxAge: 7*24*60*60*1000
}

export const ACCESS_TOKEN_EXPIRY = "30m";
export const REFRESH_TOKEN_EXPIRY = "7d";
export const REFRESH_TOKEN_TTL = 7*24*60*60;

export const ERRORS = {
    BAD_REQUEST: "Bad request",
    INTERNAL_SERVER_ERROR: "Internal server error",
    TOO_MANY_REQUESTS: "Too many requests. Try again later.",

    INVALID_CREDENTIALS: "Invalid credentials.",
    INVALID_TOKEN: "Invalid token",
    EXPIRED_TOKEN: "Token expired",
    NO_REFRESH_TOKEN: "No refresh token",
    UNAUTHORIZED: "Unauthorized",

    EMAIL_NOT_FOUND: "Email not found",
    EMAIL_EXISTS: "Email already exists!",
    USERNAME_OR_EMAIL_EXISTS: "Email or username already exists",

    OTP_INVALID: "Otp is invalid",
    OTP_EXPIRED: "Otp not found or expired. Try again!",
    OTP_TOO_MANY_ATTEMPTS: "Too many attempts. Generate new OTP",
    OTP_NOT_VERIFIED: "Email not verified",

    QUIZ_TOO_MANY_ATTEMPTS: "Too many attempts. Try again after some time.",
    INVALID_QUIZ_TOPIC: "Please provide a valid topic or prompt.",
    QUIZ_ENDED:"Can't submit after the quiz has ended.",
    QUIZ_EARLIER_ACCESS:"Quiz is not started yet.",
    MULTIPLE_QUESTION_ATTEMPTS:"Question can't be attempted twice.",
}