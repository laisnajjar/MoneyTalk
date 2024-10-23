// routes/user.js
const express = require("express");
const router = express.Router();
const { db } = require("../firebase"); // Import initialized db

// Route to add a user's phone number
router.post("/add-phone-number", async (req, res) => {
  const { userId, phoneNumber } = req.body;

  if (!userId || !phoneNumber) {
    return res
      .status(400)
      .json({ error: "User ID and phone number are required." });
  }

  try {
    await db
      .collection("users")
      .doc(userId)
      .set({ phoneNumber }, { merge: true });
    res.status(200).json({ message: "Phone number saved successfully." });
  } catch (error) {
    console.error("Error saving phone number:", error);
    res.status(500).json({ error: "Failed to save phone number." });
  }
});

module.exports = router;

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const twilio = require("twilio");

admin.initializeApp();
const db = admin.firestore();

const accountSid = "your_twilio_account_sid"; // Twilio Account SID
const authToken = "your_twilio_auth_token"; // Twilio Auth Token
const client = new twilio(accountSid, authToken);
const twilioNumber = "your_twilio_phone_number"; // Twilio Phone Number

exports.sendDailyTransactions = functions.pubsub
  .schedule("every day 09:00")
  .onRun(async (context) => {
    try {
      const usersSnapshot = await db.collection("users").get();
      const promises = [];

      usersSnapshot.forEach(async (doc) => {
        const user = doc.data();
        const phoneNumber = user.phoneNumber;

        // Fetch user's transactions from your database or API
        const transactions = await getUserTransactions(doc.id); // Implement this function

        const messageBody = formatTransactionsMessage(transactions); // Implement this function

        const messagePromise = client.messages.create({
          body: messageBody,
          from: twilioNumber,
          to: phoneNumber,
        });

        promises.push(messagePromise);
      });

      await Promise.all(promises);
      console.log("Daily transaction messages sent successfully.");
    } catch (error) {
      console.error("Error sending daily transactions:", error);
    }
  });
