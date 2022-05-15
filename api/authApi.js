const router = require('express').Router(),
  jwt = require('jsonwebtoken')
passport = require('passport')
const UserModel = require('../models/user')
const {create, read, update, remove, readWithPages} = require('../common/crud')

/* POST login. */
router
  .post('/login', (req, res, next) => {
    passport.authenticate('local', {session: false}, (err, user, info) => {
      if (err) return next(err)
      if (user) {
        const payload = {email: user.email, role: user.role}
        const token = jwt.sign(payload, 'your_jwt_secret')
        res.cookie('jwt', token, {
          // secure: true,  // set secure ของ cookie ปกติมักใช้ใน production
          maxAge: 3 * 24 * 60 * 60 * 1000,
          httpOnly: true,
        })
        return res.json({user})
      } else {
        return res.status(422).json(info)
      }
    })(req, res, next)
  })
  .post('/register', roleUserOnly(), create(UserModel))
  .get('/profile', (req, res, next) => {
    res.send(req.user)
  })
  .get('/logout', (req, res) => {
    console.log(req.cookies)
    res.clearCookie('jwt', {path: '/'})
    return res.status(200).json('you are logged out')
  })
  function roleUserOnly(){
    return (req,res,next)=>{
      req.body = {... req.body,role:"user"}
      next()
    }
  }

module.exports = router
