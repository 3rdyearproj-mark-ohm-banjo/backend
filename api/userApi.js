const jwtDecode = require('jwt-decode')
const router = require('express').Router(),
  jwt = require('jsonwebtoken')
const UserModel = require('../models/user')
const { sendMail } = require("../common/nodemailer");
const { errData, errorRes, successRes } = require('../common/response')
const { create, read, update, remove, readWithPages } = require('../common/crud')
const { userAuthorize } = require('../common/middleware')
const bookshelf = require('../models/bookshelf')
const bcrypt = require('bcrypt');

/* POST login. */
router
  //.use(userAuthorize)
  .get('/profile', async (req, res, next) => {
    const token = req.cookies.jwt
    const payload = jwtDecode(token)
    const userdata = await UserModel.find({ email: payload.email }).populate([
      {
        path: 'donationHistory',
        populate: {
          path: 'book',
          model: 'books',
          populate: {
            path: 'bookShelf',
            model: 'bookshelves',
          }
        }
      },
      'currentBookAction']) // manage data in future queue is undefine 
    userdata[0].password = undefined
    // userdata[0].donationHistory.forEach(element => {
    //   element.book.bookHistorys = undefined
    //   element.book.currentHolder = undefined
    // });
    return successRes(res, userdata)
  })
  .get('/test', async (req, res) => {
    const data = await bookshelf
      .find({ totalQuantity: 1 })
      .skip(2)
      .limit(10)
      .populate(['publisherId', 'types'])
      .sort({ _id: 1 })
    successRes(res, data)
  })


  .put('/changePassword', async (req, res, next) => {
    try {
      const token = req.cookies.jwt
      const payload = jwtDecode(token)
      let userdata = await UserModel.find({ email: payload.email })
      // console.log("userdata: " + userdata)
      // console.log("userdata[0].password: " + userdata[0].password)
      // console.log("body.oldPassword: " + req.body.oldPassword)

      // เช็คว่า old password เหมือนกับ new password ใหม ต้องห้ามเหมือนกัน
      if (req.body.oldPassword == req.body.newPassword) {
        throw "Old Password and New Password is the same!!"
      }
      // เช็คว่า ค่า hash เหมือนกับ old password ใหม
      if (bcrypt.compareSync(req.body.oldPassword, userdata[0].password)) {
        // console.log("validate old password completely")
        let hashNewPassword = bcrypt.hashSync(req.body.newPassword, 10);
        // console.log("hashOldPassword: " + userdata[0].password)
        // console.log("hashNewPassword: " + hashNewPassword)
        await UserModel.updateOne({
          email: payload.email
        }, {
          $set: { password: hashNewPassword }
        });

        //ตอน return จะแสดง password อันใหม่ ถ้าไม่ทำมันจะแสดง password อันเก่า แต่ใน DB จะเป็น password ใหม่อยู่แล้ว  
        userdata = await UserModel.find({ email: payload.email })
        return successRes(res, userdata)

        // ถ้าใส่ old password ผิด
      } else {
        throw "Old Password is incorrect"
      }

    } catch (error) {
      // console.log("--error catch--")
      errorRes(res, error, error.message, error.code ?? 400);
    }
  })


  .put('/editInfo', async (req, res, next) => {
    try {
      const token = req.cookies.jwt
      const payload = jwtDecode(token)
      let userdata = await UserModel.find({ email: payload.email })
      let updates = {}

      if (Object.keys(req.body).length <= 0) {
        throw "Object missing"
      }
      if(req.body.tel==null||req.body.address==null||req.body.firstname==null||req.body.lastname==null){
        const err = new Error("please add all information");
        err.code = 403;
        throw err;
      }
      Object.keys(req.body).map((key) => {
        if (req.body[key].length > 0 && (
          key === 'firstname' ||
          key === 'lastname' ||
          key === 'address' ||
          key === 'tel')
        ) {
          updates[key] = req.body[key]
        }
      })
      // console.log(updates)


      await UserModel.updateOne({
        email: payload.email
      }, {
        $set: updates
      })

      // เอาไว้แสดงข้อมูลอันใหม่  
      userdata = await UserModel.find({ email: payload.email })
      return successRes(res, userdata)

    } catch (error) {
      // console.log("--error catch--")
      errorRes(res, error, error.message, error.code ?? 400);
    }
  })


module.exports = router
