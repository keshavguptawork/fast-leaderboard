import mongoose, { model, Schema } from "mongoose";
// import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const scoreSchema = new Schema({
  score: {
    type: Number, 
    required: true
  },
  username: {
    type: String,
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }

}, {timestamps: true})

// scoreSchema.plugin(mongooseAggregatePaginate) // will be used to write complex queries

export const Score = model("Score", scoreSchema)