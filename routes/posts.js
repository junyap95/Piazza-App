const express = require("express");
const router = express.Router();
const PostModel = require("../Model/PostModel");

// router.get("/", (req, res) => {
//   res.send("You are in posts");
// });

// 1. POST (write post)
router.post("/", async (req, res) => {
  // a json obj for database
  const piazzaData = new PostModel({
    // extract what the user gave
    user: req.body.user,
    title: req.body.title,
    text: req.body.text,
    topic: req.body.topic,
  });
  try {
    const postToBeSaved = await piazzaData.save();
    res.send(postToBeSaved);
  } catch (err) {
    // good practice to send back json obj
    res.send({ message: err });
  }
});

// 2. GET (read post)
router.get("/:postId", async (req, res) => {
  try {
    const getPostById = await PostModel.findById(req.params.postId);
    res.send(getPostById);
  } catch (err) {
    res.send({ message: err.name });
  }
});

// 3. PATCH (like and dislike post)
router.patch("/:postId", async (req, res) => {
  const getPostLikes = await PostModel.findById(req.params.postId);
  const like = true;

  try {
    const likePostById = await PostModel.findOneAndUpdate(
      { _id: req.params.postId },
      {
        $set: {
          user: req.body.user,
          title: req.body.title,
          text: req.body.text,
        },
        $inc: {
          likeCount: like ? 1 : -1,
        },
      }
    );
    res.send(likePostById);
  } catch (err) {
    res.send({ message: err });
  }
});

// 4. DELETE (authorised user can delete his own posts)
router.delete("/:postId", async (req, res) => {
  try {
    const deletePostById = await PostModel.deleteOne({
      _id: req.params.postId,
    });
    res.send(deletePostById);
  } catch (error) {
    res.send({ message: err });
  }
});

module.exports = router;
