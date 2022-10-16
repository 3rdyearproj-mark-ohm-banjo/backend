const express = require('express')
const {Authorize} = require('../common/middleware')
const {errorRes, successRes} = require('../common/response')
const {create} = require('../models/notification')
const notification = require('../models/notification')
const router = express.Router()
const user = require('../models/user')
const jwtDecode = require('jwt-decode')

router
  .use(Authorize('admin,user'))
  .get('/mynotification', getMyNotification())
  .post('/addnotification', addNotification())
  .put('/seennotification', seenNotification())

function getMyNotification() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt
      const payload = jwtDecode(token)
      const userInfo = await user.findOne({email: payload.email})

      if (!userInfo) {
        throw 'user not found'
      }

      const notificationList = await notification
        .find({
          receiverEmail: payload.email,
        })
        .sort({_id: -1})

      let unseenCount = 0

      notificationList.forEach((item) => {
        if (!item?.seen) {
          unseenCount += 1
        }
      })

      return successRes(res, {notificationList, unseenCount})
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 500)
    }
  }
}

function addNotification() {
  return async (req, res, next) => {
    try {
      const {receiverEmail} = req.body
      const userInfo = await user.findOne({receiverEmail})

      if (!userInfo) {
        throw 'user not found'
      }

      create(notification)

      return successRes(res, {
        msg: 'add notification success',
      })
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 500)
    }
  }
}

function seenNotification() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt
      const payload = jwtDecode(token)
      const userInfo = await user.findOne({email: payload.email})

      if (!userInfo) {
        throw 'user not found'
      }

      let {seenList} = req.body

      seenList = seenList.map((item) => item._id)

      await notification.updateMany(
        {
          _id: {$in: seenList},
        },
        {$set: {seen: true, seenTime: new Date()}}
      )

      return successRes(res, {
        msg: 'update seen item success',
      })
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 500)
    }
  }
}

module.exports = router
