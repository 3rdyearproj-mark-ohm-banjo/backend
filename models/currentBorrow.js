const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const currentBorrowSchema = new Schema({
  _id: ObjectId,
  userId:{ type: ObjectId, ref: 'users' ,required: true },
  bookId:{ type: ObjectId, ref: 'books' ,required: true }
});

module.exports = mongoose.model('currentBorrows', currentBorrowSchema );