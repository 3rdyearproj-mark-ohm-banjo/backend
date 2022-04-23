const { errData, errorRes, successRes } = require('../common/response')
const mongoose = require('mongoose')


function create (model, populate=[]) {
  return (req, res) => {
    const newData = new model({
      _id: new mongoose.Types.ObjectId(),
      ...req.body
    })
    // return  newData.save()
    //   .then(
    //     t => t.populate(...populate, 
    //     errData(res))
    //     )
    //   .catch(err => { 
    //     errorRes(res, err)

    //   })
    newData.save()
    return successRes(res,newData).populate(...populate)
  }
}

function read (model, populate=[]) {
  return (req, res) => (
    model.find(//...req.body, 
      errData(res)).populate(...populate) // problem occur at req.body
  )
}

function update (model, populate=[]) {
  return (req, res) => {
    req.body.updated_at = new Date()
    return model.findByIdAndUpdate(
            req.params._id,
            req.body,
            { new: true },
            errData(res)
          ).populate(...populate)
  }
}

function remove (model) {
  return (req, res) => (
    model.deleteOne({ _id: req.params._id }, errData(res))// pass 
  )
}

module.exports = { read, create, update, remove }