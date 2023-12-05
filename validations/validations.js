const joi = require("joi");

// set up constants so will only have to change these once for all same fields
const usernameVerification = joi.string().required().min(3).max(256);
const emailVerification = joi
  .string()
  .required()
  .min(6)
  .max(256)
  .email({ minDomainSegments: 2, tlds: { allow: ["com", "net"] } });
const passwordVerification = joi.string().required().min(6).max(1024);

const registerValidation = (data) => {
  const userModelValidation = joi.object({
    username: usernameVerification,
    email: emailVerification,
    password: passwordVerification,
  });
  return userModelValidation.validate(data);
};

const loginValidation = (data) => {
  const userModelValidation = joi.object({
    email: emailVerification,
    password: passwordVerification,
  });
  return userModelValidation.validate(data);
};

module.exports.registerValidation = registerValidation;
module.exports.loginValidation = loginValidation;
