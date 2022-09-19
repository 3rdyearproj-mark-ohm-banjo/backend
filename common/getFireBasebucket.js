
const admin = require("firebase-admin");

const serviceAccount = require("../fileup/universityfilestorage-firebase-adminsdk-d90p8-54c9094fb7.json");
const FirebaseApp = admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  //storageBucket: "firestore-example-7e462.appspot.com"
  storageBucket: "universitystorage2-19ae6.appspot.com",
});
const storage = FirebaseApp.storage();
const bucket = storage.bucket();

module.exports = bucket;