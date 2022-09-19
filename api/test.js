const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { create, read, update, remove ,readWithPages } = require("../common/crud");
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

  .get("/", read(publisher))
  .get("/bs", read(bookShelf, ["publisherId"]))
  .get("/pag", readWithPages(bookShelf, ["publisherId"])) 
  .post("/testBs", createBookShelf(), create(bookShelf))
  .post("/", create(book))
  .put("/:_id", update(book))
  .delete("/:_id", remove(book));

function createBookShelf() {
  // check isbn off bookshelf
  return async (req, res, next) => {
    //    const hasBS = true;
    //    const bSId = new mongoose.ObjectId;
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
      bookShelf.findOneAndUpdate(
        { _id: BS._id },
        { $push: { booksObjectId: newBook._id } },
        { new: true },
        errData(res)
      );
      newBook.save();// check save when dont has error may be change next to move create here 
    } else {
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: "available",
      });
      //newBook.save()
      //create book and add new object id of book to request and call next
      req.body = {
        booksObjectId: newBook._id,
        ...req.body,
      };

      next();
    }
  };
}
module.exports = router;
