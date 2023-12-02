const joi = require("joi");

const registerValidation = (data) => {
  const userModelValidation = joi.object({
    username: joi.string().required().min(3).max(256),
    email: joi.string().required().min(6).max(256).email(),
    password: joi.string().required().min(6).max(1024),
  });
  return userModelValidation.validate(data);
};

const loginValidation = (data) => {
  const userModelValidation = joi.object({
    // username: joi.string().required().min(3).max(256),
    email: joi.string().required().min(6).max(256).email(),
    password: joi.string().required().min(6).max(1024),
  });
  return userModelValidation.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
