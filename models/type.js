const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const typeSchema = new Schema({
  _id: ObjectId,
  typeName: { type: String, required: true ,unique: true}
});

module.exports = mongoose.model('types', typeSchema );