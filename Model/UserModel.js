const mongoose = require("mongoose");
const UserSchema = mongoose.Schema({
  username: {
    type: String,
    require: true,
    min: 3,
    max: 256,
  },
  email: {
    type: String,
    require: true,
    min: 6,
    max: 256,
  },
  password: {
    type: String,
    require: true,
    min: 6,
    max: 1024,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("Users", UserSchema);
