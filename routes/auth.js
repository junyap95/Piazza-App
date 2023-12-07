const express = require("express");
const router = express.Router();
const User = require("../Model/UserModel");
const {
  registerValidation,
  loginValidation,
} = require("../validations/validations");
const bcryptjs = require("bcryptjs");
const jsonwebtoken = require("jsonwebtoken");

// endpoint for user registration
router.post("/register", async (req, res) => {
  const { error } = registerValidation(req.body);
  if (error) {
    return res.status(401).send({ error: error["details"][0]["message"] });
  }
  // to prevent user registers with the same email multiple times
  const emailExists = await User.findOne({ email: req.body.email });
  if (emailExists) {
    return res.status(400).send({ message: "User already exists!" });
  }

  // Hash the password using bcryptjs with a generated salt
  const salt = await bcryptjs.genSalt(5);
  const hashedPassword = await bcryptjs.hash(req.body.password, salt);

  const newUser = new User({
    username: req.body.username,
    email: req.body.email,
    // input the hashed password instead of raw password
    password: hashedPassword,
  });

  try {
    const saveUser = await newUser.save();
    return res.send(saveUser);
  } catch (error) {
    return res.status(400).send({ error: error["details"][0]["message"] });
  }
});

// endpoint for user login
router.post("/login", async (req, res) => {
  const { error } = loginValidation(req.body);
  if (error) {
    return res.status(400).send({ error: error["details"][0]["message"] });
  }
  try {
    // check if user exists using email
    const userLogin = await User.findOne({ email: req.body.email });
    if (!userLogin) {
      return res.status(401).send({ message: "User does not exist!" });
    }
    // check password, need to decrypt the password using bcryptjs
    const passwordValidation = await bcryptjs.compare(
      req.body.password,
      userLogin.password
    );
    if (!passwordValidation) {
      return res.status(401).send({ message: "Incorrect Password!" });
    }
    // if login successful, generate an auth token for user
    const token = jsonwebtoken.sign(
      { _id: userLogin.id },
      process.env.JWT_SECRET
    );
    return res
      .status(200)
      .header("auth-token", token)
      .send({ message: "Login successful", authtoken: token });
  } catch (error) {
    return res.status(500).send({ error });
  }
});

module.exports = router;
