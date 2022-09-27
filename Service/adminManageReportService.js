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
const currentBookAction = require("../models/currentBookAction");
const reportAdmin = require("../models/reportAdmin");

const { errData, errorRes, successRes } = require("../common/response");
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

        }else if(reportObj.idType == 'bookHistoryId'){
            // what gonna do 
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
        return reportObj
    } catch (error) {
        throw error
    }
}
module.exports = {adminAcceptReport,adminRejectReport}