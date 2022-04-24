const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const typeSchema = new Schema({
  _id: ObjectId,
  name: { type: String, required: true ,unique: true}
});

module.exports = mongoose.model('types', typeSchema );