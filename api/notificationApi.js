const express = require('express')
const {Authorize} = require('../common/middleware')
const {errorRes, successRes} = require('../common/response')
const notification = require('../models/notification')
const router = express.Router()
const user = require('../models/user')
const jwtDecode = require('jwt-decode')
const bookshelf = require('../models/bookshelf')

router
  .use(Authorize('admin,user'))
  .get('/mynotification', getMyNotification())
  .get('/mynotification/:_id', getMyNotificationById())
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

function getMyNotificationById() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt
      const payload = jwtDecode(token)
      const {_id: notificationId} = req.params
      const userInfo = await user.findOne({email: payload.email})
      if (!userInfo) {
        throw 'user not found'
      }
      const notificationInfo = await notification.findById(notificationId)

      if (!notificationInfo) {
        throw 'notification not found'
      }

      let bookShelf = await bookshelf
        .findOne({
          bookName: notificationInfo.bookName,
        })
        .populate(['publisherId', 'types'])

      return successRes(res, {notificationInfo, bookShelf})
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
