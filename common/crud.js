const {
  errData,
  errorRes,
  successRes,
  pageData,
  pageSuccessRes,
} = require('../common/response')
const mongoose = require('mongoose')
const stringHandler = require('../helper/stringHandler')

function create(model, populate = []) {
  return (req, res) => {
    const newData = new model({
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
    })
    return newData
      .save()
      .then((t) =>
        t.populate(
          populate, // delete triple dot from populate
          errData(res)
        )
      )
      .catch((err) => {
        errorRes(res, err)
      })
    // newData.save()
    // return successRes(res,newData) // may be create with populate later
  }
}

function read(model, populate = []) {
  return (req, res) =>
    model
      .find(
        //...req.body,
        errData(res)
      )
      .populate(populate) // problem occur at req.body and previous populate has three dot in fornt
}
function readWithQuery(model, populate = []) {
  return async (req, res) => {
    const data = await model
      .find(
        ...req.body
        //errData(res)
      )
      .populate(populate)
      .catch((err) => {
        errorRes(res, err)
      })
    // if (data.length) {
    //   successRes(res, data)
    // } else {
    //   errorRes(res, null, 'no item')
    // }
    successRes(res,data)
  }
}
function readWithPages(model, populate = []) {
  return async (req, res) => {
    let size = parseInt(req.query.size) // Make sure to parse the limit to number
    let page = parseInt(req.query.page) // Make sure to parse the skip to number
    const filter = req.query.customFunctionFilter
    if (isNaN(page) || isNaN(size) || page < 1 || size < 1) {
      return errorRes(
        res,
        'error number page or size format',
        'size and page should be positive integer'
      )
      }
    if (!page) {
      page = 1
    }
    if (!size) {
      size = 2
    }

    const skip = (page - 1) * size
    const total = await model.find(filter)
    model
      .find(filter,pageData(res, page, size, total.length))
      .skip(skip)
      .limit(size)
      .populate(populate)

    //model.find(errData(res)).skip(skip).limit(size).populate(populate);

    //return successRes(res,await o);
  }
}

function search(model, populate = []) {
  return async (req, res) => {
    try {
      const {publisher, types, sortBy, isDescending, size, page} = req.query
      const numSize = size ? +size : 2 // Make sure to parse the limit to number
      const numPage = page ? +page : 1 // Make sure to parse the skip to number
      let searchText = req.query.searchText
        ? stringHandler.escapeRegex(req.query.searchText)
        : ''

      if (isNaN(numPage) || isNaN(numSize) || numPage < 1 || numSize < 1) {
        return errorRes(
          res,
          'error number page or size format',
          'size and page should be positive integer'
        )
      }

      let skip = (numPage - 1) * numSize
      let sort = {}
      let searchQuery = {$and: []}
      if (!sortBy) {
        sort = null
      } else {
        if (isDescending === 'yes') {
          // desc = -1 asc = 1
          sort[sortBy] = -1
        } else {
          sort[sortBy] = 1
        }
      }

      Object.keys(req.query).map((key) => {
        if (req.query[key].length > 0) {
          if (key === 'searchText') {
            searchQuery.$and.push({
              bookName: {$regex: searchText, $options: 'i'},
            })
          }
          if (key === 'types') {
            searchQuery.$and.push({types: {$all: types.split(',')}})
          }
          if (key === 'publisher') {
            searchQuery.$and.push({publisherId: publisher})
          }
        }
      })

      searchQuery = searchQuery.$and.length < 1 ? {} : searchQuery
      const total = await model.find(searchQuery).count()
      const resultQuery = await model
        .find(searchQuery)
        .sort(sort && sort)
        .skip(skip)
        .limit(numSize)
        .populate(populate)
        .catch((err) => {
          errorRes(res, err)
        })

      return pageSuccessRes(res, resultQuery, numPage, numSize, total)
    } catch (err) {
      return errorRes(res, err)
    }
  }
}

function update(model, populate = []) {
  return (req, res) => {
    req.body.updated_at = new Date()
    return model
      .findByIdAndUpdate(req.params._id, req.body, {new: true}, errData(res))
      .populate(...populate)
  }
}

function remove(model) {
  return (req, res) => model.deleteOne({_id: req.params._id}, errData(res)) // pass
}

module.exports = {
  read,
  create,
  update,
  remove,
  readWithPages,
  readWithQuery,
  search,
}
