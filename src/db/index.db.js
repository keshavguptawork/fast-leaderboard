import mongoose from "mongoose"

const connectDB = async() => {
  try {
    const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/fast-leaderboard`) // mongoose gives response when req is done
    console.log(`>>> MongoDB connected !! DB host: ${connectionInstance.connection.host}`); // read about connectionInstance of MongoDB
    
  } catch (error) {
    console.log(">>> MongoDB conn FAILED!!! : ", error);
    process.exit(1) // exit strategy provided by node's process
  }
}

export default connectDB