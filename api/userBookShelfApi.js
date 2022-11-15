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
const { getOffQueue, getMatching } = require("../Service/userBookShelfService");
const { sendMail } = require("../common/nodemailer");
const { userAuthorize, Authorize } = require("../common/middleware");
const book = require("../models/book");
const bookHistory = require("../models/bookHistory");
const publisher = require("../models/publisher");
const bookShelf = require("../models/bookshelf");
const user = require("../models/user");
const donationHistory = require("../models/donationHistory");
const queue = require("../models/queues");
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
const currentBookAction = require("../models/currentBookAction");
const reportAdmin = require("../models/reportAdmin");
const hashUserData = require("../models/hashUserData");
const { createNewOrder } = require("../queues/order-queue");

//const borrowTransaction = require("../models/borrowTransaction");

router
  .use(Authorize("admin,user")) //may add middleware to check blacklist
  .post("/bookShelf", multer.single("imgfile"), createBookShelf())
  .delete("/canceldonation/:_id", deleteBook())
  .post("/addqueue/:_id", addQueue()) //new api start here
  .get("/forwardingrequest", getForwardRequest()) // may move this api to userapi
  .get("/borrowrequest", getBorrowRequest()) // may move this api to userapi
  .get("/successborrowrequest", getSuccessBorrowRequest()) // may move this api to userapi
  .get("/currentholding", getCurrentHolding()) // may move this api to userapi
  .put("/readingsuccess/:_id", confirmReadingSuccess()) //                       delete sort may be error if error use create time help it
  .put("/booksending/:_id", confirmSendingSuccess())
  .put("/cancelborrow/:_id", cancelBorrow()) // has update in release 2
  .put("/confirmreceive/:_id", confirmReceiveBook()) // gen expire date
  .delete("/acceptcancelborrow/:_id", acceptCancelBorrow()) //release 2 api start here
  .post(
    "/reportadmin",
    (req, res, next) => {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      req.body = {
        userWhoReport: payload.userId,
        reportId: req.body.reportId,
        idType: req.body.idType,
        message: req.body.message,
      };
      next();
    },
    create(reportAdmin)
  )
  .get("/myreport", getMyReport())
  .post("/sendmailverify", sendMailVerify());
function createBookShelf() {
  //date stamp here
  return async (req, res, next) => {
    try {
      //add current holder in book and add book history
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...bookData, ...req.body };
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email }).populate('currentBookAction');
      if (!userdata) {
        throw "user not found";
      }

      if (!(await userdata.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userdata.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      BS = await bookShelf.findOne({ ISBN: req.body.ISBN }).populate("queues");
      if (BS) {
        //check user has action to this book shelf before donate
        if (
          userdata.currentBookAction.filter((ca) => ca.bookShelfId.equals(BS._id)).length > 0
        ) {
          throw "can't donate book you has action ";
        }
        //check  has isbn and create book and add new object id of book to request and call next
        const bookId = new mongoose.Types.ObjectId();
        
        let addAvailable = 1
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          receiverInfo: userdata._id,
          book: bookId,
          receiveTime: new Date(),
        });
        await bookHis.save();
        const newBook = new book({
          _id: bookId,
          status: "available",
          currentHolder: userdata._id,
          bookShelf: BS._id,
          bookHistorys: bookHis._id,
        });
        await newBook.save();
        //  book history
        const donateHistory = new donationHistory({
          _id: new mongoose.Types.ObjectId(),
          book: bookId,
        });
        await donateHistory.save();
        await user.findOneAndUpdate(
          { _id: userdata._id },
          {
            $push: { donationHistory: donateHistory._id },
          },
          { new: true }
        );
        const bookshelfInfo = BS
        //queue will change to pending if it in process
        const waitQueues = bookshelfInfo.queues.filter(
          (q) => q.status == "waiting"
        );
        if (waitQueues.length > 0) {

          const queueInfo = waitQueues[0];
          const readyBookInfo = newBook; //maybe bug here
          const bookHis = new bookHistory({
            _id: new mongoose.Types.ObjectId(),
            receiverInfo: queueInfo.userInfo,
            book: readyBookInfo._id,
            senderInfo: readyBookInfo.currentHolder,
            // change status of queue to pending
          });
          const holderBookInfo = await user.findById(
            readyBookInfo.currentHolder
          );
          await sendMail(holderBookInfo, "getQueue", bookshelfInfo);
          await bookHis.save();
          await queue.findByIdAndUpdate(queueInfo._id, { status: "pending" });
          await book.findByIdAndUpdate(readyBookInfo._id, {
            $push: { bookHistorys: bookHis._id },
            status: "inProcess",
            readyToSendTime: new Date(),
          });
          addAvailable = 0
        }
        const response = await bookShelf.findOneAndUpdate(
          // may be change await async
          { _id: BS._id },
          {
            $push: { booksObjectId: bookId },
            $inc: { totalAvailable: addAvailable },
          },
          { new: true }
        );
        return successRes(res, response);
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
        const newBookShelf = new bookShelf({
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
        });
        const response = await newBookShelf.save();
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          receiverInfo: userdata._id,
          book: bookId,
          receiveTime: new Date(),
        });
        await bookHis.save();
        const newBook = new book({
          _id: bookId,
          status: "available",
          currentHolder: userdata._id,
          bookShelf: newBookShelf._id,
          bookHistorys: bookHis._id,
        });
        await newBook.save();
        //  book history
        const donateHistory = new donationHistory({
          _id: new mongoose.Types.ObjectId(),
          book: bookId,
        });
        await donateHistory.save();
        await user.findOneAndUpdate(
          { _id: userdata._id },
          {
            $push: { donationHistory: donateHistory._id },
          },
          { new: true }
        );
        return successRes(res, response);
      }
    } catch (e) {
      errorRes(res, e);
    }
  };
}
function updateBookShelf() {
  return async (req, res, next) => {
    try {
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...bookData, ...req.body };
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        throw "user not found";
      }
      BS = await bookShelf.findOne({ ISBN: req.body.ISBN });
      if (!BS) {
        throw "Isbn not found";
      } else if (!BS.queue) {
        return errorRes(
          res,
          null,
          "cant edit bookshelf that has queue please contact admin"
        );
      } else if (BS.booksObjectId.length != 1) {
      }
    } catch {}
  };
}
function deleteBook() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        const err = new Error("user not found");
        throw err;
      }
      const bookId = req.params._id;
      const bookdatas = await book.find({ _id: bookId });
      const bookdata = bookdatas[0];
      // add check book is not found
      if (bookdata == null) {
        const err = new Error("book not found");
        err.code = 501;
        throw err;
      }
      if (bookdata.bookHistorys.length != 1) {
        const err = new Error("can't cancel donate book that has been borrow");
        err.code = 501;
        throw err;
      } else if (!bookdata.currentHolder.equals(userdata._id)) {
        const err = new Error("can't cancel book your are not owner");
        err.code = 501;
        throw err;
      }
      //delete book ,in bookshelf, donation history , in user
      await book.deleteOne({ _id: bookdata._id });
      const donateHis = await donationHistory.findOne({ book: bookdata._id });
      await donationHistory.deleteOne({ _id: donateHis._id });
      // await user.findOneAndUpdate(
      //   { _id: userdata._id },
      //   {
      //     $push: { donationHistory: donateHistory._id },
      //   },
      //   { new: true });
      await user.findOneAndUpdate(
        { _id: userdata._id },
        {
          $pull: { donationHistory: donateHis._id },
        }
      );
      const bsdata = await bookShelf.findOneAndUpdate(
        { _id: bookdata.bookShelf },
        {
          $pull: {
            booksObjectId: bookdata._id,
          },
          $inc: { totalAvailable: -1, totalQuantity: -1 },
        },
        { new: true }
      );
      await bookHistory.deleteOne({ _id: bookdata.bookHistorys[0] });
      return successRes(res, bsdata);
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 500);
    }
  };
}
function addQueue() {
  // add notification here    check previous queue
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookShelfId = req.params._id;
      const bookshelfInfo = await bookShelf.findById(bookShelfId);
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      let bookAvailableCount = 0;
      // add bookhistory in book and find book that available in book shelf

      if (!(await userInfo.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (userInfo.currentBookAction.length >= 5) {
        const err = new Error("can action with book more than 5 book");
        err.code = 403;
        throw err;
      }
      if (!bookshelfInfo) {
        const err = new Error("bookShelf not found");
        err.code = 403;
        throw err;
      }
      if (
        userInfo.currentBookAction.filter((ba) =>
          ba.bookShelfId.equals(bookshelfInfo._id)
        ).length > 0
      ) {
        const err = new Error("can't queue book repeat");
        err.code = 403;
        throw err;
      }
      const bookHolding = await book.findOne({
        currentHolder: userInfo._id,
        bookShelf: bookshelfInfo._id,
      });
      if (bookHolding) {
        const err = new Error("can't queue holding book");
        err.code = 403;
        throw err;
      }
      const queueObject = new queue({
        _id: new mongoose.Types.ObjectId(),
        bookShelf: bookshelfInfo._id,
        userInfo: userInfo._id,
      });
      const currentBookAct = new currentBookAction({
        _id: new mongoose.Types.ObjectId(),
        userId: userInfo._id,
        bookShelfId: bookshelfInfo._id,
      });
      const readyBooks = await book.find({
        bookShelf: bookshelfInfo._id,
        status: "available",
      });
      readyBooks.sort(function (a, b) {
        return new Date(a.readyToSendTime) - new Date(b.readyToSendTime);
      });

      let senderEmail = null;
      if (readyBooks.length > 0) {
        const readyBookInfo = readyBooks[0]; // bug here
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          receiverInfo: userInfo._id,
          book: readyBookInfo._id,
          senderInfo: readyBookInfo.currentHolder,
          // change status of queue to pending
        });

        //console.log(readyBookInfo.currentHolder)
        const holderBookInfo = await user.findById(readyBookInfo.currentHolder);
        senderEmail = holderBookInfo.email;
        await sendMail(holderBookInfo, "getQueue", bookshelfInfo);

        queueObject.status = "pending";
        await bookHis.save();

        await book.findByIdAndUpdate(readyBookInfo._id, {
          $push: { bookHistorys: bookHis._id },
          status: "inProcess",
        });
        bookAvailableCount = -1;
      }
      await currentBookAct.save();
      await queueObject.save();
      const userUpdate = await user.findByIdAndUpdate(
        userInfo._id,
        { $push: { currentBookAction: currentBookAct._id } },
        { new: true }
      );
      const bookshelfUpdate = await bookShelf.findByIdAndUpdate(
        bookshelfInfo._id,
        {
          $push: { queues: queueObject._id },
          $inc: { totalAvailable: bookAvailableCount },
        },
        { new: true }
      );
      const queuePosition = bookshelfUpdate.queues.indexOf(queueObject._id);

      await sendMail(payload, "inQueue", bookshelfInfo, queuePosition);

      return successRes(res, { q: queuePosition, senderEmail });
      //return position in queue
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function getForwardRequest() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const userInfo = await user.findById(userId);
      // add bookhistory in book and find book that available in book shelf

      if (!(await userInfo.checkUserInfo())) {
        const err = new Error("User Error");
        err.code = 403;
        throw err;
      }
      var allRequest = await bookHistory
        .find({ senderInfo: userInfo._id, receiveTime: null })
        .populate([
          {
            path: "book",
            populate: {
              path: "bookShelf",
              model: "bookshelves",
            },
          },
          "receiverInfo",
        ]);
      return successRes(res, allRequest);
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function getSuccessBorrowRequest() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const userInfo = await user.findById(userId);
      // add bookhistory in book and find book that available in book shelf

      if (!(await userInfo.checkUserInfo())) {
        const err = new Error("User Error");
        err.code = 403;
        throw err;
      }
      var allRequest = await bookHistory
        .find({
          receiverInfo: userInfo._id,
          receiveTime: { $ne: null },
          senderInfo: { $ne: null },
        })
        .populate([
          {
            path: "book",
            populate: {
              path: "bookShelf",
              model: "bookshelves",
            },
          },
          "senderInfo",
        ]);
      return successRes(res, allRequest);
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function getBorrowRequest() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const userInfo = await user.findById(userId);
      // add bookhistory in book and find book that available in book shelf

      if (!(await userInfo.checkUserInfo())) {
        const err = new Error("User Error");
        err.code = 403;
        throw err;
      }
      let allRequest = await queue
        .find({ userInfo: userInfo._id })
        .populate("bookShelf")
        .lean();
      allRequest.forEach((item) => {
        item.queuePosition =
          item.bookShelf?.queues.findIndex(
            (id) => id.toString() === item._id.toString()
          ) ?? 0;
      });
      const bookTransaction = await bookHistory
        .find({ receiverInfo: userInfo._id, receiveTime: null })
        .populate("book");
      // .populate([ {
      //   path: 'book',
      //   populate: {
      //     path: 'bookShelf',
      //     model: 'bookshelves',
      //   }
      // },'senderInfo'])
      const final = { allRequest, bookTransaction };
      return successRes(res, final);
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function getCurrentHolding() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const userInfo = await user.findById(userId);
      const donateBooks = [];
      const borrowBooks = [];
      // add bookhistory in book and find book that available in book shelf

      if (!(await userInfo.checkUserInfo())) {
        const err = new Error("User Error");
        err.code = 403;
        throw err;
      }
      const holdingBooks = await book
        .find({ currentHolder: userInfo._id, status: { $ne: "unavailable" } })
        .populate("bookShelf")
        .populate("bookHistorys")
        .lean();

      // bookhis length and if userId = receiverInfo is donation
      //const BooksInfo = holdingBooks.filter(b=> b.bookHistorys.length < 3 &&  b.bookHistorys[0].receiverInfo.toString() == userInfo._id.toString())
      holdingBooks.forEach((b) => {
        if (
          b.bookHistorys.length < 3 &&
          b.bookHistorys[0].receiverInfo?.toString() == userInfo._id.toString()
        ) {
          donateBooks.push(b);
        } else {
          if (
            b.bookHistorys[b.bookHistorys.length - 1].senderInfo.toString() ==
            userInfo._id
          ) {
            //check has borrow req bookhistory is change state to available
            b.bookHistorys = b.bookHistorys[b.bookHistorys.length - 2];
          } else {
            b.bookHistorys = b.bookHistorys[b.bookHistorys.length - 1];
          }
          borrowBooks.push(b);
        }
      });
      // in borrow add last bookhistory
      return successRes(res, { donateBooks, borrowBooks });
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function confirmReadingSuccess() {
  // may add logic for people who late
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookId = req.params._id;
      const bookInfo = await book.findById(bookId); // book status wont be available
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      // add bookhistory in book and change status of book
      let availableCount = 0;
      if (!(await userInfo.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (!bookInfo) {
        const err = new Error("book not found");
        err.code = 403;
        throw err;
      }
      if (bookInfo.currentHolder != userId || bookInfo.status != "holding") {
        // may be add logic bookstatus must not available
        const err = new Error("can't access book");
        err.code = 403;
        throw err;
      }
      await book.findByIdAndUpdate(bookInfo._id, { status: "available" });
      // check from bookshelf if has ready queue add book history
      const bookshelfInfo = await bookShelf
        .findById(bookInfo.bookShelf)
        .populate("queues");
      //queue will change to pending if it in process
      const waitQueues = bookshelfInfo.queues.filter(
        (q) => q.status == "waiting"
      );
      if (waitQueues.length > 0) {
        //waitQueues must sort by id
        //waitQueues.sort(function (a, b) { return a._id.toString().localeCompare(b._id.toString()) })
        const queueInfo = waitQueues[0];
        const readyBookInfo = bookInfo; //maybe bug here
        const bookHis = new bookHistory({
          _id: new mongoose.Types.ObjectId(),
          receiverInfo: queueInfo.userInfo,
          book: readyBookInfo._id,
          senderInfo: readyBookInfo.currentHolder,
          // change status of queue to pending
        });
        const holderBookInfo = await user.findById(readyBookInfo.currentHolder);
        await sendMail(holderBookInfo, "getQueue", bookshelfInfo);
        await bookHis.save();
        await queue.findByIdAndUpdate(queueInfo._id, { status: "pending" });
        await book.findByIdAndUpdate(readyBookInfo._id, {
          $push: { bookHistorys: bookHis._id },
          status: "inProcess",
          readyToSendTime: new Date(),
        });
      } else {
        await bookShelf.findByIdAndUpdate(bookInfo.bookShelf, {
          $inc: { totalAvailable: 1 },
        });
      }
      const sortHistorys = bookInfo.bookHistorys.sort(function (a, b) {
        return b._id.toString().localeCompare(a._id.toString());
      });
      await bookHistory.findByIdAndUpdate(sortHistorys[0], {
        receiverReadingSuccessTime: new Date(),
      }); // write tub
      return successRes(res, {
        msg: "book status has update please check receiver information",
      });
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function confirmSendingSuccess() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookId = req.params._id;
      const bookInfo = await book.findById(bookId).populate("bookHistorys");
      const bookShelfInfo = await bookShelf.findById(bookInfo.bookShelf);
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      // add bookhistory in book and change status of book

      if (!(await userInfo.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (!bookInfo) {
        const err = new Error("book not found");
        err.code = 403;
        throw err;
      }
      if (bookInfo.currentHolder != userId || bookInfo.status != "inProcess") {
        const err = new Error("can't access book");
        err.code = 403;
        throw err;
      }
      await book.findByIdAndUpdate(bookInfo._id, { status: "sending" });

      //  change queue status to pending and add infomation to book history
      const bookHis = bookInfo.bookHistorys.sort(function (a, b) {
        return b._id.toString().localeCompare(a._id.toString());
      });
      //await queue.findOneAndUpdate({bookShelf:bookInfo.bookShelf,userInfo:bookHis[0].receiverInfo},{status:'pending'})
      await bookHistory.findByIdAndUpdate(bookHis[0]._id, {
        sendingTime: new Date(),
      });

      // console.log(bookHis[0].receiverInfo)
      const receiverInfo = await user.findById(bookHis[0].receiverInfo);
      // console.log(bookHis)
      // console.log(receiverInfo)
      // console.log(receiverInfo.username)

      //return successRes(res,bookHis)
      const orderObj = { reportId: bookHis[0]._id };
      await createNewOrder(orderObj);
      await sendMail(payload, "sendConfirm", bookShelfInfo);
      await sendMail(receiverInfo, "receive", bookShelfInfo);

      //return successRes(res,bookHis)
      return successRes(res, {
        msg: "confirm sending success",
        senderEmail: receiverInfo.email,
      });
    } catch (error) {
      errorRes(res, error, error.message, error.code ?? 400);
    }
  };
}
function cancelBorrow() {
  // if user who borrow book use this may not bug /need current holder
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookShelfId = req.params._id;
      const bookShelfInfo = await bookShelf.findById(bookShelfId);
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      const bookHisId = req.query.bookHisId;
      const bookHisInfo = await bookHistory
        .findById(bookHisId)
        .populate("book");
      // add bookhistory in book and change status of book

      if (!(await userInfo.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (!bookShelfInfo) {
        const err = new Error("bookShelf not found");
        err.code = 403;
        throw err;
      }
      //delete queue object queue in array delete data in bookaction
      const queueInfo = await queue.findOne({
        bookShelf: bookShelfInfo._id,
        userInfo: userInfo._id,
      });
      if (!queueInfo) {
        const err = new Error("you did not queue this book");
        err.code = 403;
        throw err;
      }
      if (queueInfo.status == "pending" && bookHisInfo == null) {
        const err = new Error("can not cancel borrow In-process book ");
        err.code = 403;
        throw err;
      }
      const currentBookAct = await currentBookAction.findOne({
        userId: userInfo._id,
        bookShelfId: bookShelfInfo._id,
      });
      if (!currentBookAct) {
        const err = new Error("operation may mistake please contact admin");
        err.code = 403;
        throw err;
      }

      if (bookHisInfo != null) {
        if (bookHisInfo.book.status == "sending") {
          const err = new Error(
            "can not cancel borrow sending book contact admin if it too long"
          );
          err.code = 403;
          throw err;
        }

        const bookInfo = await book.findById(bookHisInfo.book._id);
        const senderInfo = await user.findById(bookInfo.currentHolder);
        await bookHistory.findByIdAndUpdate(bookHisInfo._id, {
          borrowerNeedToCancel: true,
        });
        return successRes(res, {
          msg: "cancel borrow request send to holder please wait holder acknowledge",
          senderEmail: senderInfo.email,
        });
      } else {
        await queue.findByIdAndDelete(queueInfo._id);
        await bookShelf.findOneAndUpdate(
          { _id: bookShelfInfo._id },
          {
            $pull: { queues: queueInfo._id },
          }
        );
        await currentBookAction.findByIdAndDelete(currentBookAct._id);
        await user.findOneAndUpdate(
          { _id: userInfo._id },
          {
            $pull: { currentBookAction: currentBookAct._id },
          }
        );
        //test error
        return successRes(res, { msg: "cancel borrow complete" });
        // return successRes(res,{msg:"book status has update please check receiver information"});
      }
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  };
}
function confirmReceiveBook() {
  // add totalborrow
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookId = req.params._id;
      const bookInfo = await book.findById(bookId);
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      const oldBookHolder = await user.findById(bookInfo.currentHolder);

      if (!(await userInfo.checkUserInfo())) {
        // check if info of user ready it will return true
        const err = new Error("please add user information first");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (!bookInfo) {
        const err = new Error("book not found");
        err.code = 403;
        throw err;
      }
      const bookHis = await bookHistory.findOne({
        receiverInfo: userInfo._id,
        book: bookInfo._id,
        status: "inProcess",
        sendingTime: { $ne: null },
      }); //sending time may be change if want implement case unclick sending

      if (!bookHis) {
        const err = new Error("can't access book");
        err.code = 403;
        throw err;
      }
      const today = new Date();
      const next14day = new Date(today.getTime() + 14 * 24 * 60 * 60 * 1000);
      //change book holder update bookhistory status and add timestamp
      await bookHistory.findByIdAndUpdate(bookHis._id, {
        status: "success",
        receiveTime: new Date(),
        expireTime: next14day,
      });
      await book.findByIdAndUpdate(bookInfo._id, {
        currentHolder: userInfo._id,
        status: "holding",
      });
      //delete receiver queue object queue in array delete data in sender bookaction
      const queueInfo = await queue.findOne({
        bookShelf: bookInfo.bookShelf,
        userInfo: userInfo._id,
      });

      const currentBookAct = await currentBookAction.findOne({
        userId: bookHis.senderInfo,
        bookShelfId: bookInfo.bookShelf,
      });
      if (!currentBookAct && bookInfo.bookHistorys.length > 2) {
        const err = new Error("operation may mistake please contact admin");
        err.code = 403;
        throw err;
      }
      await queue.findByIdAndDelete(queueInfo._id);
      await bookShelf.findOneAndUpdate(
        { _id: bookInfo.bookShelf },
        {
          $pull: { queues: queueInfo._id },
          $inc: { totalBorrow: 1 },
        }
      );
      if (bookInfo.bookHistorys.length > 2) {
        await currentBookAction.findByIdAndDelete(currentBookAct._id);
        await user.findOneAndUpdate(
          { _id: bookHis.senderInfo },
          {
            $pull: { currentBookAction: currentBookAct._id },
          }
        );
      }

      // const newBorrowTransaction = new borrowTransaction({
      //   _id: new mongoose.Types.ObjectId(),
      //   bookHistoryInfo: bookHis._id,
      //   expireTime: next14day
      // })
      // newBorrowTransaction.save()
      return successRes(res, {
        msg: "confirm receive complete",
        senderEmail: oldBookHolder?.email,
      });
      // return successRes(res,{msg:"book status has update please check receiver information"});
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  };
}
function acceptCancelBorrow() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userId = payload.userId;
      const bookHisId = req.params._id;
      const bookHisInfo = await bookHistory
        .findById(bookHisId)
        .populate("book");
      const userInfo = await user
        .findById(userId)
        .populate("currentBookAction");
      if (!bookHisInfo) {
        const err = new Error("bookhistory not found");
        err.code = 403;
        throw err;
      }
      if (!(await userInfo.checkUserInfo())) {
        const err = new Error("please check your account");
        err.code = 403;
        throw err;
      }

      if (!userInfo.verifyEmail) {
        const err = new Error("please verify email");
        err.code = 403;
        throw err;
      }

      if (
        bookHisInfo.senderInfo.toString() != userInfo._id.toString() ||
        bookHisInfo.borrowerNeedToCancel == false
      ) {
        const err = new Error("can't access this history");
        err.code = 403;
        throw err;
      }
      const receiverInfo = await user
        .findById(bookHisInfo.receiverInfo)
        .populate("currentBookAction");
      if (!receiverInfo) {
        const err = new Error("false operation contact admin");
        err.code = 403;
        throw err;
      }
      const queueInfo = await queue.findOne({
        bookShelf: bookHisInfo.book.bookShelf,
        userInfo: receiverInfo._id,
      }); // queue has delete
      console.log(bookHisInfo.book.bookShelf);
      console.log(queueInfo);
      const receiverCurrentBookAct = receiverInfo.currentBookAction.filter(
        (ca) => ca.bookShelfId.toString() == bookHisInfo.book.bookShelf
      );

      await getOffQueue(
        queueInfo._id,
        bookHisInfo.book.bookShelf,
        receiverInfo._id,
        receiverCurrentBookAct[0]._id
      );
      //delete book history
      // update status of book and add total available in bookShelf
      await book.findByIdAndUpdate(bookHisInfo.book._id, {
        $pull: { bookHistorys: bookHisInfo._id },
        status: "available",
      });
      await bookHistory.findByIdAndDelete(bookHisInfo._id);

      //after delete success match receiver and sender again
      const bookshelfInfo = await bookShelf
        .findById(bookHisInfo.book.bookShelf)
        .populate("queues");
      const waitQueues = bookshelfInfo.queues.filter(
        (q) => q.status == "waiting"
      );
      if (waitQueues.length > 0) {
        waitQueues.sort(function (a, b) {
          return a._id.toString().localeCompare(b._id.toString());
        });
        const queueInfo = waitQueues[0];
        await getMatching(
          queueInfo.userInfo,
          userInfo._id,
          queueInfo._id,
          bookHisInfo.book._id,
          true
        );
      } else {
        await bookShelf.findByIdAndUpdate(bookshelfInfo._id, {
          $inc: { totalAvailable: 1 },
        });
      }

      return successRes(res, {
        msg: "accept cancel borrow complete ",
        senderEmail: receiverInfo?.email,
      });
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  };
}

function sendMailVerify() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const tokenPayload = jwtDecode(token);
      const userId = tokenPayload.userId;
      const userInfo = await user.findById(userId);

      if (!userInfo) {
        return res.status(404).json("email not found");
      }

      const hashType = "verifyMail";
      const hashData = new hashUserData({
        _id: new mongoose.Types.ObjectId(),
        userId,
        hashType,
      });

      hashData.save();

      const payload = {
        email: userInfo.email,
        user: userInfo,
        hashId: hashData._id,
      };

      sendMail(payload, "verifyEmail");
      return res.status(200).json("email verify has been sent");
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  };
}

function getMyReport() {
  return async (req, res, next) => {
    try {
      const token = req.cookies.jwt;
      const tokenPayload = jwtDecode(token);
      const userId = tokenPayload.userId;
      const userInfo = await user.findById(userId);

      if (!userInfo) {
        return res.status(404).json("user not found");
      }

      let reportInfo = await reportAdmin.find({ userWhoReport: userId });
      return successRes(res, reportInfo);
    } catch (error) {
      errorRes(res, error, error.message ?? error, error.code ?? 400);
    }
  };
}
module.exports = router;
