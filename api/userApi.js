const jwtDecode = require("jwt-decode");
const router = require("express").Router(),
  jwt = require("jsonwebtoken");
//passport = require("passport");
const UserModel = require("../models/user");
const { errData, errorRes, successRes } = require("../common/response");
const {create,read,update,remove,readWithPages,} = require("../common/crud");
const { userAuthorize } = require("../common/middleware");
const bookshelf = require("../models/bookshelf");

/* POST login. */
router
//.use(userAuthorize)
.get("/profile", async (req, res, next) => {
  const token = req.headers.authorization.slice(7);
  const payload = jwtDecode(token);
  const userdata = await UserModel.find({email:payload.email});
  userdata[0].password = undefined;
  // console.log(test)
  // console.log(test.password)
  return successRes(res,userdata);
})
.get("/test",async (req,res) => {
  const data =await bookshelf.find({totalQuantity: 1}).skip(2).limit(10).populate(["publisherId","types"]).sort({'_id':1})
  successRes(res,data)
});

module.exports = router;
