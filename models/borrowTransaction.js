const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const borrowTransactionSchema = new Schema({// add create time and expiretime 
  _id: ObjectId,
  bookHistoryInfo:{ type: ObjectId, ref: 'bookhistorys' ,required: true ,unique: true},
  expireTime:{type: Date}, // add timestamp in donation 
  alreadyForward:{type:Boolean ,default: false}
});

module.exports = mongoose.model('borrowtransactions', borrowTransactionSchema );