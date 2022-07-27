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
  .get("/test",(req,res,next )=> {console.log(new Date()) 
   next()}, read(type))
  .post("/", create(type))
  .put("/:_id", update(type))
  .delete("/:_id", remove(type));

  module.exports = router;
