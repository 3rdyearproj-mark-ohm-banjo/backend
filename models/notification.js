const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId

// keep just string email because we don't have to get other data to use in this case + email cant change
// (except we have deleted account feature that have to clean everything about user we have to clean data here by email instead or just keep object user / userId)
const NotificationSchema = new Schema(
  {
    // _id: ObjectId,
    // notification sender not book sender
    senderEmail: {type: String, required: true},
    type: {
      type: String,
      enum: [
        'addQueue',
        'cancelBorrow',
        'confirmSendingSuccess',
        'confirmReceiveBook',
        'acceptBorrow',
        'acceptCancelBorrow',
        'checkMailFromAdmin'
      ],
      default: 'addQueue',
    },
    // notification receiver not book receiver
    receiverEmail: {type: String, required: true},
    bookName: {type: String, required: true},
    seen: {type: Boolean, default: false},
  },
  {
    timestamps: {
      createdAt: 'timestamp',
      updatedAt: 'seenTime',
    },
  }
)

module.exports = mongoose.model('notification', NotificationSchema)
