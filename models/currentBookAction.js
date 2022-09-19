const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const currentBookActionSchema = new Schema({
  _id: ObjectId,
  userId:{ type: ObjectId, ref: 'users' ,required: true },
  bookShelfId: {type: ObjectId, ref: 'bookshelves' ,required: true}, // bookId?
  //bookId: {type: ObjectId, ref: 'books' },
})

module.exports = mongoose.model('currentbookactions', currentBookActionSchema) ;

