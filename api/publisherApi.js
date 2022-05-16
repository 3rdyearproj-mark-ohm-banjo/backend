const express = require("express");
const router = express.Router();
const { create, read, update, remove ,readWithPages } = require("../common/crud");
const publisher = require("../models/publisher");
const { errData, errorRes, successRes } = require("../common/response");



router
  // .get('/available/:lng/:lat/:page',
  // 	nearBy({ available: true }),
  // 	read(Restaurant, ['owner'])
  // )

  //.use(notOnlyMember)

  .get("/", read(publisher))
  .post("/", create(publisher))
  .put("/:_id", update(publisher))
  .delete("/:_id", remove(publisher));

  module.exports = router;
