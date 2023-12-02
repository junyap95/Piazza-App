const express = require("express");
const router = express.Router();

const User = require("../Model/UserModel");
const {
  registerValidation,
  loginValidation,
} = require("../validations/validations");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");
const UserModel = require("../Model/UserModel");

router.post("/register", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }
  // adds complexity to password, and create a hashed representation for password
  const salt = await bcryptjs.genSalt(5);
  const hashedPassword = await bcryptjs.hash(req.body.password, salt);

  const user = new User({
    username: req.body.username,
    email: req.body.email,
    // input the hashed password instead of raw password
    password: hashedPassword,
  });

  const emailExists = await UserModel.findOne({ email: req.body.email });
  if (emailExists) {
    return res.status(400).send({ message: "User already exists!" });
  }

  try {
    const saveUser = await user.save();
    return res.send(saveUser);
  } catch (error) {
    return res.status(400).send({ message: error });
  }
});

router.post("/login", async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ message: error["details"][0]["message"] });
  }

  // check user exists
  const user = await UserModel.findOne({ email: req.body.email });
  if (!user) {
    return res.status(400).send({ message: "User does not exist!" });
  }
  // check password, need to decrypt
  const passwordValidation = await bcryptjs.compare(
    req.body.password,
    user.password
  );
  if (!passwordValidation) {
    return res.send({ message: "Incorrect Password!" });
  }
  // if login successful, generate an auth token for user
  const token = jsonwebtoken.sign({ _id: user.id }, process.env.JWT_SECRET);
  res
    .header("auth-token", token)
    .send({ "auth-token for this particular user": token });
});

// verify token

module.exports = router;
