const jwtDecode = require("jwt-decode");
const router = require("express").Router(),
  jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
passport = require("passport");
const UserModel = require('../models/user')
const {
  create,
  read,
  update,
  remove,
  readWithPages,
} = require("../common/crud");
const {
  adminAcceptReport,
  adminRejectReport,
} = require("../Service/adminManageReportService")
const { userAuthorize, Authorize } = require("../common/middleware");
const book = require("../models/book");
const bookHistory = require("../models/bookHistory");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const user = require("../models/user");
const donationHistory = require("../models/donationHistory");
const { errData, errorRes, successRes } = require("../common/response");
const Multer = require("multer");
const admin = require("firebase-admin");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});
const bucket = require("../common/getFireBasebucket");
const reportAdmin = require("../models/reportAdmin");

router
  .use(Authorize("admin"))
  .put("/bookShelf/:_id", multer.single("imgfile"), updateBookShelf())
  .post('/newadmin', roleAdminOnly(), create(UserModel))
  .put('/acceptreportrequest/:_id',acceptReportRequest())//release 3 api start here
  .put('/rejectreportrequest/:_id',rejectReportRequest())
  .get('/reportinformation',(req,res,next) => {
    const token = req.cookies.jwt;
    const payload = jwtDecode(token);
    const adminId = payload.userId;
    const idType = req.query.idType
    const status = req.query.status
    const isHandleReport = req.query.isHandleReport
    let filterTest = {}
    if(status){
      filterTest.status = status
    }
    if(idType){
      filterTest.idType = idType
    }
    if(isHandleReport){
      filterTest.AdminWhoManage = adminId
    }
    req.query.customFunctionFilter = filterTest
    
    next()
  },readWithPages(reportAdmin))
  function roleAdminOnly() {
    return (req, res, next) => {
      req.body = {...req.body, role: 'admin'}
      next()
    }
  }

function updateBookShelf() {
  return async (req, res, next) => {
    try {
      // add check isbn is already has
      const bookShelfId = req.params._id;
      const Bookshelf = await bookShelf.findById(bookShelfId);
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...req.body, ...bookData ,totalBorrow: undefined , totalQuantity: undefined ,totalAvailable: undefined};
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        throw "user not found";
      }
      if (userdata.role != "admin") {
        throw "role is not admin ";
      }
      if (!Bookshelf) {
        const err = new Error("bookShelf not found");
        err.code = 500;
        throw err;
      }
      if (!req.file) {
      const response = await bookShelf.findOneAndUpdate(
        { _id: bookShelfId },
        { ...req.body },
        { new: true }
      )
      return successRes(res, response);
      }
      else 
      {
        const fileName = `${req.body.ISBN}${Date.now()}`
        const response = await bookShelf.findOneAndUpdate(
          { _id: bookShelfId },
          { ...req.body,imageCover: fileName },
          { new: true }
        )
        await bucket.file(Bookshelf.imageCover).delete();
        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
          },
        });
  
        blobStream.on("error", (err) => {
          errorRes(res, err);
        });
  
        blobStream.end(req.file.buffer);
        return successRes(res, response);
      } 

    } catch (error) {
      if (error.name === "ValidationError") {
        let errors = {};

        Object.keys(error.errors).forEach((key) => {
          errors[key] = error.errors[key].message;
        });

        return res.status(400).send(errors);
      } else if (error.name === "MongoServerError") 
      {
        if (error.codeName == "DuplicateKey") 
        {
          const dupkeyname = Object.keys(error.keyPattern)[0]
          const message = "this "+dupkeyname+" already exist"
          errorRes(res, error, message, 400);
        } 
        else return res.status(400).send(error);
      } 
      else errorRes(res, error, error.message, error.code ?? 500);
      // find way to catch mongoose validation
    }
  };
}
function acceptReportRequest(){
  return async (req,res,next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const adminId = payload.userId;
      const reportId = req.params._id
      const responseObj = await adminAcceptReport(reportId,adminId)
      return successRes(res,responseObj)
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  }
}
function rejectReportRequest(){
  return async (req,res,next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const adminId = payload.userId;
      const reportId = req.params._id
      const responseObj = await adminRejectReport(reportId,adminId)
      return successRes(res,responseObj)
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  }
}

module.exports = router;
