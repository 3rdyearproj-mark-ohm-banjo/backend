const mongoose = require("mongoose");
const bookHistory = require("../models/bookHistory");
const reportAdmin = require("../models/reportAdmin");
const ordersProcess = 
async (job) => {
    try {
        const bookHisInfo = await bookHistory.findById(job.data.reportId)
    if(bookHisInfo){
        if(!bookHisInfo.receiveTime){
            const reportAdminObj = new reportAdmin({
                _id: new mongoose.Types.ObjectId(),
                userWhoReport: bookHisInfo.receiverInfo,
                reportId: bookHisInfo._id,
                idType: 'systemReportBookHis',
                message: 'this user dose not confirm receive book in 14 day please contact user'
              })
            await reportAdminObj.save()
        }else {
            console.log('already confirm receive')
        }
        
    }else {
        console.log(job.data)
        console.log('bookHistoryID not found')
        // need to add in error log table if has time to do 
    }

    } catch (error) {
        
    }
    
    }
module.exports = {ordersProcess}