const jsonwebtoken = require("jsonwebtoken");

const auth = (req, res, next) => {
  // takes token from header
  const token = req.header("auth-token");
  // if no token
  if (!token) {
    return res.status(401).send({ message: "Access Denied!" });
  }

  try {
    const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    // next = jumping between middleware
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid Token" });
  }
};

module.exports = auth;
