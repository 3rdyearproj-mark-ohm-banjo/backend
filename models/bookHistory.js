const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const bookHistorySchema = new Schema({// add create time and expiretime 
  _id: ObjectId,
  receiverInfo:{ type: ObjectId, ref: 'users' ,required: true },// change to receiverInfo if has error check here 
  book:{type: ObjectId, ref: 'books' ,required: true },
  senderInfo:{ type: ObjectId, ref: 'users' },
  status:{
    type: String,
    enum : ['inProcess','success','failed'],//,'pending'
    default: 'inProcess'},
  receiveTime:{type: Date}, // add timestamp in donation 
  sendingTime:{type: Date},
  receiverReadingSuccessTime:{type:Date},
  expireTime:{type: Date}, // add timestamp in donation 
  alreadyForward:{type:Boolean ,default: false},
  seen:{type:Boolean ,default: false},
  borrowerNeedToCancel:{type:Boolean , default: false}
},{timestamps:{
  createdAt: 'matchTime'
}});

module.exports = mongoose.model('bookhistorys', bookHistorySchema );