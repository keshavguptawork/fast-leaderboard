import { Router } from "express";
import {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  changeCurrentPassword
} from "../controllers/user.controller.js";
// import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()

// http://localhost:3000/api/v1/users/register
router.route("/register").post(registerUser) 
router.route("/login").post(loginUser)

// secured routes: requires a loggedIn user
router.route("/logout").post(verifyJWT, logoutUser)
// router.route("/refresh-token").post(refreshAccessToken)
router.route("/current-user").get(verifyJWT, getCurrentUser)
router.route("/change-password").post(verifyJWT, changeCurrentPassword)


export default router