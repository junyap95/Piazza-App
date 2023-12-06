const express = require("express");
const app = express();
const postsRoute = require("./routes/posts");
const authRoute = require("./routes/auth");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const { Post } = require("./Model/PostModel");
const { updateAllStatus } = require("./helperFunctions/postStatusUpdater");
require("dotenv/config");

app.use(bodyParser.json());
app.use("/api/posts", postsRoute);
app.use("/api/user", authRoute);

// this endpoint is available to view by all users with or without token
app.get("/", async (req, res) => {
  try {
    await updateAllStatus();
    const newsFeed = await Post.find();
    if (newsFeed.length === 0) {
      return res.send({ message: "No posts here..." });
    }
    return res.send(newsFeed);
  } catch (error) {
    return res.status(400).send({ error });
  }
});

mongoose.connect(process.env.DB_CONNECTOR).then(() => {
  // demonstrates database is connected
  console.log("DB connected");
});

app.listen(3000, () => {
  // demonstrates server is working
  console.log("Server Running...");
});
