const jwtDecode = require("jwt-decode");
const router = require("express").Router(),
  jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
passport = require("passport");
const {
  create,
  read,
  update,
  remove,
  readWithPages,
} = require("../common/crud");
const { userAuthorize } = require("../common/middleware");
const book = require("../models/book");
const bookHistory = require("../models/bookHistory");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const user = require("../models/user");
const donationHistory = require("../models/donationHistory");
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
//const bucket = storage.bucket();
const bucket = require("../common/getFireBasebucket");
const bookshelf = require("../models/bookshelf");

router
  .use(userAuthorize)
  .post(
    "/bookShelf",
    multer.single("imgfile"),
    createBookShelf(),
    create(bookShelf)
  )
  .delete("/canceldonation/:_id",deleteBook())








function createBookShelf() {
  return async (req, res, next) => {
    try {
      //add current holder in book and add book history
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...bookData, ...req.body };
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        throw "user not found";
      }
      BS = await bookShelf.findOne({ ISBN: req.body.ISBN });
      if (BS) {
        //check  has isbn and create book and add new object id of book to request and call next
        const bookId = new mongoose.Types.ObjectId();
        bookShelf.findOneAndUpdate(// may be change await async 
          { _id: BS._id },
          {
            $push: { booksObjectId: bookId },
            $inc: { totalAvailable: 1, totalQuantity: 1 },
          },
          { new: true },
          errData(res)
        );
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          userInfo: userdata._id,
          book: bookId
        })
        await bookHis.save();
        const newBook = new book({
          _id: bookId,
          status: "available",
          currentHolder: userdata._id,
          bookShelf: BS._id,
          bookHistorys: bookHis._id
        });
        await newBook.save();
        //  book history 
        const donateHistory = new donationHistory({
          _id: new mongoose.Types.ObjectId(),
          book: bookId
        })
        await donateHistory.save();
        await user.findOneAndUpdate(
          { _id: userdata._id },
          {
            $push: { donationHistory: donateHistory._id },
          },
          { new: true });


      } else {
        if (!req.file) {
          throw "file not found";
        }
        const fileName = `${req.body.ISBN}${Date.now()}`; //remove folder
        const fileUpload = bucket.file(fileName);
        const blobStream = fileUpload.createWriteStream({
          metadata: {
            contentType: req.file.mimetype,
          },
        });

        blobStream.on("error", (err) => {
          errorRes(res, err);
        });

        blobStream.end(req.file.buffer);
        const name = await fileUpload.name;

        const bookId = new mongoose.Types.ObjectId();
        const newBookShelf = new bookshelf({
          _id: new mongoose.Types.ObjectId(),
          booksObjectId: bookId,
          bookName: req.body.bookName,
          firstYearOfPublication: req.body.firstYearOfPublication,
          author: req.body.author,
          publisherId: req.body.publisherId,
          types: req.body.types,
          ISBN: req.body.ISBN,
          imageCover: name,
          totalBorrow: 0,
          totalQuantity: 1,
          totalAvailable: 1,
        })
        const response = await newBookShelf.save();
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          userInfo: userdata._id,
          book: bookId
        })
        await bookHis.save();
        const newBook = new book({
          _id: bookId,
          status: "available",
          currentHolder: userdata._id,
          bookShelf: newBookShelf._id,
          bookHistorys: bookHis._id
        });
        await newBook.save();
        //  book history 
        const donateHistory = new donationHistory({
          _id: new mongoose.Types.ObjectId(),
          book: bookId
        })
        await donateHistory.save();
        await user.findOneAndUpdate(
          { _id: userdata._id },
          {
            $push: { donationHistory: donateHistory._id },
          },
          { new: true });
          
        return successRes(res,response)
      }
    } catch (e) {
      errorRes(res, e);
    }
  };
}

function updateBookShelf(){
  return async(req,res,next) =>{
    try{
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...bookData, ...req.body };
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        throw "user not found";
      }
      BS = await bookShelf.findOne({ ISBN: req.body.ISBN });
      if(!BS){
        throw "Isbn not found";
      } else if(!BS.queue){
        return errorRes(res,null,"cant edit bookshelf that has queue please contact admin")
      }else if(BS.booksObjectId.length != 1){}
      
    }catch{}
  }
}
function deleteBook(){
  return async(req,res,next)=>{
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        const err = new Error("user not found");
        throw err
      }
      const bookId = req.params._id
      const bookdatas = await book.find({_id:bookId})
      const bookdata = bookdatas[0]
      // add check book is not found 
      if(bookdata.bookHistorys.length != 1){
        const err = new Error("can't cancel donate book that has been borrow");
        err.code = 501
        throw err
      }else if(!bookdata.currentHolder.equals(userdata._id)){
        const err = new Error("can't cancel book your are not owner");
        err.code = 501
        throw err
      }
      //delete book ,in bookshelf, donation history , in user  
      await book.deleteOne({_id:bookdata._id})
      const donateHis = await donationHistory.findOne({book:bookdata._id})
      await donationHistory.deleteOne({_id:donateHis._id})
      // await user.findOneAndUpdate(
      //   { _id: userdata._id },
      //   {
      //     $push: { donationHistory: donateHistory._id },
      //   },
      //   { new: true });
      console.log(userdata._id)
      console.log(bookdata._id)
      console.log(bookdata.bookShelf)
      console.log(donateHis._id)

      await user.findOneAndUpdate(
        {_id:userdata._id},
        {
        $pull: { donationHistory:donateHis._id},
        })
      const bsdata = await bookshelf.findOneAndUpdate(
        {_id:bookdata.bookShelf},
        {
        $pull: {
          booksObjectId:bookdata._id },
        },
        { new: true })
      await bookHistory.deleteOne({_id:bookdata.bookHistorys[0]})
      return successRes(res,bsdata)
    } catch (error) {
      errorRes(res,error,error.message,error.code??500)
    }
  }
}
module.exports = router;
