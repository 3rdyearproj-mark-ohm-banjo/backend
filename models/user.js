const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const ObjectId = Schema.Types.ObjectId;
const validator = require('validator');
const bcrypt = require('bcrypt');

const userSchema = new Schema({
  _id: ObjectId,
  username: { type: String },
  firstname: { type: String },
  lastname: { type: String },
  password: { type: String, required: true },
  email: {
    type: String,
    required: true,
    unique: true,
    validate: [validator.isEmail, "invalid email"],
  },
  address: { type: String },
  tel: { type: String },//may be blacklist use it 
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
  verifyEmail:{type:Boolean ,default: false},
  donationHistory:{type: [ObjectId] ,ref:'donationhistorys' },
  currentBookAction:{type:[{type: ObjectId,ref:'currentbookactions' }] , validate:[bookActLimit,'can action with book more than 5 book' ]} // change body when user edit info

  // types: [{ type: ObjectId, ref: "types", required: true }],
  // booksObjectId: [{ type: ObjectId, ref: "books", required: true }],
});
function bookActLimit(val){//didn't use
  console.log(val.length)
  return val.length <= 5 
}

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
userSchema.methods.checkUserInfo = async function() {
  const user = this;
  var isInfoReady = true;
  if(!(user.address&&user.tel&&user.firstname&&user.lastname)){
    isInfoReady = false
  }
// use this function to check when user has borrow or donation / check when user edit information
  return isInfoReady;
}
module.exports = mongoose.model("users", userSchema);
