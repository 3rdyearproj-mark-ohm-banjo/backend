const express = require("express");
const bodyParser = require("body-parser");
const passport = require("passport");
// const path = require('path');
// const logger = require('morgan');
//const api = require('./api/test');
const bSApi = require("./api/bookShelfApi");
const pubApi = require("./api/publisherApi");
const typeApi = require("./api/typeApi");
const authApi = require("./api/authApi");
const userApi = require("./api/userApi");
const userBookShelfApi = require("./api/userBookShelfApi");

const { notFound } = require("./common/middleware");
const cors = require("cors");
//const multer = require('multer')
//const upload = multer()
require("./configs/passport");
const app = express();

app
  .use(
    cors({
      origin: ["http://localhost:3000"],
      methods: ["GET", "POST", "PUT", "DELETE"],
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

  .use("/api/bookShelf", bSApi)
  .use("/api/publisher", pubApi)
  .use("/api/type", typeApi)
  .use("/api/", authApi)
  .use("/api/user", passport.authenticate("jwt", { session: false }), userApi)
  .use(
    "/api/user",
    passport.authenticate("jwt", { session: false }),
    userBookShelfApi
  )

  //.use('/api/book', api)

  .use(notFound);

module.exports = app;
