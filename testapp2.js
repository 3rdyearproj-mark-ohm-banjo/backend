const express = require("express");
const app = express();
const Multer = require('multer');
const uuid = require('uuid-v4');


const admin = require('firebase-admin');

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

const serviceAccount = require('./fileup/universityfilestorage-firebase-adminsdk-d90p8-54c9094fb7.json');
const FirebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //storageBucket: "firestore-example-7e462.appspot.com"
  storageBucket: "universityfilestorage.appspot.com"
});
const storage = FirebaseApp.storage();
const bucket = storage.bucket();

app.all('/', (req,res) => res.status(200).send('Welcome to example firestorage api'));

app.post('/upload', multer.single('img'), (req, res) => {
  const folder = 'profile'
  const fileName = `${folder}/${Date.now()}`
//   const fileUpload = bucket.file(fileName);
//   const blobStream = fileUpload.createWriteStream({
//     metadata: {
//     firebaseStorageDownloadTokens: uuid(),
//       contentType: req.file.mimetype
//     }
//   });
const metadata = {
    metadata: {
      // This line is very important. It's to create a download token.
      firebaseStorageDownloadTokens: uuid()
    },
    contentType: req.file.mimetype,
  };
   bucket.upload(req.file, {
    // Support for HTTP requests made with `Accept-Encoding: gzip`
    gzip: true,
    metadata: metadata,
  });
  console.log(` uploaded.`);

//   blobStream.on('error', (err) => {
//     res.status(405).json(err);
//   });

//   blobStream.on('finish', () => {
//     res.status(200).send('Upload complete!');
//   });

//   blobStream.end(req.file.buffer);
});

app.get('/profile/:id', (req, res) => {
  const file = bucket.file(`profile/${req.params.id}`);
  file.download().then(downloadResponse => {
    res.status(200).send(downloadResponse[0]);
  });
});

module.exports = app;