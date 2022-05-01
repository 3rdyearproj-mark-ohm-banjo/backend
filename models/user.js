const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const validator = require('validator');

const userSchema = new Schema({
  _id: ObjectId,
  username: { type: String, required: true,unique: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "invalid email"],
  },
  address: { type: String, required: true },
  tel: { type: String, required: true },
  role: {
    type: String,
    enum : ['user','admin','adminstock'],
    default: 'user'
  },
  status: {
    type: String,
    enum : ['active','banned'],
    default: 'active'
  },
  // types: [{ type: ObjectId, ref: "types", required: true }],
  // booksObjectId: [{ type: ObjectId, ref: "books", required: true }],
});

module.exports = mongoose.model("users", userSchema);
