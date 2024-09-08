// const redis = require('./redisClient.middleware.js')
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import redis from "./redisClient.middleware.js"

const addInRedisLB = asyncHandler( async ( leaders ) => {    
    // makes entry for leaders and their scores
  redis.flushall()
  const lead = await leaders.forEach(leader => {  
    redis.hset("leaders", leader.username, leader.score)
  });
    return lead
    // add request limiter
    /* if (requests > score){
      return res.status(503)
        .json({
          response: 'error',
          callsInAMinute: requests,
          ttl
        })
    } else {
      req.requests = requests
      req.ttl = ttl
      next()
    } */
})

const getRedisLB = async (req, res, next) => {
  try {
    const redisLB = await redis.hgetall("leaders"); 
    return redisLB  
  } catch (err) {
    throw new Error(err);  
  }
};

export { addInRedisLB, getRedisLB }