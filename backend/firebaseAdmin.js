// firebaseAdmin.js
require("dotenv").config();
const admin = require("firebase-admin");
const serviceAccount = require(`./${process.env.FIREBASE_KEY}.json`);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: `https://${process.env.FIREBASE_ID}.firebaseio.com`,
});

const db = admin.firestore();

module.exports = { admin, db };
