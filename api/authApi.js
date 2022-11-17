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
const {errorRes, successRes} = require('../common/response')
const FRONT_END_URL = config.get('FRONT_END_URL')

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
  })// delete it?
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
    try {
      const email = req.body.email
      const userData = await UserModel.findOne({email})

      if (!userData) {
        return res.status(404).json('email not found')
      }

      const hashType = 'forgotPassword'
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
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400)
    }
  })
  .post('/resetpassword/:_id', async (req, res, next) => {
    try {
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
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400)
    }
  })
  .get('/verifyhash/:_id', async (req, res, next) => {
    try {
      const hashId = req.params._id
      const hashData = await hashUserData.findById(hashId)
      if (!hashData) {
        return res.status(404).json('hash not found')
      }

      return res.status(200).json('hash found')
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400)
    }
  })
  .get('/getuserbyhash/:_id', async (req, res, next) => {
    try {
      const hashId = req.params._id
      const hashData = await hashUserData.findById(hashId)
      if (!hashData) {
        return res.status(404).json('hash not found')
      }
      const userData = await UserModel.findById(hashData.userId)
      return successRes(res, {
        _id: userData._id,
        email: userData.email,
        username: userData.username,
      })
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400)
    }
  })
  .post('/verifymail/:_id', async (req, res, next) => {
    try {
        const hashId = req.params._id;
        const hashData = await hashUserData.findById(hashId)
        if (!hashData) {
          return res
            .status(404)
            .json(
              'This url has been use, Please request for reset password link again'
            )
        }

        const userData = await UserModel.findById(hashData.userId)
        if (!userData) {
          return res.status(404).json('email not found')
        }

        userData.verifyEmail = true
        userData.save()
        await hashUserData.findByIdAndDelete(hashId)
        return res.status(200).json('verify email success')
    }catch(error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    } 
  })
.get('/google',passport.authenticate('google', { session: false,scope:
    [ 'email', 'profile' ] }))
.get('/google/callback',
(req,res,next)=>{

    passport.authenticate('google',{session: false,
        failureRedirect: '/failed'},async (err,user)=>{
          if(user){
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
          return res.redirect(FRONT_END_URL);
          }else if(err){
            return  errorRes(res, err, err.message ?? err, err.code ?? 400);
          }
        
        })(req, res, next)
}
)
.get('/failed', (req, res) => res.send('You Failed to log in!'))
function roleUserOnly() {
  return (req, res, next) => {
    req.body = {...req.body, role: 'user'}
    next()
  }
}

module.exports = router
