function errorRes(res, err, errMsg = 'failed operation', statusCode = 500) {
  console.error('ERROR:', err)
  return res.status(statusCode).json({success: false, error: errMsg})
}

function successRes(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({success: true, data})
}

function pageSuccessRes(res, data = {}, page, size, total, statusCode = 200) {
  return res.status(statusCode).json({success: true, size, page, total, data})
}

function errData(res, errMsg = 'failed operation') {
  return (err, data) => {
    if (err) {
      // when create this err is created object
      return errorRes(res, err, errMsg)
    }
    return successRes(res, data)
  }
}
function pageData(res, page, size, total, errMsg = 'failed operation') {
  return (err, data) => {
    console.log(res)
    if (err) {
      // when create this err is created object
      return errorRes(res, err, errMsg)
    }
    return pageSuccessRes(res, data, page, size, total)
  }
}

module.exports = {
  errorRes,
  successRes,
  errData,
  pageData,
  pageSuccessRes,
}
