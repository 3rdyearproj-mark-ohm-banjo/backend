const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const publisher = new Schema({
  _id: ObjectId,
  publisherName: { type: String, required: true ,unique: true}
});
// other field can post 
const BookModel = mongoose.model('publishers', publisher )
module.exports = BookModel