const mongoose = require('mongoose')
const Schema = mongoose.Schema
const ObjectId = Schema.Types.ObjectId
const reportAdminSchema = new Schema({
  _id: ObjectId,
  reportId: { type:ObjectId , required:true},
  status : {
    type: String,
    enum : ['waiting','inProcess','success','reject','waitHolderResponse'],
    default: 'waiting'},
  idType : {
    type: String,
    enum : ['bookId','bookShelfId','bookHistoryId','systemReportBookHis'],
    required:true},
  message:{ type: String, required: true },
  userWhoReport: {type: ObjectId, ref: 'users' ,required: true},
  adminWhoManage: {type: ObjectId, ref: 'users' }

},{ timestamps: {
    createdAt: 'reportTime', // Use `recievedate` to store the created date
    updatedAt: 'accessTime' // and `updated_at` to store the last updated date
  }});


const reportAdminModel= mongoose.model('reportadmins', reportAdminSchema) // ด้านหน้าคือชื่อ collection 

module.exports = reportAdminModel