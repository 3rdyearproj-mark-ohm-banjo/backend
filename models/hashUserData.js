const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

const HashSchema = new Schema({
  _id: ObjectId,
  userId: {type: ObjectId, ref: 'users', required: true},
  hashType: {
    type: String,
    enum: ['forgotPassword','verifyMail'],
    default: 'verifyMail',
  },
})

module.exports = mongoose.model('hashUserData', HashSchema)
