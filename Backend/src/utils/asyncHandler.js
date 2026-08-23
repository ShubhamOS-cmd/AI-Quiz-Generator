const asyncHandler = (requestHandler) =>{
    return (req , res  , next) => {
        Promise.resolve(requestHandler(req , res , next)).catch((err)=>next(err))
    }
}
export {asyncHandler} // a helper that catches thrown/rejected errors in async route handler and forwards them to express error middleware so we don't need try catch on every route
