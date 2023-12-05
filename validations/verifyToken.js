const jsonwebtoken = require("jsonwebtoken");

const verify = (req, res, next) => {
  // takes token from header
  const token = req.header("auth-token");
  // if no token
  if (!token) {
    return res.status(401).send({ message: "Access Denied!" });
  }

  try {
    const verified = jsonwebtoken.verify(token, process.env.JWT_SECRET);
    req.user = verified;

    // next = jumping to next middleware or route
    next();
  } catch (error) {
    res.status(401).send({ message: "Invalid Token" });
  }
};

module.exports = verify;
