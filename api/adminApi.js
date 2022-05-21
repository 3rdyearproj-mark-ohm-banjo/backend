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
const { userAuthorize, Authorize } = require("../common/middleware");
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
const bucket = require("../common/getFireBasebucket");

router
  .use(Authorize("user"))
  .put("/bookShelf/:_id", multer.single("imgfile"), updateBookShelf());

function updateBookShelf() {
  return async (req, res, next) => {
    try {
      // add check isbn is already has
      const bookShelfId = req.params._id;
      const Bookshelf = await bookShelf.findById(bookShelfId);
      bookData = await JSON.parse(req.body.book);
      req.body = await { ...req.body, ...bookData ,totalBorrow: undefined , totalQuantity: undefined ,totalAvailable: undefined};
      const token = req.cookies.jwt;
      const payload = jwtDecode(token);
      const userdata = await user.findOne({ email: payload.email });
      if (!userdata) {
        throw "user not found";
      }
      if (userdata.role != "user") {
        throw "role is not admin ";
      }
      if (!Bookshelf) {
        const err = new Error("bookShelf not found");
        err.code = 500;
        throw err;
      }
      if (!req.file) {
        const err = new Error("file not found");
        err.code = 500;
        throw err;
      }
      const response = await bookShelf.findOneAndUpdate(
        { _id: bookShelfId },
        { ...req.body },
        { new: true }
      );
      const fileUpload = bucket.file(Bookshelf.imageCover);
      const blobStream = fileUpload.createWriteStream({
        metadata: {
          contentType: req.file.mimetype,
        },
      });

      blobStream.on("error", (err) => {
        errorRes(res, err);
      });

      blobStream.end(req.file.buffer);
      return successRes(res, response);
    } catch (error) {
      if (error.name === "ValidationError") {
        let errors = {};

        Object.keys(error.errors).forEach((key) => {
          errors[key] = error.errors[key].message;
        });

        return res.status(400).send(errors);
      } else if (error.name === "MongoServerError") 
      {
        if (error.codeName == "DuplicateKey") 
        {
          const dupkeyname = Object.keys(error.keyPattern)[0]
          const message = "this "+dupkeyname+" already exist"
          errorRes(res, error, message, 400);
        } 
        else return res.status(400).send(error);
      } 
      else errorRes(res, error, error.message, error.code ?? 500);
      // find way to catch mongoose validation
    }
  };
}

module.exports = router;
