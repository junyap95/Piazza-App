const express = require("express");
const router = express.Router();
const PostModel = require("../Model/PostModel");
const UserModel = require("../Model/UserModel");
const verify = require("../verifyToken");
// router.get("/", (req, res) => {
//   res.send("You are in posts");
// });

// 1. POST (write post)
router.post("/write", verify, async (req, res) => {
  const getUser = await UserModel.findById(req.user._id);
  if (!getUser) {
    return res.status(404).send({ message: "User not found" });
  }

  const todaysDate = new Date(2023, 11, 30);

  const expiryDate = new Date().setDate(todaysDate.getDate() + 1);

  console.log(todaysDate < expiryDate);

  // a json obj for database
  const piazzaData = new PostModel({
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
    const getPostById = await PostModel.findById(req.params.postId);
    res.send(getPostById);
  } catch (err) {
    res.send({ message: err.name });
  }
});

// 3. PATCH (like and dislike post)
router.patch("/like/:postId", verify, async (req, res) => {
  try {
    // get and to compare dates
    const userPost = await PostModel.findById(req.params.postId);

    const todaysDate = new Date();
    const expiryDate = new Date(userPost.expiryDate);
    const isExpired = todaysDate >= expiryDate;

    if (!isExpired) {
      await PostModel.findOneAndUpdate(
        { _id: req.params.postId },
        {
          $inc: {
            likeCount: 1,
          },
        }
      );
    } else {
      return res.status(400).send("Sorry! You cannot like an expired Post!");
    }
    return res.send(userPost);
  } catch (err) {
    return res.send({ message: err });
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
