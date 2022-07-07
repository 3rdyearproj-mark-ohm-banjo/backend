const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const bookHistorySchema = new Schema({
  _id: ObjectId,
  userInfo:{ type: ObjectId, ref: 'users' ,required: true },
  book:{type: ObjectId, ref: 'books' ,required: true },
  senderInfo:{ type: ObjectId, ref: 'users' ,required: true },
  status:{
    type: String,
    enum : ['inprocess','success','failed'],
    default: 'success'},
  receiveTime:{type: Date},
  sendingTime:{type: Date},
  seen:{type:Boolean ,default: false}
});

module.exports = mongoose.model('bookhistorys', bookHistorySchema );