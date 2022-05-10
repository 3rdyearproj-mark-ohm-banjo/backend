const { errData, errorRes, successRes, pageData } = require("../common/response");
const mongoose = require("mongoose");

function create(model, populate = []) {
  return (req, res) => {
    const newData = new model({
      _id: new mongoose.Types.ObjectId(),
      ...req.body,
    });
    return newData
      .save()
      .then((t) =>
        t.populate(
          populate, // delete triple dot from populate
          errData(res)
        )
      )
      .catch((err) => {
        errorRes(res, err);
      });
    // newData.save()
    // return successRes(res,newData) // may be create with populate later
  };
}

function read(model, populate = []) {
  return (req, res) =>
    model
      .find(
        //...req.body,
        errData(res)
      )
      .populate(populate); // problem occur at req.body and previous populate has three dot in fornt
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
        errorRes(res, err);
      })
    if (data.length) {
      successRes(res, data)
    } else {
      errorRes(res, null, "no item")
    }
  };
}
function readWithPages(model, populate = []) {
  return async (req, res) => {
    let size = parseInt(req.query.size); // Make sure to parse the limit to number
    let page = parseInt(req.query.page); // Make sure to parse the skip to number
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 2;
    }
    const skip = (page - 1) * size;
    const total = await model.find();
    //const o =
    model.find(pageData(res, page, size, total.length)).skip(skip).limit(size).populate(populate);
    //model.find(errData(res)).skip(skip).limit(size).populate(populate);

    //return successRes(res,await o);
  };
}


function search(model, populate = []) {
  return async (req, res) => {
    let searchText = req.query.searchText;
    let publisher = req.query.publisher;
    let type = req.query.type;
    let sortBy = req.query.sortBy;
    const sort = {};         //sort expression should be { bookName: 1 }
    let sortStr = "";         //collection name
    let isdescending = req.query.isdescending;
    let orderNumber = 0;    //descending= -1 ascending= 1
    let size = parseInt(req.query.size); // Make sure to parse the limit to number
    let page = parseInt(req.query.page); // Make sure to parse the skip to number
    if (sortBy == undefined) {
      sortStr = "test"
    } else {
      sortStr = sortBy.split(':')
    }
    if (isdescending == "yes") {
      orderNumber = -1
    } else if (isdescending == "no") {
      orderNumber = 1
    } else {
      orderNumber = 0
    }

    sort[sortStr[0]] = orderNumber   //{ bookName: 1 }
    // sort2[str2[0]] = str2[1] === 'desc' ? -1:1
    if (!page) {
      page = 1;
    }
    if (!size) {
      size = 2;
    }
    const skip = (page - 1) * size;
    const total = await model.find();

    if (type == undefined && publisher == undefined) {
      const data = await model.find(
        //   {
        //     $or:[
        //       { bookName : { $regex: req.query.searchText} },
        //       { publisherName : { $regex: req.query.publisher }},
        //       { typeName : { $regex: req.query.type }}
        //     ]
        // }

        { bookName: { $regex: searchText } }
      )
        .skip(skip).limit(size).populate(populate).sort(sort)
        // .skip(skip).limit(size).populate(populate).sort({ sortStr : orderNumber } )
        .catch((err) => {
          errorRes(res, err);
        })

      // console.log(sortStr)    //[ 'bookName' ]
      // console.log(sort[sortStr[0]])   //1
      // console.log(sortStr[1])   //undefined
      // console.log(sort)   //{ bookName: 1 }
      // console.log({ sort })   //{ sort2: { bookName: 1 } }

      if (data.length) {
        successRes(res, data)
      } else {
        errorRes(res, null, "no item")
      }

    } else if (type == undefined && publisher != undefined) {
      // const data = await model.find(
      //     {
      //       $and:[
      //         { "bookName": { $regex: searchText  } },
      //         { "publisherId.publisherName" : { $regex: publisher }},
      //         // { publisherId: {publisherName : { $regex: publisher }}},
      //         // { typeName : { $regex: req.query.type }}
      //       ]
      //   }

      //   // { bookName: { $regex: searchText } }
      // )
      // // .skip(skip).limit(size).sort(sort)
      //     .skip(skip).limit(size).populate(populate).sort(sort)
      //     // .skip(skip).limit(size).populate(populate).sort({ sortStr : orderNumber } )
      //     .catch((err) => {
      //       errorRes(res, err);
      //     })
      //   // console.log("data.length: " + data.length)
      //   // console.log(data)
      //   if (data.length) {
      //     successRes(res, data)
      //   } else {
      //     errorRes(res, null, "no item")
      //   }
      // }



      const data = await model.aggregate([
        {
          "$lookup": {
            from: "publishers",
            localField: "publisherId",
            foreignField: "_id",
            as: "lookupPublisher"
          }
        },
        // { "$unwind": "$publisherId" },
        {
          "$match": {
            $and: [
              { "bookName": { $regex: searchText } },
              // { publisherName: { $regex: publisher } }
              // { "publisherId.publisherName": { $regex: publisher } }
              { "lookupPublisher.publisherName": { $regex: publisher } }
            ],
          }
        }
      ])
        .skip(skip).limit(size).sort(sort)
        // .skip(skip).limit(size).populate(populate).sort(sort)
        // .skip(skip).limit(size).populate(populate).sort({ sortStr : orderNumber } )
        .catch((err) => {
          errorRes(res, err);
        })
      // console.log("data.length: " + data.length)
      // console.log(data)
      if (data.length) {
        successRes(res, data)
      } else {
        errorRes(res, null, "no item")
      }
    }

  };
}




function update(model, populate = []) {
  return (req, res) => {
    req.body.updated_at = new Date();
    return model
      .findByIdAndUpdate(req.params._id, req.body, { new: true }, errData(res))
      .populate(...populate);
  };
}

function remove(model) {
  return (req, res) => model.deleteOne({ _id: req.params._id }, errData(res)); // pass
}

module.exports = { read, create, update, remove, readWithPages, readWithQuery, search };
