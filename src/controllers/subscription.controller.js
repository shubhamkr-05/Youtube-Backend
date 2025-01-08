import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    const userId = req.user?._id;
    if (!channelId || !isValidObjectId(channelId)) {
        throw new ApiError(400, "Channel Id is not valid");
    }

    if (channelId.toString() === userId.toString()) {
        throw new ApiError(400, "Cannot subscribe to your own channel");
    }

    const isSubscribed = await Subscription.findOne({
        subscriber: userId,
        channel: channelId
    })

    if(isSubscribed){
        const unsubscribe = await Subscription.findByIdAndDelete(isSubscribed)

        if(!unsubscribe){
            throw new ApiError(500,"Error while unsubscribing")
        }
    } else{
        const subscribe = await Subscription.create({
            subscriber: userId,
            channel: channelId
        })
        if(!subscribe){
            throw new ApiError(500,"Error while subscribing")
        }
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Subscription toggled"
    ));

})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "Channel id is not valid");
    }

    const subscribers = await Subscription.aggregate([
        {
            $match: {
                channel: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "users",
                foreignField: "_id",
                localField: "subscriber",
                as: "subscribers"
            }
        },
        {
            $addFields: {
                subscribers : {
                    $first: "$subscribers"
                }
            }
        },
        {
            $group: {
                _id: null,
                subscribers: { $push: "$subscribers" },
                totalSubscribers: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                subscribers: {
                    _id: 1,
                    username: 1,
                    avatar: 1,
                    fullName: 1,
                },
                subscribersCount: "$totalSubscribers",
            },
        }
    ])
    if (!subscribers) {
        throw new ApiError(404, "Subscribers not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribers,
                "Subscribers fetched successfully"
            )
        );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const userId = req.user?._id;

    if (!userId || !isValidObjectId(userId)) {
        throw new ApiError(400, "No valid subscriber Id found");
    }

    const subscribedChannels = await Subscription.aggregate([
        {
            $match: {
                subscriber: new mongoose.Types.ObjectId(userId),
            },
        },
        {
            $lookup: {
                from: "users",
                localField: "channel",
                foreignField: "_id",
                as: "channels",
            },
        },
        {
            $addFields: {
                channels: {
                    $first: "$channels",
                },
            },
        },
        {
            $group: {
                _id: null,
                channels: { $push: "$channels" },
                totalChannels: { $sum: 1 },
            },
        },
        {
            $project: {
                _id: 0,
                channels: {
                    _id: 1,
                    username: 1,
                    fullName: 1,
                    avatar: 1,
                },
                channelsCount: "$totalChannels",
            },
        },
    ]);

    if (!subscribedChannels) {
        throw new ApiError(404, "Channels not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(
                200,
                subscribedChannels,
                "Subscribed channels fetched successfully"
            )
        );
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}