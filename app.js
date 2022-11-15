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
const notificationApi = require('./api/notificationApi')
const cookieParser = require('cookie-parser')
const config = require('config')
const FRONT_END_URL = config.get('FRONT_END_URL')

const { createNewOrder,orderQueue } = require('./queues/order-queue')
const {ExpressAdapter} = require('@bull-board/express')
const serverAdapter = new ExpressAdapter()
serverAdapter.setBasePath("/backend/admin/bullui")
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
  .use('/api/emailApi', emailApi)//comment?
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
  .use('/api/notification', notificationApi)
  //.use('/api/book', api)
  .use(unHandleError)
  .use(notFound)

const server = require('http').Server(app);
const io = require('socket.io')(server,{
  cors: {
    origin: FRONT_END_URL,
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  }
});

/*list of user keep in server cache*/
let onlineUsers = []

const addNewUser = (email,socketId) => {
  if(!onlineUsers.some((user) => user.email === email)) {
    onlineUsers.push({email,socketId})
  }
}

const removeUser = (socketId) => {
  onlineUsers = onlineUsers.filter((user) => user.socketId !== socketId) 
}

const getUser = (email) => {
  return onlineUsers.find((user) => user.email === email)
}

const notification = require('./models/notification')
io.on('connection',(socket) => {

  socket.on('signIn',(email) => {
    addNewUser(email, socket.id)
  })

  socket.on('sendNotification',async ({senderEmail,receiverEmail,type,bookName}) => {
    try {
    const receiver = getUser(receiverEmail)
    const notificationModel = new notification({senderEmail,receiverEmail,type,bookName})
    await notificationModel.save()

     if(receiver) {
      io.to(receiver?.socketId).emit('getNotification',{
        senderEmail, type, bookName
      })
    }}catch (err){
      console.log(err)
    }
  }) 

  socket.on('logout', () => {
      if(socket?.id) {
        removeUser(socket?.id)
      }
  }) 

  socket.on("disconnect", () => {
    if(socket?.id) {
    removeUser(socket?.id)
    }
  });
})

module.exports = server

 


