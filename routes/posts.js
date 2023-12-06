const express = require("express");
const router = express.Router();
const { Post, Comment } = require("../Model/PostModel");
const User = require("../Model/UserModel");
const verify = require("../validations/verifyToken");
const likeOrDislikePostHandler = require("../helperFunctions/likeOrDislikePostHandler");
const {
  updateAllStatus,
  updateOneStatus,
} = require("../helperFunctions/postStatusUpdater");

// 1. POST (write a new post)
router.post("/write", verify, async (req, res) => {
  const userInfo = await User.findById(req.user._id);
  if (!userInfo) {
    return res.status(404).send({ error: "User not found!" });
  }

  // The expiry date which is 5 minutes starting from when the post is created
  const todaysDate = new Date();
  const expiryDate = new Date().setMinutes(todaysDate.getMinutes() + 5);

  // a json obj for database
  const piazzaData = new Post({
    username: userInfo.username,
    title: req.body.title,
    text: req.body.text,
    topic: req.body.topic,
    expiryDate: expiryDate,
  });

  try {
    const postToBeSaved = await piazzaData.save();
    res.send(postToBeSaved);
  } catch (error) {
    res.status(400).send({ error });
  }
});

// 2. GET (browse a post by postId)
router.get("/read/:postId", async (req, res) => {
  try {
    const postInfo = await updateOneStatus(req);
    return res.send(postInfo);
  } catch (error) {
    res.status(400).send({ error });
  }
});

// 3. GET (browse all posts by topic)
router.get("/browse/:topic", verify, async (req, res) => {
  try {
    await updateAllStatus();
    const postsByTopic = await Post.find({
      topic: req.params.topic,
    });
    if (postsByTopic.length === 0) {
      return res.send({ message: "No posts here..." });
    }
    return res.send(postsByTopic);
  } catch (error) {
    return res.status(400).send({ error });
  }
});

// 4. GET (browse a post by topic of highest interest)
router.get("/topPost/:topic", verify, async (req, res) => {
  try {
    // before any operations, check and update the post's expiry status and update if expired
    await updateAllStatus();
    // use aggregate pipeline to create a new field 'combinedCount' using $addFields. Note the use of []
    const result = await Post.aggregate([
      {
        $match: {
          topic: req.params.topic,
        },
      },
      {
        $addFields: {
          combinedCount: {
            $sum: ["$likeCount", "$dislikeCount"],
          },
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
    return res.status(400).send({ error });
  }
});

// 5. GET (browse all expired topics)
router.get("/expired/:topic", verify, async (req, res) => {
  try {
    // before any operations, check and update the post's expiry status and update if expired
    await updateAllStatus();
    const expiredPosts = await Post.find({
      topic: req.params.topic,
      expiryStatus: "Expired",
    });

    if (expiredPosts.length === 0) {
      return res.send({ message: "No expired posts here..." });
    }
    return res.send(expiredPosts);
  } catch (error) {
    return res.status(400).send({ error });
  }
});

// 6. PATCH (like a post, helper function used here)
router.patch("/like/:postId", verify, async (req, res) => {
  return likeOrDislikePostHandler(req, res, "like");
});

// 7. PATCH (dislike a post, helper function used here)
router.patch("/dislike/:postId", verify, async (req, res) => {
  return likeOrDislikePostHandler(req, res, "dislike");
});

// 8. PATCH (comment on a post)
router.patch("/comment/:postId", verify, async (req, res) => {
  try {
    // get the user information who is commenting, to log the username into the comment schema to be stored in database
    const userInfo = await User.findById(req.user._id);

    if (!userInfo) {
      return res.status(404).send({ message: "User not found!" });
    }
    // use helper function to get updated post
    const postInfo = await Post.findById(req.params.postId);

    const userComment = new Comment({
      username: userInfo.username,
      text: req.body.text,
      postIdCommented: `Post Id: ${postInfo._id}`,
    });

    if (postInfo.expiryStatus === "Live") {
      const updatedPost = await Post.findOneAndUpdate(
        { _id: req.params.postId },
        {
          $push: {
            comments: `${userComment.username} : ${userComment.text}`,
          },
        },
        { returnDocument: "after" }
      );
      await userComment.save();
      return res.send(updatedPost);
    } else {
      return res
        .status(403)
        .send({ message: "Sorry! You cannot comment on an expired post!" });
    }
  } catch (error) {
    return res.status(400).send({ error });
  }
});

// for testing only
router.delete("/deleteAllPosts", async (req, res) => {
  try {
    await Post.deleteMany({});
    return res.send("deleted");
  } catch (error) {
    return res.send({ error });
  }
});

router.delete("/deleteAllComments", async (req, res) => {
  try {
    await Comment.deleteMany({});
    return res.send("deleted");
  } catch (error) {
    return res.send({ error });
  }
});

module.exports = router;
