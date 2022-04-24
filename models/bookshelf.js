const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const bookShelfSchema = new Schema({
  _id: ObjectId,
  bookName: { type: String, required: true },
  ISBN: { type: String, required: true ,unique: true},
  firstYearOfPublication: { type: String , required: true },
  //available: { type: String ,required: true, },
  publisherId:{ type: ObjectId, ref: 'publishers' ,required: true } ,
  totalBorrow: { type: Number, required: true},
  totalQuantity: { type: Number, required: true},
  totalAvailable: { type: Number, required: true},
  types:[{type: ObjectId ,ref:'types' , required:true }],
  booksObjectId: [{type: ObjectId ,ref:'books' , required:true }]
});

module.exports = mongoose.model('bookshelves', bookShelfSchema );