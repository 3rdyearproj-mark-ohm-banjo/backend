const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const bookHistorySchema = new Schema({
  _id: ObjectId,
  userInfo:{ type: ObjectId, ref: 'users' ,required: true },
  books:{type: ObjectId, ref: 'books' ,required: true }
},
{ timestamps: {
    createdAt: 'recieveTime', // Use `recievedate` to store the created date
    //updatedAt: 'updated_at' // and `updated_at` to store the last updated date
  }});

module.exports = mongoose.model('bookhistorys', bookHistorySchema );