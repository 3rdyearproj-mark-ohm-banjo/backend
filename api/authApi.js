const router = require('express').Router(),
  jwt = require('jsonwebtoken')
passport = require('passport')
const UserModel = require('../models/user')
const {create, read, update, remove, readWithPages} = require('../common/crud')
const config = require('config')
const SECRET = config.get('SECRET_KEY')

/* POST login. */
router
  .post('/login', (req, res, next) => {
    passport.authenticate(
      'local',
      {session: false},
      async (err, user, info) => {
        if (err) return next(err)
        if (user) {
          const payload = {email: user.email, role: user.role}
          const token = jwt.sign(payload, SECRET, {
            expiresIn: '3d',
          })
          res.cookie('jwt', token, {
            secure: process.env.NODE_ENV === 'devops' ? true : false, // set secure ของ cookie ปกติมักใช้ใน production
            maxAge: 3 * 24 * 60 * 60 * 1000,
            httpOnly: true,
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
      res.clearCookie('jwt', {path: '/'})
      return res.status(200).json('you are logged out')
    }
    return res.status(401).json('you are not logged in')
  })
function roleUserOnly() {
  return (req, res, next) => {
    req.body = {...req.body, role: 'user'}
    next()
  }
}

module.exports = router
