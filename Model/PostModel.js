/**
 * TODO
 * Each post should include:
 * Post identifier
 * Title
 * Topic
 * Timestamp
 * Message body
 * Post-expiration (expired post cant be liked or disliked)
 * Status of post (Live/Expired)
 * Post owner name (OP)
 * No. of likes/ comments
 * Others...
 */

const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

const validTopics = ["Politics", "Health", "Sport", "Tech"];
const PostSchema = mongoose.Schema({
  user: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  usersWhoLiked: [],
  usersWhoDisliked: [],
  likeCount: {
    type: Number,
    default: 0,
  },
  dislikeCount: {
    type: Number,
    default: 0,
  },
  comments: [],
  topic: {
    type: String,
    required: true,
    enum: validTopics,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  Post: mongoose.model("Post", PostSchema),
  Comment: mongoose.model("Comment", CommentSchema),
};
