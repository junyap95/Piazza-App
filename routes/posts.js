const express = require("express");
const router = express.Router();
const { Post, Comment } = require("../Model/PostModel");
const UserModel = require("../Model/UserModel");
const verify = require("../verifyToken");
// const likeOrDislikePostHandler = require("../likeDislikeHelper");

// 1. POST (write post)
router.post("/write", verify, async (req, res) => {
  const getUser = await UserModel.findById(req.user._id);
  if (!getUser) {
    return res.status(404).send({ message: "User not found, please log in" });
  }

  // to log the expiry date
  const todaysDate = new Date();
  const expiryDate = new Date().setMinutes(todaysDate.getMinutes() + 60);

  // a json obj for database
  const piazzaData = new Post({
    // extract what the user gave
    user: getUser.username,
    title: req.body.title,
    text: req.body.text,
    topic: req.body.topic,
    expiryDate,
  });
  try {
    const postToBeSaved = await piazzaData.save();
    res.send(postToBeSaved);
  } catch (error) {
    // good practice to send back json obj
    res.status(400).send({ message: error.errors });
  }
});

// 2. GET (read post)
router.get("/read/:postId", async (req, res) => {
  try {
    const getPostById = await Post.findById(req.params.postId);
    res.send(getPostById);
  } catch (err) {
    res.send({ message: err.name });
  }
});

// 2. GET (browse post by topic)
router.get("/browse/:topic", async (req, res) => {
  try {
    const getPostByTopic = await Post.find({
      topic: req.params.topic,
    });
    if (getPostByTopic.length === 0) {
      return res.send({ message: "No posts here..." });
    }
    return res.send(getPostByTopic);
  } catch (error) {
    return res.send({ message: error });
  }
});

// GET (expired topics)
router.get("/expired/:topic", verify, async (req, res) => {
  try {
    const todaysDate = new Date();
    const expiredPosts = await Post.find({
      topic: req.params.topic,
      expiryDate: { $lt: todaysDate },
    });
    if (expiredPosts.length === 0) {
      return res.status(404).send({ message: "No post here..." });
    }
    return res.send(expiredPosts);
  } catch (error) {
    return res.status(400).send({ message: error });
  }
});

// A function to be used by the like and dislike route to prevent code duplication
const likeOrDislikePostHandler = async (req, res, usersAction) => {
  try {
    // get post and to compare dates
    const userPost = await Post.findById(req.params.postId);

    const todaysDate = new Date();
    const expiryDate = userPost.expiryDate;
    const isExpired = todaysDate >= expiryDate;

    // the first var finds the user who posted this post
    // the second var finds the user who has been verified, note req.user._id comes from the verify function in routes
    const originalPoster = userPost.user;
    const getUser = await UserModel.findById(req.user._id);

    const likesArray = userPost.usersWhoLiked;
    const dislikesArray = userPost.usersWhoDisliked;

    // Users cannot like an expired post and his/her own post
    if (isExpired) {
      return res.status(403).send("Sorry, this post has expired...");
    }
    if (originalPoster === getUser.username) {
      return res
        .status(403)
        .send("Sorry, you cannot like/dislike your own post!");
    }

    // a placeholder to be used to update the post
    const updatePost = {};

    // these conditions are to ensure no user can perform both like and dislike on one post
    if (usersAction === "like" && !likesArray.includes(getUser.username)) {
      updatePost.$addToSet = { usersWhoLiked: getUser.username };
      if (dislikesArray.includes(getUser.username)) {
        updatePost.$pull = { usersWhoDisliked: getUser.username };
      }
    } else if (
      usersAction === "dislike" &&
      !dislikesArray.includes(getUser.username)
    ) {
      updatePost.$addToSet = { usersWhoDisliked: getUser.username };
      if (likesArray.includes(getUser.username)) {
        updatePost.$pull = { usersWhoLiked: getUser.username };
      }
    }
    // update the the array for users who like/ dislikes first
    await Post.findOneAndUpdate({ _id: req.params.postId }, updatePost);

    // get updated post with username pushed into like/dislike array
    const newCounter = await Post.findById(req.params.postId);
    updatePost.$set = {
      likeCount: newCounter.usersWhoLiked.length,
      dislikeCount: newCounter.usersWhoDisliked.length,
    };

    // update the likeCount and dislikeCount second, because only when array is initialised then its length can be computed
    await Post.findOneAndUpdate({ _id: req.params.postId }, updatePost);
    // to return the final updated post per request
    const updatedPost = await Post.findById(req.params.postId);
    return res.send(updatedPost);
  } catch (error) {
    return res.status(400).send({ message: error });
  }
};

// 3. PATCH (like post)
router.patch("/like/:postId", verify, async (req, res) => {
  return likeOrDislikePostHandler(req, res, "like");
});

// 4. PATCH (dislike post)
router.patch("/dislike/:postId", verify, async (req, res) => {
  return likeOrDislikePostHandler(req, res, "dislike");
});

// 5. PATCH (Comment on post. Logged in user only)
router.patch("/comment/:postId", verify, async (req, res) => {
  // do i need this?
  const getUser = await UserModel.findById(req.user._id);
  if (!getUser) {
    return res.status(404).send({ message: "User not found, please log in" });
  }
  const userComment = new Comment({
    user: getUser.username,
    text: req.body.text,
  });

  try {
    const userPost = await Post.findById(req.params.postId);
    const todaysDate = new Date();
    const expiryDate = userPost.expiryDate;
    const isExpired = todaysDate >= expiryDate;
    if (!isExpired) {
      await Post.findOneAndUpdate(
        { _id: req.params.postId },
        {
          $push: {
            comments: userComment,
          },
        }
      );
    } else {
      return res
        .status(403)
        .send("Sorry! You cannot comment on an expired Post!");
    }
    const updatedPost = await Post.findById(req.params.postId);
    res.send(updatedPost);
  } catch (error) {
    return res.status(400).send({ message: error });
  }
});

// 6. GET (sort topic by highest interest)
router.get("/sort/:topic", verify, async (req, res) => {
  try {
    const result = await Post.aggregate([
      {
        $match: {
          topic: req.params.topic,
        },
      },
      {
        $addFields: {
          combinedCount: { $sum: ["$likeCount", "$dislikeCount"] },
        },
      },
      {
        $sort: { combinedCount: -1 },
      },
      {
        $limit: 1,
      },
    ]);
    return res.send(result[0]);
  } catch (error) {
    return res.status(400).send({ message: error });
  }
});

// for testing only
router.delete("/delete", async (req, res) => {
  try {
    await Post.deleteMany({});
    return res.send("deleted");
  } catch (error) {
    return res.send({ message: error });
  }
});

module.exports = router;
