import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken"
import mongoose from "mongoose";
import { asyncHandler } from "../utils/asyncHandler.utils.js";
import { ApiResponse } from "../utils/ApiResponse.utils.js";
import { ApiError } from "../utils/ApiError.utils.js"
import { User } from "../models/user.model.js" 
import { Score } from "../models/score.model.js";
// import {uploadOnCloudinary} from "../utils/cloudinaryUpload.utils.js"

const generateAccessAndRefreshToken = async(userId) => {
  try {
    const user = await User.findById(userId)
    const userAccessToken = user.generateAccessToken()
    const userRefreshToken = user.generateRefreshToken()

    user.refreshToken = userRefreshToken   // save refreshToken to db
    await user.save({validateBeforeSave: false}) // save user in db BUT no update existing

    return {userAccessToken, userAccessToken}

  } catch (error) {
      throw new ApiError(500, "Something went wrong while generating token")
  }
}

const registerUser = asyncHandler( async(req, res) => {
  // get user details from front end  
  const {fullName, email, username, password} = req.body 
  
  // validation like , not empty
  if(fullName.trim() === "" || email.trim() === "" || username.trim() === "" || password.trim() === ""){
    throw new ApiError(400, "All fields are required")
  }

  // check if user already exits based on username/email
  const existingUser = await User.findOne({ // using User mongoose model to find an object whcih has following username or email
    $or: [{ username }, { email }]
  })
  if(existingUser){
    throw new ApiError(409, "User already exists")
  }
  /* 
  // check for images, check for avatar
  const avatarLocalPath = req.files?.avatar[0]?.path       // chaining to see whether resources are available?
  

  if(!avatarLocalPath){
    throw new ApiError(400, "Avatar file is required!")
  }
  let coverImageLocalPath; // const coverImageLocalPath = req.files?.coverImage[0]?.path
  if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path
  }

  // upload them to cloudinary, validate avatar
  const avatar = await uploadOnCloudinary(avatarLocalPath)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!avatar){ 
    throw new ApiError(500, "Something went wrong while uploading avatar")
  }
 */
  // create user object - create entry in db
  const user = await User.create({
    fullName,
    email,
    username: username.toLowerCase() ,
    password
  })
  if(user){
    throw new ApiError(500, "Error while registering user")
  }
  
  const zeroScore = await Score.create({
    userId : user._id,
    username: username.toLowerCase(),
    score: 0
  })
  if(zeroScore){
    throw new ApiError(500, "Error while initializing score")
  }
  
  // check for user and response & remove password, refresh token
  const newUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if(!newUser){
    throw new ApiError(500, "Something went wrong while finding regitered user")
  }
  // check for zeroScore and respond if not available
  const zeroedScore = await Score.findById(zeroScore._id)
  if(!zeroedScore){
    throw new ApiError(500, "Something went wrong while initiating the user-score")
  }
  

  // return response
  return res.status(201).json(
    new ApiResponse(201, newUser, "User successfully registered!")
  )
  
})

const loginUser = asyncHandler( async(req, res) => {
  // extract data from req body
  const { username, email, password } = req.body

  // find if it is username or email
  if(!(username || email)){
    throw new ApiError(400, "Username or email is required")
  }

  // find the user in db, throw error if not
  const userFound = await User.findOne({
    $or: [{username}, {email}]
  })
  if(!userFound){
    throw new ApiError(404, "User does not exist!")
  }
  
  // password check
  const isPassValid = await userFound.isPasswordCorrect(password)
  if(!isPassValid){
    throw new ApiError(401, "Invalid user credential")
  }

  // generate access and refresh token
  const {userAccessToken, userRefreshToken} = await generateAccessAndRefreshToken(userFound._id)

  // send these tokens as cookies
  const loggedInUser = await User.findById(userFound._id).select("-password -refreshToken") // retrieve same user which has new data (tokens)
  const cookieFlags = { httpOnly: true, secure: true } // make cookies editable by server ONLY
  return res
    .status(200)
    .cookie("accessToken", userAccessToken, cookieFlags)
    .cookie("refreshToken", userRefreshToken, cookieFlags)
    .json(
      new ApiResponse(
        200, {
          user: loggedInUser,
          userAccessToken, 
          userRefreshToken,
        },
        "user loggedIn successfully"
      )
    )

}) 

const logoutUser = asyncHandler(async (req, res) => {
  // when above request is fired verifyJWT MW auto gets fired and gives reference
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined
      }
    },
    {
      new: true
    }
  )
  const cookieFlags = { httpOnly: true, secure: true }
  return res
    .status(200)
    .clearCookie("accessToken", cookieFlags)
    .clearCookie("refreshToken", cookieFlags)
    .json( new ApiResponse(200, {}, "User Logged Out"))
})

const refreshAccessToken = asyncHandler(async(req, res) =>{
  const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken
  if(!incomingRefreshToken){
    throw new ApiError(401, "Unauthorized request")
  }

  try {
    const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
  
    const user = await User.findById(decodedToken?._id)
    if(!user){
      throw new ApiError(401, "Invalid refresh token")
    }
  
    if(incomingRefreshToken !== user?.refreshToken){
      throw new ApiError(401, "Refresh token expired or used")
    }
  
    const cookieFlags = { httpOnly: true, secure: true }
    const {userAccessToken, userRefreshToken} = await generateAccessAndRefreshToken(user._id)
  
    return res
      .status(200)
      .cookie("accessToken", userAccessToken, cookieFlags)
      .cookie("refreshToken", userRefreshToken, cookieFlags)
      .json(
        new ApiResponse(
          200,
          {userAccessToken, userRefreshToken},
          "accessToken refreshed "
        )
      )
  } catch (error) {
      throw new ApiError(400, err?.message || "invalied refresh token")
  }

})

const changeCurrentPassword = asyncHandler(async(req, res) => {
  const {oldPassword, newPassword} = reqBody
  const user = await User.findById(req.user?._id)

  const isPasswordCorrect = user.isPassValid(oldPassword)

  if(!isPasswordCorrect){
    throw new ApiError(400, "Invalid old password!")
  }

  user.password = newPassword
  await user.save({validateBeforeSave: false})

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed succesfully"))
})

const getCurrentUser = asyncHandler(async(req, res) => {
  return res
    .status(200)
    .json(200, req.user, "Current user fetched successfully")

})

const updateAccountDetails = asyncHandler(async(req, res) => {
  const {fullName, email} = req.body
  if(!fullName || !email){
    throw new ApiError(400, "New full-name/email is required")
  }

  const user = User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        fullName,
        email
      }
    },
    {new: true}   // return new updated information
  ).select("-password")

  return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

})


export {
  registerUser, 
  loginUser, 
  logoutUser, 
  refreshAccessToken, 
  changeCurrentPassword, 
  getCurrentUser,
  updateAccountDetails
}