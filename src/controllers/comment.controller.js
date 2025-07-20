import mongoose, { isValidObjectId } from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { query } from "express"
import {Video} from "../models/video.model.js"


const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    if (!videoId || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id");
    }

    // Fetch comments with populated owner info
    const comments = await Comment.find({ video: videoId })
        .populate({
            path: "owner",
            select: "username fullName avatar",
        })
        .sort({ createdAt: -1 }) // Optional: sort newest first
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .lean(); // Convert to plain JS objects

    if (!comments || comments.length === 0) {
        throw new ApiError(404, "No comments found");
    }

    // Extract all comment IDs
    const commentIds = comments.map((c) => c._id);

    // Count likes for each comment
    const likeCounts = await mongoose.model("Like").aggregate([
        {
            $match: { comment: { $in: commentIds } }
        },
        {
            $group: {
                _id: "$comment",
                count: { $sum: 1 }
            }
        }
    ]);

    // Map of commentId => likeCount
    const likeMap = {};
    likeCounts.forEach((like) => {
        likeMap[like._id.toString()] = like.count;
    });

    // Add likesCount to each comment
    const commentsWithLikes = comments.map((c) => ({
        ...c,
        likesCount: likeMap[c._id.toString()] || 0
    }));

    return res.status(200).json(
        new ApiResponse(
            200,
            commentsWithLikes,
            "Comments fetched successfully"
        )
    );
});

const addComment = asyncHandler(async (req, res) => {
    const {videoId} = req.params;
    const userId = req.user?._id;
    const {content} = req.body;

    if(!content){
        throw new ApiError(400,"Comment is required")
    }

    if(!videoId || !isValidObjectId(videoId)){
        throw new ApiError(400, "Invalid Video Id");
    }

    const comment = await Comment.create({
        content : content,
        video: videoId,
        owner: userId
    })

    if(!comment) {
        throw new ApiError(500, "Error while adding comment");
    }

    return res.
    status(200).
    json(
        new ApiResponse(
            200,
            {comment, userId, videoId},
            "Comment added successfully"
        )
    )

})

const updateComment = asyncHandler(async (req, res) => {
    const {content} = req.body;
    const {commentId} = req.params;

    if(!content){
        throw new ApiError(400,"Comment is required")
    }
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment id")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(500, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"You do not have permission to update this comment")
    }

    const updatedComment = await Comment.findByIdAndUpdate(
        commentId,
        {
            $set: {content}
        },
        {
            new: true
        }
    ) 

    if(!updatedComment) {
        throw new ApiError(500, "Error while updating the comment");
    }

    return res.
    status(200).
    json(
        new ApiResponse(
            200,
            updatedComment,
            "Comment updated successfully"
        )
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    const {commentId} = req.params;
    if(!commentId || !isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid Comment id")
    }

    const comment = await Comment.findById(commentId);

    if (!comment) {
        throw new ApiError(500, "Comment not found");
    }

    if (comment.owner.toString() !== req.user?._id.toString()) {
        throw new ApiError(401,"You do not have permission to update this comment")
    }

    const deletedComment = await Comment.findByIdAndDelete(commentId);

    if(!deletedComment){
        throw new ApiError(500,"Error while deleting the comment")
    }

    return res.status(200).json(new ApiResponse(
        200,
        {},
        "Comment deleted successfully"
    ))

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
     deleteComment
    }