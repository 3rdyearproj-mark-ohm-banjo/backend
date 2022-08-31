const express = require("express");
const router = express.Router();
const { create, read, update, remove ,readWithPages } = require("../common/crud");
const type  = require("../models/type");
const { errData, errorRes, successRes } = require("../common/response");



router
  // .get('/available/:lng/:lat/:page',
  // 	nearBy({ available: true }),
  // 	read(Restaurant, ['owner'])
  // )

  //.use(notOnlyMember)

  .get("/", read(type))
  .get("/test",(req,res,next )=> {const today = new Date()
    const next14day = new Date(today.getTime() + (14*24 * 60 * 60 * 1000))
    console.log(next14day) 
   next()}, read(type))
  .post("/", create(type))
  .put("/:_id", update(type))
  .delete("/:_id", remove(type));

  module.exports = router;
