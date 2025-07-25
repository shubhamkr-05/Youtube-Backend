import { Router } from "express";
import {
  getLikedVideos,
  toggleCommentLike,
  toggleVideoLike,
  toggleTweetLike,
  getUsersWhoLikedVideos,
} from "../controllers/like.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle/v/:videoId").post(verifyJWT, toggleVideoLike);
router.route("/toggle/c/:commentId").post(verifyJWT, toggleCommentLike);
router.route("/toggle/t/:tweetId").post(verifyJWT, toggleTweetLike);
router.route("/videos").get(verifyJWT, getLikedVideos);
router.route("/likedByUsers/:videoId").get(getUsersWhoLikedVideos);

export default router;
