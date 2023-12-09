const { Post } = require("../Model/PostModel");
const User = require("../Model/UserModel");
const { updateOneStatus } = require("./postStatusUpdater");
// A function to be used by the like and dislike route to prevent code duplication
const likeOrDislikePostHandler = async (req, res, usersAction) => {
  try {
    // get latest post information to extract date of post created
    const postInfo = await updateOneStatus(req);

    // 'originalPoster' finds the user who posted this post
    const originalPoster = postInfo.username;
    // 'userInfo' finds the user who has been verified, note req.user._id comes from the verify function
    const userInfo = await User.findById(req.user._id);

    // extract likes and dislikes array information from the post
    const likesArray = postInfo.usersWhoLiked;
    const dislikesArray = postInfo.usersWhoDisliked;

    // Users cannot like/dislike an expired post
    if (postInfo.expiryStatus === "Expired") {
      return res
        .status(403)
        .send({ message: "Sorry, this post has expired..." });
    }

    // Users cannot like/dislike own post
    if (originalPoster === userInfo.username) {
      return res
        .status(403)
        .send({ message: "Sorry, you cannot like/dislike your own post!" });
    }

    // a parameter placeholder to be used to update the post
    const updateUserArray = {};

    // these conditions are to ensure no user can perform both like and dislike on one same post
    // the logic: if a user liked/disliked a post, his/her username will be stored in respective like/dislike arrays. Users can only like/dislike a post once and are able to swap between like and dislike, as long as the post is live
    if (usersAction === "like" && !likesArray.includes(userInfo.username)) {
      updateUserArray.$addToSet = { usersWhoLiked: userInfo.username };
      if (dislikesArray.includes(userInfo.username)) {
        updateUserArray.$pull = { usersWhoDisliked: userInfo.username };
      }
    } else if (
      usersAction === "dislike" &&
      !dislikesArray.includes(userInfo.username)
    ) {
      updateUserArray.$addToSet = { usersWhoDisliked: userInfo.username };
      if (likesArray.includes(userInfo.username)) {
        updateUserArray.$pull = { usersWhoLiked: userInfo.username };
      }
    }

    // update the the arrays for users who likes/ dislikes
    await Post.findOneAndUpdate({ _id: req.params.postId }, updateUserArray);

    // update the likeCount and dislikeCount second, because only when the  arrays are updated then their lengths can be computed. Note aggregate pipeline is used here
    const updateCount = [
      {
        $set: {
          likeCount: { $size: "$usersWhoLiked" },
          dislikeCount: { $size: "$usersWhoDisliked" },
        },
      },
    ];

    const updatedPost = await Post.findOneAndUpdate(
      { _id: req.params.postId },
      updateCount,
      { returnDocument: "after" }
    );

    // to return the final updated post per like/dislike request. Note at this stage both like/dislike arrays and like/dislike count fields in the database are updated
    return res.send(updatedPost);
  } catch (error) {
    return res.status(400).send({ error });
  }
};

module.exports = likeOrDislikePostHandler;
