import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"Tweet is required")
    }

    const tweet = await Tweet.create({
        content : content,
        owner: userId
    })

    if(!tweet){
        throw new ApiError(500,"Error while creating the tweet")
    }
    
    return res.status(200).json(
        new ApiResponse(200,tweet,"Tweet created successfully")
    )
})

const getUserTweets = asyncHandler(async (req, res) => {
    const userId = req.user._id

    if(!userId || !isValidObjectId(userId)){
        throw new ApiError(400, "No valid user Id found");
    }

    const tweets = await Tweet.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "details",
                pipeline: [
                    {
                        $project: {
                            username: 1,
                            fullName: 1,
                            avatar: 1,
                            _id: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "tweet",
                as: "likes"
            }
        },
        {
            $addFields: {
                likesCount: {
                    $size: "$likes"
                }
            }
        },
        {
            $project: {
                _id: 1,
                username: 1,
                fullName: 1,
                avatar: 1,
                content: 1,
                owner: 1,
                likesCount: 1
            }
        }
    ])

    if(!tweets.length){
        throw new ApiError(400,"Twwets not found")
    }

    return res.status(200).json(
        new ApiResponse(200,tweets,"Tweets fetched successfully")
    )
})

const updateTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;
    const {content} = req.body;
    
    if(!content){
        throw new ApiError(400,"Tweet is required")
    }
    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet id")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(500, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"You do not have permission to update this comment")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {content}
        },
        {
            new: true
        }
    ) 

    if(!updatedTweet) {
        throw new ApiError(500, "Error while updating the tweet");
    }

    return res.
    status(200).
    json(
        new ApiResponse(
            200,
            updatedTweet,
            "Tweet updated successfully"
        )
    )
})

const deleteTweet = asyncHandler(async (req, res) => {
    const {tweetId} = req.params;

    if(!tweetId || !isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid Tweet id")
    }

    const tweet = await Tweet.findById(tweetId);

    if (!tweet) {
        throw new ApiError(500, "Tweet not found");
    }

    if (tweet.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"You do not have permission to update this tweet")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId);

    if(!deletedTweet){
        throw new ApiError(500,"Error while deleting the tweet")
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Tweet deleted successfully"
    ))
})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}