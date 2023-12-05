const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  text: {
    type: String,
    required: true,
  },
  postCommented: {
    type: String,
    required: true,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

const validTopics = ["Politics", "Health", "Sport", "Tech"];
const PostSchema = mongoose.Schema({
  username: {
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
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = {
  Post: mongoose.model("Posts", PostSchema),
  Comment: mongoose.model("Comments", CommentSchema),
};
