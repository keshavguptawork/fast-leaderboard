import { Router } from "express";
import {
  addScore,
  getLeaderboard
} from "../controllers/score.controller.js";
// import { upload } from "../middlewares/multer.middleware.js"
// import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// http://localhost:3000/api/v1/users/register
router.route("/add-score").post(addScore) 
router.route("/leaderboard").get(getLeaderboard)

// secured routes: requires a loggedIn user
// router.route("/logout").post(verifyJWT, logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
// router.route("/current-user").get(verifyJWT, getCurrentUser)
// router.route("/change-password").post(verifyJWT, changeCurrentPassword)


export default router