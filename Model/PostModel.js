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
  postIdCommented: {
    type: String,
    required: true,
  },
  commentId: { type: String },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

const validTopics = ["Politics", "Health", "Sports", "Tech"];
const PostSchema = mongoose.Schema({
  username: {
    type: String,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  topic: {
    type: String,
    required: true,
    enum: validTopics,
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
  expiryDate: {
    type: Date,
    required: true,
  },
  expiryStatus: {
    type: String,
    default: "Live",
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
