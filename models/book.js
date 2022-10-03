const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const books = new Schema({
  _id: ObjectId,
  status : {
    type: String,
    enum : ['available','unavailable','holding','inProcess','sending','waitHolderResponse'],
    default: 'available'},
  currentHolder:{ type: ObjectId, ref: 'users' ,required: true },
  bookShelf: {type: ObjectId, ref: 'bookshelves' ,required: true},
  readyToSendTime:{type:Date},// add when donate too 
  bookHistorys:{type: [ObjectId] ,ref:'bookhistorys' , required:true }
})

const BookModel= mongoose.model('books', books) // ด้านหน้าคือชื่อ collection 

module.exports = BookModel