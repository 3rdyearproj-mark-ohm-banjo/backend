function errorRes(res, err, errMsg = "failed operation", statusCode = 500) {
  // maybe 501
  if (err?.code == 11000) {
    errMsg = Object.keys(err.keyValue)[0] + " already exists.";
    statusCode = 400;
  }else if (err?.name === "ValidationError") {
    let errors = {};
    Object.keys(err.errors).forEach((key) => {
      errors[key] = err.errors[key].message;
    });
    errMsg = errors
    statusCode = 400
  } 
  else {
    errMsg = err?.message ?? err ?? errMsg;
  }
  console.error("ERROR:", err);
  return res.status(statusCode).json({ success: false, error: errMsg });
}

function successRes(res, data = {}, statusCode = 200) {
  return res.status(statusCode).json({ success: true, data });
}

function pageSuccessRes(res, data = {}, page, size, total, statusCode = 200) {
  return res
    .status(statusCode)
    .json({ success: true, size, page, total, data });
}

function errData(res, errMsg = "failed operation") {
  return (err, data) => {
    if (err) {
      // when create this err is created object
      return errorRes(res, err, errMsg);
    }
    return successRes(res, data);
  };
}
function pageData(res, page, size, total, errMsg = "failed operation") {
  return (err, data) => {
    
    if (err) {
      // when create this err is created object
      return errorRes(res, err, errMsg);
    }
    return pageSuccessRes(res, data, page, size, total);
  };
}

module.exports = {
  errorRes,
  successRes,
  errData,
  pageData,
  pageSuccessRes,
};
