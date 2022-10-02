const jwtDecode = require("jwt-decode");
const mongoose = require("mongoose");
const {
  create,
  read,
  update,
  remove,
  readWithPages,
} = require("../common/crud");
const { sendMail } = require("../common/nodemailer");
const book = require("../models/book");
const bookHistory = require("../models/bookHistory");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const user = require("../models/user");
const donationHistory = require("../models/donationHistory");
const queue = require("../models/queues");
const currentBookAction = require("../models/currentBookAction");
const reportAdmin = require("../models/reportAdmin");

const { errData, errorRes, successRes } = require("../common/response");
const { getMatching } = require("./userBookShelfService");
async function adminAcceptReport(reportID,adminID){
    try {
        const reportObj = await reportAdmin.findById(reportID)
        if (!reportObj){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        } 
        reportObj.status = 'inProcess'
        reportObj.AdminWhoManage = adminID
        if(reportObj.idType == 'bookId'){
            console.log('test')
            //send email home address of admin
            //change book history expire date to null
            const bookData = await book.findById(reportObj.reportId).populate('bookShelf')
            if(!bookData){
                const err = new Error("book not found");
                err.code = 400;
                throw err;
            }
            const bookHisId = bookData.bookHistorys[bookData.bookHistorys.length-1]
            await bookHistory.findByIdAndUpdate(bookHisId,{expireTime:null})
            const reporterInfo = await user.findById(reportObj.userWhoReport)
            if(!reporterInfo){
                const err = new Error("reporter not found");
                err.code = 500;
                throw err;
            }
            const adminInfo = user.findById(adminID) 
            await sendMail(reporterInfo,"AdminSendAddressToReporter",bookData.bookShelf,0,adminInfo)

        }else if(reportObj.idType == 'bookHistoryId'){
            // what gonna do 
            const bookHisInfo = await bookHistory.findById(reportObj.reportId)
            if(!bookHisInfo){
                const err = new Error("bookHistory not found");
                err.code = 400;
                throw err;
            }
            await bookHistory.findByIdAndUpdate(bookHisInfo._id,{expireTime:null})

        }
        await reportObj.save() 
        return reportObj
    } catch (error) {
        throw error
    }
}
async function adminRejectReport(reportID,adminID){
    try {
        const reportObj = await reportAdmin.findById(reportID)
        if (!reportObj){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        } 
        reportObj.status = 'reject'
        reportObj.AdminWhoManage = adminID
        await reportObj.save() 
        //can reject only book shelf 
        return reportObj
    } catch (error) {
        throw error
    }
}
async function findNewBookForReporter(bookshelfInfo,receiverId,baseTotalAvailableCount = 0){//add mail notI ?
    try {
        let bookAvailableCount = baseTotalAvailableCount
        const queueObject = new queue({
            _id: new mongoose.Types.ObjectId(),
            bookShelf: bookshelfInfo._id,
            userInfo: receiverId,
          });
        await queueObject.save()
  
        const readyBooks = await book.find({ bookShelf: bookshelfInfo._id, status: 'available' })
        readyBooks.sort(function (a, b) {
          return new Date(a.readyToSendTime) - new Date(b.readyToSendTime)
        })
        if (readyBooks.length > 0) {
          const readyBookInfo = readyBooks[0]
          getMatching(receiverId,readyBookInfo.currentHolder,queueObject._id,readyBookInfo._id)
          bookAvailableCount = bookAvailableCount -1
        }
        const bookshelfUpdate = await bookShelf.findByIdAndUpdate(bookshelfInfo._id, { $push: { queues:{
            $each: [                     
                queueObject._id
            ], $position: 0 
        }  }, $inc: { totalAvailable: bookAvailableCount } }, { new: true })

    } catch (error) {
        throw error
    }   
}
async function changeReportStatusToSuccess(reportID){
    try {
        const reportObj = await reportAdmin.findById(reportID)
        if (!reportObj){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        } 
        reportObj.status = 'success'
        await reportObj.save() 
        return reportObj
    } catch (error) {
        throw error
    }
}
async function changeBookHolderToAdminWhenProblemBookIsCome(bookId,adminId){
    try {
        const bookInfo = await book.findById(bookId)
        if (!bookInfo){
            const err = new Error("book not found");
            err.code = 400;
            throw err;
        } 
        const oldHolder = bookInfo.currentHolder
        bookInfo.currentHolder = adminId
        const bookHistoryObj = new bookHistory({
            _id: new mongoose.Types.ObjectId(),
            senderInfo: oldHolder,
            receiverInfo: adminId,
            book: bookInfo._id,
            status: 'success',
            receiveTime: new Date(),

        }) 
        await bookHistoryObj.save()
        bookInfo.bookHistorys.push(bookHistoryObj._id)
        await bookInfo.save()
    } catch (error) {
        throw error
    }
}
async function findNewReceiverForAdminAndMatchBookForReporterAgain(bookId,reporterId){
    try {
        // find new receiver for false broken book
        const bookInfo = await book.findById(bookId)
        if(!bookInfo){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        }
        bookInfo.status = 'available'
        const bookshelfInfo = await bookShelf.findById(bookInfo.bookShelf).populate('queues')
        
        const waitQueues = bookshelfInfo.queues.filter(q => q.status == "waiting")
        if (waitQueues.length > 0) {
          //waitQueues must sort by id 
          //waitQueues.sort(function (a, b) { return a._id.toString().localeCompare(b._id.toString()) })
          const queueInfo = waitQueues[0]
          const readyBookInfo = bookInfo //maybe bug here 
          getMatching(queueInfo.userInfo,readyBookInfo.currentHolder,queueInfo._id,readyBookInfo._id)

        }else {
          await bookShelf.findByIdAndUpdate(bookInfo.bookShelf,{ $inc: { totalAvailable: 1 }})
        }
        const sortHistorys = bookInfo.bookHistorys.sort(function (a, b) { return b._id.toString().localeCompare(a._id.toString()) })
        await bookHistory.findByIdAndUpdate(sortHistorys[0], { receiverReadingSuccessTime: new Date() })// write tub

        
        //find new book for reporter  
        findNewBookForReporter(bookshelfInfo,reporterId,0)
       await bookInfo.save()
    } catch (error) {
        throw error
    }

}
async function unavailableBookAndMatchReceiverAgain(bookId,receiverId){//may be add book History admin unavailable this book 
    try {
        const bookInfo = await book.findById(bookId)
        if(!bookInfo){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        }
        bookInfo.status = 'unavailable'


        let bookAvailableCount = 0
        const bookshelfInfo = await bookShelf.findById(bookInfo.bookShelf)
        const queueObject = new queue({
            _id: new mongoose.Types.ObjectId(),
            bookShelf: bookshelfInfo._id,
            userInfo: receiverId,
          });
        await queueObject.save()
  
        const readyBooks = await book.find({ bookShelf: bookInfo.bookShelf, status: 'available' })
        readyBooks.sort(function (a, b) {
          return new Date(a.readyToSendTime) - new Date(b.readyToSendTime)
        })
        if (readyBooks.length > 0) {
          const readyBookInfo = readyBooks[0]
          getMatching(receiverId,readyBookInfo.currentHolder,queueObject._id,readyBookInfo._id)
          bookAvailableCount = bookAvailableCount -1
        }
        const bookshelfUpdate = await bookShelf.findByIdAndUpdate(bookshelfInfo._id, { $push: { queues:{
            $each: [                     
                queueObject._id
            ], $position: 0 
        }  }, $inc: { totalAvailable: bookAvailableCount } }, { new: true })
        await bookInfo.save()
    } catch (error) {
        throw error
    }


}
module.exports = {adminAcceptReport,adminRejectReport,unavailableBookAndMatchReceiverAgain
    ,changeReportStatusToSuccess,findNewReceiverForAdminAndMatchBookForReporterAgain
    ,changeBookHolderToAdminWhenProblemBookIsCome}