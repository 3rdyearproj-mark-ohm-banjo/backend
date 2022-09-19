const express = require("express");
const app = express();
const Multer = require('multer');

const admin = require('firebase-admin');

const multer = Multer({
  storage: Multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
  }
});

app.use(multer.array())
const serviceAccount = require('./fileup/universityfilestorage-firebase-adminsdk-d90p8-54c9094fb7.json');
const FirebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //storageBucket: "firestore-example-7e462.appspot.com"
  storageBucket: "universityfilestorage.appspot.com"
});
const storage = FirebaseApp.storage();
const bucket = storage.bucket();

app.all('/', (req,res) => res.status(200).send('Welcome to example firestorage api'));

app.post('/upload', multer.single('imgfile'),  (req, res) => {
  const folder = 'profile'
  const fileName = `${folder}/${Date.now()}`
  const fileUpload = bucket.file(fileName);
  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: req.file.mimetype
    }
  });

  blobStream.on('error', (err) => {
    res.status(405).json(err);
  });

  blobStream.on('finish', async () => {
    const url = await fileUpload.getSignedUrl({action: 'read',
    expires: '03-09-2491'
  })
  const url2 = await fileUpload.name
    res.status(200).send(url2+"       "+url);
  
  });

  blobStream.end(req.file.buffer);
});

app.get('/profile/:id', (req, res) => {
  const file = bucket.file(`profile/${req.params.id}`);
  file.download().then(downloadResponse => {
    //res.status(200).send(downloadResponse[0]);
    res.contentType(file.metadata.contentType);
  res.end(downloadResponse[0], 'binary');
  });
});

module.exports = app;