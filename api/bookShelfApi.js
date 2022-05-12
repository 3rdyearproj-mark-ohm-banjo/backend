const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
  create,
  read,
  update,
  remove,
  readWithPages,
  readWithQuery
} = require("../common/crud");
const book = require("../models/book");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const { errData, errorRes, successRes } = require("../common/response");
const Multer = require("multer");
const admin = require("firebase-admin");

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

// const serviceAccount = require("../fileup/universityfilestorage-firebase-adminsdk-d90p8-54c9094fb7.json");
// const FirebaseApp = admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
//   //storageBucket: "firestore-example-7e462.appspot.com"
//   storageBucket: "universityfilestorage.appspot.com",
// });
// const storage = FirebaseApp.storage();
// const bucket = storage.bucket();
const bucket = require("../common/getFireBasebucket");

//const { notOnlyMember, notFound } = require('../common/middleware')

router
  // .get('/available/:lng/:lat/:page',
  // 	nearBy({ available: true }),
  // 	read(Restaurant, ['owner'])
  // )

  //.use(notOnlyMember)

  //   .get("/", read(publisher))
  .get("/", read(bookShelf, ["publisherId","types"]))
  .get("/:isbn",(req, res, next) => {
		const { isbn } = req.params
		req.body = [{ISBN:isbn}]
		next()
	},readWithQuery(bookShelf,["publisherId","types"]))
  .get("/bsP", readWithPages(bookShelf, ["publisherId","types"]))
  //.post("/bs", multer.single("imgfile"), createBookShelf(), create(bookShelf))
  .get("/bsImage/:id", (req, res) => {
    const file = bucket.file(`${req.params.id}`);
    file
      .download()
      .then((downloadResponse) => {
        //res.status(200).send(downloadResponse[0]);
        res.contentType(file.metadata.contentType);
        res.end(downloadResponse[0], "binary");
      })
      .catch((err) => {
        errorRes(res, err, "cant find image");
      });
  });
//   .post("/", create(book))
//   .put("/:_id", update(book))
//   .delete("/:_id", remove(book));

function createBookShelf() {
  // check isbn off bookshelf
  return async (req, res, next) => {
    //    const hasBS = true;
    //    const bSId = new mongoose.ObjectId;

    bookData = await JSON.parse(req.body.book);
    req.body = await { ...bookData, ...req.body };

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
        {
          $push: { booksObjectId: newBook._id },
          $inc: { totalAvailable: 1, totalQuantity: 1 },
        },
        { new: true },
        errData(res)
      );
    } else {
      const newBook = new book({
        _id: new mongoose.Types.ObjectId(),
        status: "available",
      });
      newBook.save(); // want to call save in next function
      //create book and add new object id of book to request and call next
      //const folder = "bookshelfImage";
      const fileName = 
      `${req.body.ISBN}${Date.now()}`;//remove folder
      const fileUpload = bucket.file(fileName);
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      blobStream.on("error", (err) => {
        errorRes(res, err);
      });

      // blobStream.on('finish', async () => {
      // //   const url = await fileUpload.getSignedUrl({action: 'read',
      // //   expires: '03-09-2491'
      // // })
      // // const url2 = await fileUpload.publicUrl()
      // //   res.status(200).send(url2+"       "+url);
      // const name = await fileUpload.name
      // req.body = {imageCover: name , ...req.body}
      // });

      blobStream.end(req.file.buffer);
      const name = await fileUpload.name;
      req.body = {
        booksObjectId: newBook._id,
        imageCover: name,
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
