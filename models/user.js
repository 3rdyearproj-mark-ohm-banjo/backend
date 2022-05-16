const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  _id: ObjectId,
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "invalid email"],
  },
  address: { type: String, required: true },
  tel: { type: String, required: true },//may be blacklist use it 
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
  donationHistory:{type: [ObjectId] ,ref:'donationhistorys' }
  // types: [{ type: ObjectId, ref: "types", required: true }],
  // booksObjectId: [{ type: ObjectId, ref: "books", required: true }],
});

userSchema.pre(
  'save',
  async function(next) {
    const user = this;
    const hash = await bcrypt.hash(this.password, 10); // 10 is time of hash password

    this.password = hash;
    next();
  }
);
//The code in the UserScheme.pre() function is called a pre-hook. 
//Before the user information is saved in the database, this function will be called, 
//you will get the plain text password, hash it, and store it.
userSchema.methods.isValidPassword = async function(password) {
  const user = this;
  const compare = await bcrypt.compare(password, user.password);

  return compare;
}

module.exports = mongoose.model("users", userSchema);
