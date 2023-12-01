const express = require("express");
const app = express();
const postsRoute = require("./routes/posts");
const authRoute = require("./routes/auth");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const PostModel = require("./Model/PostModel");
const verify = require("./verifyToken");
require("dotenv/config");

app.use(bodyParser.json());
app.use("/api/posts", postsRoute);
app.use("/api/user", authRoute);

// everytime to use this endpoint, verification is needed
app.get("/", verify, async (req, res) => {
  try {
    const newsFeed = await PostModel.find();
    res.send(newsFeed);
  } catch (error) {
    res.send({ message: error });
  }
});

mongoose.connect(process.env.DB_CONNECTOR).then(() => {
  console.log("DB connected");
});

app.listen(3000, () => {
  // demonstrate server is working
  console.log("Server Running...");
});
