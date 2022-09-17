const jwtDecode = require("jwt-decode");
const mongoose = require("mongoose");
const {
  create,
  read,
  update,
  remove,
  readWithPages,
} = require("../common/crud");
const book = require("../models/book");
const bookHistory = require("../models/bookHistory");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const user = require("../models/user");
const donationHistory = require("../models/donationHistory");
const queue = require("../models/queues");
const { errData, errorRes, successRes } = require("../common/response");

async function getOffQueue(qID,bsID,userID,curID){
    try {
        const queueId = qID
        const bookShelfId = bsID
        const userId = userID
        const currentBookActId = curID
        await queue.findByIdAndDelete(queueId)
        await bookShelf.findOneAndUpdate(
          { _id: bookShelfId },
          {
            $pull: { queues: queueId},
          }
        );
        await currentBookAction.findByIdAndDelete(currentBookActId)
        await user.findOneAndUpdate(
          { _id: userId },
          {
            $pull: { currentBookAction: curID },
          }
        );
    } catch (error) {
        throw error
    }

}

module.exports = {getOffQueue}