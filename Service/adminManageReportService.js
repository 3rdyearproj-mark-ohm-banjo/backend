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
        reportObj.save() 
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
        reportObj.save() 
        //can reject only book shelf 
        return reportObj
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
        reportObj.save() 
        return reportObj
    } catch (error) {
        throw error
    }
}


async function unavailableBookAndMatchReceiverAgain(bookId,receiverId){
    try {
        const bookInfo = await book.findById(bookId)
        if(!bookInfo){
            const err = new Error("Id not found");
            err.code = 400;
            throw err;
        }
        bookInfo.status = 'unavailable'


        let bookAvailableCount = -1
        const bookshelfInfo = await bookShelf.findById(bookInfo.bookShelf)
        const queueObject = new queue({
            _id: new mongoose.Types.ObjectId(),
            bookShelf: bookshelfInfo._id,
            userInfo: receiverId,
          });
        queueObject.save()
  
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

    } catch (error) {
        throw error
    }


}
module.exports = {adminAcceptReport,adminRejectReport,unavailableBookAndMatchReceiverAgain,changeReportStatusToSuccess}