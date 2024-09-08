import mongoose, { model, Schema } from "mongoose";
import bcrypt from "bcrypt"
import jwt from "jsonwebtoken"

const userSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  fullName: {
    type: String,
    required: true,
    trim: true,
    index: true
  },
  password: {
    type: String,
    required: [true, "Password is required"]
  },
}, {timestamps: true})

userSchema.pre("save", async function(next){     // async cuz hashing takes time, next so that it can be passed to next request i.e. save
  if(!this.isModified("password")) return next(); // ensures this pre-MW only runs when password is modified

  this.password = await bcrypt.hash(this.password, 10)
  next()
})

userSchema.methods.isPasswordCorrect = async function(password) {
  return await bcrypt.compare(password, this.password)
}
userSchema.methods.generateAccessToken = function(){
  return jwt.sign( // jwt makes signature based on this payload
    {
      _id: this._id,
      email: this.email,
      username: this.username,
      fullName: this.fullName
    },
    process.env.ACCESS_TOKEN_SECRET,
    {
      expiresIn: process.env.ACCESS_TOKEN_EXPIRY
    }
  )
}
userSchema.methods.generateRefreshToken = function(){
  return jwt.sign( // jwt makes signature based on this payload
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    {
      expiresIn: process.env.REFRESH_TOKEN_EXPIRY
    }
  )
}

export const User = model("User", userSchema)