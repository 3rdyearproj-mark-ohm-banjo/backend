const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const queueSchema = new Schema({
  _id: ObjectId,
  bookShelf:{type:ObjectId, ref: 'bookshelves',required:true},
  status:{
    type: String,
    enum : ['waiting','pending'],
    default: 'waiting'},
  userInfo:{ type: ObjectId, ref: 'users' ,required: true },
},{ timestamps: {
    createdAt: 'requestTime' // Use `recievedate` to store the created date
    //updatedAt: 'updated_at' // and `updated_at` to store the last updated date
  }});

module.exports = mongoose.model('queues', queueSchema );