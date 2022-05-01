const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const books = new Schema({
  _id: ObjectId,
  status : {
    type: String,
    enum : ['available','unavaiable','holding'],
    default: 'available'}
})

const BookModel= mongoose.model('books', books) // ด้านหน้าคือชื่อ collection 

module.exports = BookModel