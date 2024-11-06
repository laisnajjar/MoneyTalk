// firebaseAdmin.js
const admin = require("firebase-admin");
const serviceAccount = require("./moneytalk-271f5-firebase-adminsdk-nqn2g-cfbd7c799d.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://moneytalk-271f5.firebaseio.com"
});

const db = admin.firestore();

module.exports = { admin, db };
