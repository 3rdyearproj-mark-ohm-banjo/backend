   
const { errorRes } = require('./response')
const jwtDecode = require("jwt-decode");


function notFound (req, res, _) {
  return errorRes(res, 'no routes', 'you are lost.', 404)
}

function onlyAdmin (req, res, next) {
  if (req.user.type === 'admin')
    return next()
  return invalidToken(req, res)
}

function notOnlyMember (req, res, next) {
  if (req.user.type === 'member')
    return invalidToken(req, res)
  return next()
}

async function userAuthorize(req, res, next) {
  const token = req.cookies.jwt;
  const payload = await jwtDecode(token);
  if (payload.role == "user") {
    next();
  } else {
    return errorRes(res,null,"only user can use",403)
  }
}
 function Authorize(role) {// may change to array of role 
   return async(req,res,next)=>{
  const token = req.cookies.jwt;
  const payload = await jwtDecode(token);
  if (payload.role == role) {
    next();
  } else {
    return errorRes(res,"only "+role+" can use","only "+role+" can use",403)
  }
 }
}
function invalidToken (req, res) {
  const errMsg = 'INVALID TOKEN'
  const userText = JSON.stringify(req.user)
  const err = `${errMsg} ERROR - user: ${userText}, IP: ${req.ip}`
  return errorRes(res, err, errMsg, 401)
}

module.exports = { notFound, onlyAdmin, notOnlyMember, userAuthorize ,Authorize}