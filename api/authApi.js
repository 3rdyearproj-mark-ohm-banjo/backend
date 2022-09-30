const router = require('express').Router()
const jwt = require('jsonwebtoken')
const passport = require('passport')
const UserModel = require('../models/user')
const {create} = require('../common/crud')
const config = require('config')
const hashUserData = require('../models/hashUserData')
const {default: mongoose} = require('mongoose')
const SECRET = config.get('SECRET_KEY')
const DOMAIN = config.get('DOMAIN')
const {sendMail} = require('../common/nodemailer')

/* POST login. */
router
  .post('/login', (req, res, next) => {
    passport.authenticate(
      'local',
      {session: false},
      async (err, user, info) => {
        if (err) return next(err)
        if (user) {
          const payload = {email: user.email, role: user.role, userId: user._id}
          const token = jwt.sign(payload, SECRET, {
            expiresIn: '3d',
          })
          res.cookie('jwt', token, {
            secure: process.env.NODE_ENV === 'devops' ? true : false, // set secure ของ cookie ปกติมักใช้ใน production
            maxAge: 3 * 24 * 60 * 60 * 1000,
            domain: DOMAIN,
            sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
          })
          //return res.json({user})
          const userData = await UserModel.find({email: user.email}).populate({
            path: 'donationHistory',
            populate: {
              path: 'book',
              model: 'books',
              populate: {
                path: 'bookShelf',
                model: 'bookshelves',
              },
            },
          })
          return res
            .status(200)
            .json({message: 'login success', user: userData[0]})
        } else {
          return res.status(422).json(info)
        }
      }
    )(req, res, next)
  })
  .post('/register', roleUserOnly(), create(UserModel))
  .get('/profile', (req, res, next) => {
    res.send(req.user)
  })
  .get('/logout', (req, res) => {
    if (req.cookies.jwt) {
      res.cookie('jwt', 'removed', {
        secure: process.env.NODE_ENV === 'devops' ? true : false,
        maxAge: 0,
        httpOnly: true,
        domain: DOMAIN,
        sameSite: process.env.NODE_ENV === 'development' ? 'lax' : 'none',
      })
      return res.status(200).json('you are logged out')
    }
    return res.status(401).json('you are not logged in')
  })
  .post('/forgotpassword', async (req, res, next) => {
    const email = req.body.email
    const userData = await UserModel.findOne({email})

    if (!userData) {
      return res.status(404).json('email not found')
    }

    const hashType = req.body.hashType
    const hashData = new hashUserData({
      _id: new mongoose.Types.ObjectId(),
      userId: userData._id,
      hashType,
    })

    hashData.save()

    const payload = {
      email,
      hashId: hashData._id,
    }

    sendMail(payload, 'forgotPassword')
    return res.status(200).json('email reset has been sent')
  })

  .post('/resetpassword/:_id', async (req, res, next) => {
    const hashId = req.params._id
    const password = req.body.password
    const hashData = await hashUserData.findById(hashId)

    if (!hashData) {
      return res
        .status(404)
        .json(
          'This url has been use, Please request for reset password link again'
        )
    }

    const userData = await UserModel.findById(hashData.userId)
    userData.password = password
    userData.save()
    await hashUserData.findByIdAndDelete(hashId)
    return res.status(200).json('password has been change')
  })

function roleUserOnly() {
  return (req, res, next) => {
    req.body = {...req.body, role: 'user'}
    next()
  }
}

module.exports = router
