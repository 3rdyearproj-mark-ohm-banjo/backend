const express = require('express')
const router = express.Router()
const mongoose = require('mongoose')
const {
  create,
  read,
  update,
  remove,
  readWithPages,
  readWithQuery,
  search,
} = require('../common/crud')
const book = require('../models/book')
const publisher = require('../models/publisher')
const bookShelf = require('../models/bookshelf')
const bookHistory = require("../models/bookHistory");
const {errData, errorRes, successRes} = require('../common/response')
const Multer = require('multer')
const admin = require('firebase-admin')

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
})


const bucket = require('../common/getFireBasebucket')


router

  .get('/', read(bookShelf, ['publisherId', 'types']))//get out?
  .get(
    '/isbn/:isbn',
    (req, res, next) => {
      const {isbn} = req.params
      req.body = [{ISBN: isbn}]
      next()
    },
    readWithQuery(bookShelf, ['publisherId', 'types'])
    //getBookShelfByIsbn()
    
  )
  .get('/bsP', readWithPages(bookShelf, ['publisherId', 'types']))
  //.post("/bs", multer.single("imgfile"), createBookShelf(), create(bookShelf))
  .get('/bsImage/:id', (req, res) => {
    const file = bucket.file(`${req.params.id}`)
    file
      .download()
      .then((downloadResponse) => {
        //res.status(200).send(downloadResponse[0]);
        res.contentType(file.metadata.contentType)
        res.end(downloadResponse[0], 'binary')
      })
      .catch((err) => {
        errorRes(res, err, 'cant find image')
      })
  })
  .put('/bsImage/:name',multer.single('imgfile'),updateFile())// put it out 
  .get(
    '/search',
    (req, res, next) => {
      next()
    },
    search(bookShelf, ['publisherId', 'types'])
  )

//   .post("/", create(book))
//   .put("/:_id", update(book))
//   .delete("/:_id", remove(book));

function createBookShelf() {
  // check isbn off bookshelf
  return async (req, res, next) => {
    //    const hasBS = true;
    //    const bSId = new mongoose.ObjectId;

    bookData = await JSON.parse(req.body.book)
    req.body = await {...bookData, ...req.body}

    BS = await bookShelf.findOne(
      {ISBN: req.body.ISBN}
      // ,function (err, results) {
      //     if (err) { console.log(err) }
      //     if (!results.length) {
      //        hasBS = false
      //        bSId = results[0]._id
      //     }
      //     console.log(results[0]._id)
      // }
    )
    if (BS) {
      //check  has isbn and create book and add new object id of book to request and call next
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: 'available',
      })
      newBook.save()
      bookShelf.findOneAndUpdate(
        {_id: BS._id},
        {
          $push: {booksObjectId: newBook._id},
          $inc: {totalAvailable: 1, totalQuantity: 1},
        },
        {new: true},
        errData(res)
      )
    } else {
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: 'available',
      })
      newBook.save() // want to call save in next function
      //create book and add new object id of book to request and call next
      //const folder = "bookshelfImage";
      const fileName = `${req.body.ISBN}${Date.now()}` //remove folder
      const fileUpload = bucket.file(fileName)
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      })

      blobStream.on('error', (err) => {
        errorRes(res, err)
      })

      // blobStream.on('finish', async () => {
      // //   const url = await fileUpload.getSignedUrl({action: 'read',
      // //   expires: '03-09-2491'
      // // })
      // // const url2 = await fileUpload.publicUrl()
      // //   res.status(200).send(url2+"       "+url);
      // const name = await fileUpload.name
      // req.body = {imageCover: name , ...req.body}
      // });

      blobStream.end(req.file.buffer)
      const name = await fileUpload.name
      req.body = {
        booksObjectId: newBook._id,
        imageCover: name,
        totalBorrow: 0,
        totalQuantity: 1,
        totalAvailable: 1,
        ...req.body,
      }
      next()
    }
  }
}
function updateFile(){
  return (req,res,next) =>{
    const fileUpload = bucket.file(req.params.name)
    const blobStream = fileUpload.createWriteStream({
      metadata: {
        contentType: req.file.mimetype,
      },
    })

    blobStream.on('error', (err) => {
      errorRes(res, err)
    })
    blobStream.end(req.file.buffer)
    res.contentType(req.file.mimetype)
    res.end(req.file.buffer, 'binary')
  }
}
function getBookShelfByIsbn(){
  return async (req,res,next) =>{
    try {
      const isbn = req.params.isbn
      const bookShelfObject = await bookShelf.findOne({ISBN:isbn}).populate(['publisherId', 'types','booksObjectId'])
      console.log(bookShelfObject)
      if(bookShelfObject){
        bookShelfObject.totalAvailable = bookShelfObject.booksObjectId.filter(b => b.status == 'available').length
        let bookHisCount = 0
        bookShelfObject.booksObjectId.forEach(b => {
          bookHisCount = bookHisCount + b.bookHistorys.length
        });
        bookShelfObject.totalBorrow = bookHisCount
        bookShelfObject.totalQuantity = bookShelfObject.booksObjectId.length
        bookShelfObject.booksObjectId = null 
      }
      
      return successRes(res,bookShelfObject)
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  }
}
module.exports = router
