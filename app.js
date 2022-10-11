const express = require('express')
const bodyParser = require('body-parser')
const passport = require('passport')
// const path = require('path');
// const logger = require('morgan');
//const api = require('./api/test');
const bSApi = require('./api/bookShelfApi')
const pubApi = require('./api/publisherApi')
const typeApi = require('./api/typeApi')
const authApi = require('./api/authApi')
const userApi = require('./api/userApi')
const userBookShelfApi = require('./api/userBookShelfApi')
const adminApi = require('./api/adminApi')
const emailApi = require('./api/testEmailApi')
const cookieParser = require('cookie-parser')
const config = require('config')
const FRONT_END_URL = config.get('FRONT_END_URL')

const { createNewOrder,orderQueue } = require('./queues/order-queue')
const {ExpressAdapter} = require('@bull-board/express')
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath("/admin/bullui")
const { createBullBoard } = require('@bull-board/api')
const { BullAdapter } = require('@bull-board/api/bullAdapter')
createBullBoard({
    queues: [new BullAdapter(orderQueue)],
    serverAdapter
})
const {Authorize } = require("./common/middleware");


const {notFound,unHandleError} = require('./common/middleware')
const cors = require('cors')
//const multer = require('multer')
//const upload = multer()
require('./configs/passport')
const app = express()

app
  .use(cookieParser())
  .use(
    cors({
      origin: [FRONT_END_URL],
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      credentials: true,
    })
  )
  
  // .use(logger('dev'))
  .use(express.json())
  //.use(upload.array())
  // .use(bodyParser.json())
  // .use(bodyParser.urlencoded({
  //     extended:true
  // }))
  .use('/api/emailApi', emailApi)
  .use('/api/bookShelf', bSApi)
  .use('/api/publisher', pubApi)
  .use('/api/type', typeApi)
  .use('/api/', authApi)
  .use('/api/user', passport.authenticate('jwt', {session: false}), userApi)
  .use(
    '/api/user',
    passport.authenticate('jwt', {session: false}),
    userBookShelfApi
  )
  .use('/api/admin', passport.authenticate('jwt', {session: false}), adminApi)
  .use('/admin/bullui',
  //passport.authenticate('jwt', {session: false}),Authorize('admin'),
   serverAdapter.getRouter())
  .post('/order',async (req,res)=>{ 
    await createNewOrder(req.body)
    return res.status(200).json( {status: 'order ok'} )
})
  //.use('/api/book', api)
  .use(unHandleError)
  .use(notFound)

module.exports = app
