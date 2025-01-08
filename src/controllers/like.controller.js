import mongoose, {isValidObjectId} from "mongoose"
import { Video } from "../models/video.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { Tweet } from "../models/tweet.model.js"
import { Comment } from "../models/comment.model.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    const userId = req.user?._id

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, 'Invalid video ID');
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(400,"Video not found")
    }

    const isLiked = await Like.findOne({
        video: videoId,
        likedBy: userId
    })

    if(isLiked) {
        const unLiked = await Like.findByIdAndDelete(isLiked._id);

        return res.status(200).json(new ApiResponse(200, unLiked, "video Unliked"))
    } else{
        const liked = await Like.create({
            video: videoId,
            likedBy: userId
        });

        return res.status(200).json(new ApiResponse(200, liked, "video liked"))
    }
    
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    const userId = req.user?._id

    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400, 'Invalid comment ID');
    }

    const comment = await Comment.findById(commentId)

    if(!comment){
        throw new ApiError(400,"Comment not found")
    }

    const isLiked = await Like.findOne({
        comment: commentId,
        likedBy: userId
    })

    if(isLiked) {
        const unLiked = await Like.findByIdAndDelete(isLiked._id);

        return res.status(200).json(new ApiResponse(200, unLiked, "Comment Unliked"))
    } else{
        const liked = await Like.create({
            comment: commentId,
            likedBy: userId
        });

        return res.status(200).json(new ApiResponse(200, liked, "Comment liked"))
    }
})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    const userId = req.user?._id

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400, 'Invalid tweet ID');
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet){
        throw new ApiError(400,"Tweet not found")
    }

    const isLiked = await Like.findOne({
        tweet: tweetId,
        likedBy: userId
    })

    if(isLiked) {
        const unLiked = await Like.findByIdAndDelete(isLiked._id);

        return res.status(200).json(new ApiResponse(200, unLiked, "Tweet Unliked"))
    } else{
        const liked = await Like.create({
            tweet: tweetId,
            likedBy: userId
        });

        return res.status(200).json(new ApiResponse(200, liked, "Tweet liked"))
    }
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    const userId = req.user?._id
    
    const likedVideos = await Like.find({ likedBy: userId, video: { $exists: true } })
            .populate({
                path: 'video',
                model: Video, // Reference the Video model
                select: 'title thumbnail views owner', // Select only the fields you want to return
                populate: {
                    path: 'owner',
                    select: 'username fullName avatar', // Populate owner details
                }
            })
            .exec();

    if ( !likedVideos.length ) { throw new Apierror( 500, "Liked Videos Not Found!" ) }

    return res.status( 200 )
        .json( new ApiResponse( 200, { "totalVideos": likedVideos.length, "Videos": likedVideos }, "Videos found!" ) )
})

const getUsersWhoLikedVideos = asyncHandler(async (req, res) => {
    
    const { videoId } = req.params;
    
    const videoExists = await Video.findById(videoId);
    if (!videoExists) {
        return res.status(404).json({ message: 'Video not found' });
    }

    const likes = await Like.find({ video: videoId })
        .populate('likedBy', '_id username fullName avatar') // Populate the user details
        .exec(); // Execute the query

    // Extract user details from the populated likes
    const users = likes.map(like => like.likedBy);

    return res.status( 200 )
        .json( new ApiResponse( 200, { users }, "Users found who liked the video!" ) )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getUsersWhoLikedVideos,
}