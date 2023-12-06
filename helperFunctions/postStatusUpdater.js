const { Post } = require("../Model/PostModel");
const express = require("express");
// a helper function that solely 'refreshes and updates' all posts' status
const updateAllStatus = async () => {
  try {
    await Post.updateMany(
      { expiryDate: { $lte: new Date() } },
      { $set: { expiryStatus: "Expired" } }
    );
  } catch (error) {
    return res.status(400).send({ error });
  }
};

// a function that checks and updates the post's status and returns the post
const updateOneStatus = async (req) => {
  try {
    // find the post using its ID
    const post = await Post.findOne({
      _id: req.params.postId,
    });
    // if the post has expired, update it status to "Expired"
    if (new Date() >= post.expiryDate) {
      const updatedPost = await Post.findOneAndUpdate(
        { _id: req.params.postId },
        { $set: { expiryStatus: "Expired" } },
        { returnDocument: "after" }
      );
      return updatedPost;
    }
    // if not expired, return the post as it is
    return post;
  } catch (error) {
    return res.status(400).send({ error });
  }
};

module.exports = { updateAllStatus, updateOneStatus };
