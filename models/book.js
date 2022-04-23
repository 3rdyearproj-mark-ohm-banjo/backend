const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const books = new Schema({
  _id: ObjectId,
  id: String,
  name: String,
})

const BookModel= mongoose.model('books', books) // ด้านหน้าคือชื่อ collection 

module.exports = BookModel