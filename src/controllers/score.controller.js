import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js"
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { User } from "../models/user.model.js" 
import { Score } from "../models/score.model.js"
import { addInRedisLB, getRedisLB } from "../middlewares/inMemoryLeaderboard.middleware.js";

// _ add-score endpoint
const addScore = asyncHandler(async (req, res) => {
  const t0 = new Date().getTime()
  // get user and score details from front end  
  const { username, score } = req.body

  // validation like , not empty
  if (username.trim() === "" || score === "") {
    throw new ApiError(400, "All fields are required")
  }

  // expensive calculate score function here
  
  // add scores to db  
  const addedScore = await Score.updateOne(
    { username: username },
    { $inc: { score: parseInt(score) } },
    { new: true}
  )
  if (!addedScore) {
    throw new ApiError(500, "Error while updating leaders in db.")
  }
  
  // calculate new rankings
  const newLeaders = await Score.find({})?.sort({ score: -1 }).select("username score -_id")
  if (!newLeaders) {
    throw new ApiError(500, "Error while fetching leaders from db.")
  }
  
  // add new-leaders to redis-server which publishes it to all subscribers
  const redisLeaderBoard = addInRedisLB(newLeaders)
  if (!redisLeaderBoard) {
    throw new ApiError(500, "Error while adding leaders to redis.")
  }

  const t1 = new Date().getTime()
  const responseTime = `${t1 - t0}ms`
  console.log(`>>> Source: MongoDB | Response Time: ${responseTime}`);

  // return response
  return res.status(201).json(
    new ApiResponse(201, newLeaders, "Score successfully updated!")
  )
})

// view-all-leaders
const getLeaderboard = async (req, res) => {
  const t0 = new Date().getTime()
  const redisLeaderBoard = await getRedisLB()
  
  if (JSON.stringify(redisLeaderBoard) === "{}") {
    const newLeaders = await Score.find({})?.sort({ score: -1 }).select("username score -_id")

    if (!newLeaders) {
      throw new ApiError(500, "Error while fetching leaders from db.")
    }
    
    // add new-leaders to redis-server which publishes it to all subscribers
    addInRedisLB(newLeaders)
    const redisLeaderBoard = await getRedisLB()
    /* 
    if (!redisLeaderBoard) {
      throw new ApiError(500, "Error while adding leaders to redis.")
    } */


    const t1 = new Date().getTime()
    const responseTime = `${t1 - t0}ms`
    console.log(`>>> Source: MongoDB | Response Time: ${responseTime}`);
    
    return res
      .status(200)
      .json(new ApiResponse(200, redisLeaderBoard, "Fetched LeaderBoard from MongoDB successfully"))
  }


  const t1 = new Date().getTime()
  const responseTime = `${t1 - t0}ms`
  console.log(`>>> Source: Redis | Response Time: ${responseTime}`);
  
  return res
    .status(200)
    .json(new ApiResponse(200, redisLeaderBoard, "Fetched LeaderBoard from Redis successfully"))

}

// update-recipe
/*
// const updateRecipe = asyncHandler( async(req, res) => {
//   const {username} = req.params
//   if(!username?.trim()){
//     throw new ApiError(400, "Username is missing")
//   }
//   const channel = User.aggregate([
//     {
//       $match: { username : username?.toLowerCase() } // FINDS THE USER
//     },
//     {
//       $lookup: // FINDS USER"S SUBSCRIBER
//         { from: "subscription", /*mongo autoconverts db name*/  
//           localField: "_id",
//           foreignField: "channel",
//           as: "subscribers"  // goes into addField
//         }
//     },
//     {
//       $lookup: // FINDS CHANNELS to which USER HAS SUBSCRIBED
//         { from: "subscription", /*mongo autoconverts db name*/  
//           localField: "_id",
//           foreignField: "subscriber",
//           as: "subscribedTo"  // goes into addField
//         }
//     },
//     {
//       $addFields: // ADD FIELDS IN FIRST QUERY
//       { subscribersCount: { $size:"$subscriber" },
//         channelsSubscribedToCount: { $size:"subscribedTo" },
//         isSubscribed: 
//         { $cond: 
//           { if: { $in: [req.user?._id, "$subscribers.subscriber"] },
//             then: true,
//             else: false
//           } 
//         }
//       }
//     },
//     {
//       $project: // Tells mongo to send selected members only
//       {
//         fullName: 1,
//         username: 1,
//         subscribersCount: 1,
//         channelsSubscribedToCount: 1,
//         isSubscribed: 1,
//         avatar: 1,
//         coverImage: 1,
//         email: 1
//       }
//     }
//   ]) // return a document/ array of objects
//   if(!channel?.length){
//     throw new ApiError(400, "channel does not exist")
//   }

//   return res
//     .status(200)
//     .json(
//       new ApiResponse(200, channel[0], "user channel fetched succesfully")
//     )
// }) */

// new-recipe-list
/* const newRecipeList = asyncHandler( async(req, res) => {
  const user = User.aggregate([
    {
      $match: {
        _id : new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "recipes",
        localField: "watchHistory",
        foreignField: "_id",
        as: "WatchHistory",
        pipeline:[
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [{
                $project: { fullName: 1, username: 1, avatar: 1 }
              }]
            }
          },
          {
            $addFields: {
              owner: {
                $first : "$owner"
              }
            }
          }
        ]
      }
    } 
  ])
  if(!user){
    throw new ApiError(400, "User Watch history not found")
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200, user[0].watchHistory, "User WatchedHistory fetched succesfuly"
      )
    )
}) */

export {
  addScore,
  getLeaderboard,
}