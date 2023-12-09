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
  // find the user writing this post by by using its ID. the verified user object in req.user._id is returned by the 'verify' function
  const userInfo = await User.findById(req.user._id);
  if (!userInfo) {
    return res.status(404).send({ error: "User not found!" });
  }

  // Get the current date and time
  const todaysDate = new Date();
  // Calculate the expiry date by adding 5 minutes to the current time
  const expiryDate = new Date().setMinutes(todaysDate.getMinutes() + 60);

  // Create a new Post object with the following fields:
  const piazzaData = new Post({
    // The username is obtained from the authenticated user's information
    username: userInfo.username,

    // The title, text, and topic are provided in the request body
    title: req.body.title,
    text: req.body.text,
    topic: req.body.topic,

    // The expiry date is set to 5 minutes from the current date and time
    expiryDate: expiryDate,
  });

  try {
    // save the Post object into database
    const postToBeSaved = await piazzaData.save();
    res.send(postToBeSaved);
  } catch (error) {
    res.status(400).send({ error });
  }
});

// 2. GET (browse a post by postId)
router.get("/read/:postId", verify, async (req, res) => {
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
    // before any operations, check and update the posts' expiry status and update if expired
    await updateAllStatus();

    // use mongo aggregate pipeline to create a new field 'combinedCount' using $addFields. Note the use of []
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

    if (result.length !== 0) {
      return res.send(result[0]);
    }
    return res.send({ message: "No post here yet..." });
  } catch (error) {
    return res.status(400).send({ error });
  }
});

// 5. GET (browse all expired topics)
router.get("/expired/:topic", verify, async (req, res) => {
  try {
    // before any operations, check and update the post's expiry status and update if expired
    await updateAllStatus();

    // returns an array of expired posts
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
    // find the user commenting on this post by by using its ID. the verified user object in req.user._id is returned by the 'verify' function
    const userInfo = await User.findById(req.user._id);
    if (!userInfo) {
      return res.status(404).send({ message: "User not found!" });
    }

    // use helper function to get the updated post
    const postInfo = await updateOneStatus(req);

    // Create a new Comment object with the following fields:
    const userComment = new Comment({
      username: userInfo.username,
      text: req.body.text,
      postIdCommented: postInfo._id,
    });

    // if the post is not expired, the comment will be pushed into an array in Post where it stores all comments from authorised users
    if (postInfo.expiryStatus === "Live") {
      // the comment will be stored in database
      const savedComment = await userComment.save();

      // an update method to push the comment into the comments array in Post, stored in the following object format below:
      await Post.findOneAndUpdate(
        { _id: req.params.postId },
        {
          $push: {
            comments: {
              username: userComment.username,
              text: userComment.text,
              // savedComment._id is an object returned by the save() function
              commentId: savedComment._id.toString(),
            },
          },
        },
        { returnDocument: "after" }
      );
      // return an object where we can extract the commend id generated
      return res.send(savedComment);
    } else {
      return res
        .status(403)
        .send({ message: "Sorry! You cannot comment on an expired post!" });
    }
  } catch (error) {
    return res.status(400).send({ error });
  }
});

// 8. DELETE (delete own comment on a post)
router.delete("/deleteComment/:commentId", verify, async (req, res) => {
  try {
    // find the comment using its ID stored in database
    const comment = await Comment.findById(req.params.commentId);

    // then check if the comment exists
    if (!comment) {
      return res.send({
        message: "Sorry! Either the post or the comment has been removed...",
      });
    }

    // using the post id stored in the comment above, find the specific post
    const postInfo = await Post.findById(comment.postIdCommented);

    // check if the post is expired
    if (new Date() >= postInfo.expiryDate) {
      return res.send({ message: "This post is expired!" });
    }

    // extract the user's username who made this comment
    const originalPoster = comment.username;

    // 'userInfo' finds the user who has been verified for this endpoint, note req.user._id comes from the verify function
    const userInfo = await User.findById(req.user._id);

    if (originalPoster === userInfo.username) {
      // delete the comment in the database
      await Comment.deleteOne({ _id: req.params.commentId });

      // update the array which stores users' comments in the post
      const originalPost = await Post.findOneAndUpdate(
        { _id: comment.postIdCommented },
        {
          $pull: { comments: { commentId: req.params.commentId } },
        },
        { returnDocument: "after" }
      );
      return res.send(originalPost);
    } else {
      return res.send({ message: "You can only delete your own comment!" });
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
