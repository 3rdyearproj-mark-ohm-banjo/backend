const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const publisher = new Schema({
  _id: ObjectId,
  name: String
});

const BookModel = mongoose.model('publishers', publisher )
module.exports = BookModel