// firebase.js
const admin = require("firebase-admin");
const serviceAccount = require(".spendwise-c5eba-firebase-adminsdk-key4m-9746a988fc.json"); // Update the path

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://spendwise-c5eba.firebaseio.com", // Update with your database URL
});

const db = admin.firestore(); // Use admin.database() for Realtime Database

module.exports = { admin, db };
