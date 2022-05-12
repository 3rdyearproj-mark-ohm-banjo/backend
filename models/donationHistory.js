const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId


const DonationHistorySchema = new Schema({
  _id: ObjectId,
  book:{ type: ObjectId, ref: 'books' ,required: true }
},
{ timestamps: {
    createdAt: 'donationTime' // Use `recievedate` to store the created date
    //updatedAt: 'updated_at' // and `updated_at` to store the last updated date
  }});

module.exports = mongoose.model('donationhistorys', DonationHistorySchema );