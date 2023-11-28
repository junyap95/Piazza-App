const express = require("express");
const app = express();
const postsRoute = require("./routes/posts");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const PostModel = require("./Model/PostModel");
require("dotenv/config");

app.use(bodyParser.json());
app.use("/posts", postsRoute);

app.get("/", async (req, res) => {
  try {
    const newsFeed = await PostModel.find();
    res.send(newsFeed);
  } catch (error) {
    res.send({ message: error });
  }
  res.send("Homepage");
});

mongoose.connect(process.env.DB_CONNECTOR).then(() => {
  console.log("DB connected");
});

app.listen(3000, () => {
  // demonstrate server is working
  console.log("Running...");
});
