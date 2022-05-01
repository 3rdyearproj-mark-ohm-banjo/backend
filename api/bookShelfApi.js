const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { create, read, update, remove, readWithPages } = require("../common/crud");
const book = require("../models/book");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const { errData, errorRes, successRes } = require("../common/response");

//const { notOnlyMember, notFound } = require('../common/middleware')

router
  // .get('/available/:lng/:lat/:page',
  // 	nearBy({ available: true }),
  // 	read(Restaurant, ['owner'])
  // )

  //.use(notOnlyMember)

//   .get("/", read(publisher))
  .get("/bs", read(bookShelf, ["publisherId"]))
  .get("/bsP", readWithPages(bookShelf, ["publisherId"]))
  .post("/bs", createBookShelf(), create(bookShelf))

  //   .post("/", create(book))
//   .put("/:_id", update(book))
//   .delete("/:_id", remove(book));

function createBookShelf() {
  // check isbn off bookshelf
  return async (req, res, next) => {
    //    const hasBS = true;
    //    const bSId = new mongoose.ObjectId;
    console.log(req.body)
    console.log("----------------------------------------")

    BS = await bookShelf.findOne(
      { ISBN: req.body.ISBN }
      // ,function (err, results) {
      //     if (err) { console.log(err) }
      //     if (!results.length) {
      //        hasBS = false
      //        bSId = results[0]._id
      //     }
      //     console.log(results[0]._id)
      // }
    );
    if (BS) {
      //check  has isbn and create book and add new object id of book to request and call next
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: "available",
      });
      newBook.save();
      bookShelf.findOneAndUpdate(
        { _id: BS._id },
        { $push: { booksObjectId: newBook._id },$inc : {'totalAvailable' : 1,'totalQuantity' : 1} },
        { new: true },
        errData(res)
      );
    } else {
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: "available",
      });
      //newBook.save()
      //create book and add new object id of book to request and call next
      req.body = {
        booksObjectId: newBook._id,
        totalBorrow: 0,
        totalQuantity: 1,
        totalAvailable: 1,
        ...req.body,
      };

      next();
    }
  };
}
module.exports = router;