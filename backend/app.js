"use strict"; //indicate that the code should be executed in "strict mode".

// Load packages
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid"); //Plaid API
const express = require("express"); //back end web application framework for building RESTful APIs with Node.js
const bodyParser = require("body-parser"); //parse incoming request bodies in a middleware before your handlers, available under the req.body property.
const cors = require("cors"); //allows a server to indicate any origins (domain, scheme, or port) other than its own from which a browser should permit loading resources
const moment = require("moment"); //parse, validate, manipulate, and display dates and times in JavaScript.
const util = require("util");
require("dotenv").config(); // dotenv loads variables from .env
const { admin, db } = require("./firebaseAdmin");
const apiKey = process.env.NOTIFYRE_TOKEN;
console.log(apiKey);
const { NotifyreAPI, RecipientType } = require("notifyre-nodejs-sdk");
const notifyreAPI = new NotifyreAPI(apiKey);
const smsService = notifyreAPI.getSmsService();
// Initialize the Express server
const app = express();
// const userRoutes = require("./routes/user");
const corsOptions = {
  origin: "https://money-talk-frontend.vercel.app", //production
  //origin: "http://localhost:3000",
  methods: ["GET", "POST", "OPTIONS", "DELETE"],
  allowedHeaders: ["Content-Type", "Authorization"], // Allow the headers used in your request
  credentials: true,
};
app.use(express.json()); // Parse JSON bodies
// app.use("/api/user", userRoutes);
// Middleware
app.use(cors(corsOptions));
app.use(bodyParser.urlencoded({ extended: false })); // specifies the extended option as false, which means that the values can be only strings or arrays.
app.use(bodyParser.json());
// Define ACCESS_TOKEN globally
let ACCESS_TOKEN = null;
// Initialize the Plaid client
const configuration = new Configuration({
  basePath: PlaidEnvironments[process.env.PLAID_ENV],
  baseOptions: {
    headers: {
      "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
      "PLAID-SECRET": process.env.PLAID_SECRET,
      "Plaid-Version": "2020-09-14",
    },
  },
});
const plaidClient = new PlaidApi(configuration);
// const twilioClient = new twilio(
//   process.env.TWILIO_ACCOUNT_SID,
//   process.env.TWILIO_AUTH_TOKEN
// );
// --- Utils ----
const formatTransactionSummary = (transactions) => {
  let totalAmount = 0;
  const summaries = transactions.map((transaction) => {
    const { amount, date, name, category, merchant_name } = transaction;

    // Add to total amount
    totalAmount += amount;

    // Format the amount to show currency
    const formattedAmount = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);

    // Format the date
    const formattedDate = new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Determine the source or destination of the transaction
    const sourceOrDestination = merchant_name || name || "Unknown source";

    // Determine the category of the transaction
    const formattedCategory =
      category && category.length > 0 ? category.join(", ") : "Uncategorized";

    // Create the summary string
    const summary = `
      Date: ${formattedDate}
      Amount: ${formattedAmount}
      Source/Destination: ${sourceOrDestination}
      Category: ${formattedCategory}
    `;

    return summary.trim();
  });

  // Format the total amount
  const formattedTotalAmount = new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(totalAmount);

  // Combine all summaries and the total amount
  const finalSummary = `
    Transaction Summaries:
    ${summaries.join("\n\n")}
    
    Total Amount: ${formattedTotalAmount}
  `;
  // console.log(finalSummary);
  return finalSummary.trim();
};

const sendTransactionSummary = async (phoneNumber, summary) => {
  console.log("number:", phoneNumber);
  console.log("key:", apiKey);
  try {
    const response = await smsService.submitSms({
      body: "Hello Test!",
      from: "",
      recipients: [{ type: RecipientType.SmsNumber, value: "+16302098733" }],
      scheduledDate: null,
      addUnsubscribeLink: true,
      // callbackUrl: "https://mycallback.com/callback",
      // metadata: {
      //   Key: "Value",
      // },
      // campaignName: "sms-reference",
    });
    console.log(response);
  } catch (error) {
    console.log(error);
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const prettyPrintResponse = (response) => {
  console.log(util.inspect(response.data, { colors: true, depth: 4 }));
};
// Route to create a Plaid Link token and send it to the frontend
// See https://plaid.com/docs/#create-link-token
app.post("/api/create_link_token", async (req, res) => {
  try {
    const configs = {
      user: { client_user_id: "unique_user_id" }, // Replace with unique user ID
      client_name: "Spending Insights Bot",
      products: process.env.PLAID_PRODUCTS.split(","),
      country_codes: process.env.PLAID_COUNTRY_CODES.split(","),
      language: "en",
    };

    const createTokenResponse = await plaidClient.linkTokenCreate(configs);
    res.json(createTokenResponse.data); // Send link token back to frontend
  } catch (error) {
    console.error("Error creating Link token:", error);
    res.status(500).json({ error: "Unable to create Link token" });
  }
});
// Route to exchange a public token for an access token
// https://plaid.com/docs/#exchange-token-flow
app.post("/api/set_access_token", async function (request, response, next) {
  try {
    const PUBLIC_TOKEN = request.body.public_token; // Get the public token from the request

    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: PUBLIC_TOKEN,
    });

    // Debug: Print the response for verification
    console.log("Token Exchange Response:", tokenResponse.data);

    ACCESS_TOKEN = tokenResponse.data.access_token;
    const ITEM_ID = tokenResponse.data.item_id;

    // Send response back to the frontend (typically only item_id or similar non-sensitive info)
    response.json({
      item_id: ITEM_ID,
      error: null,
    });
  } catch (error) {
    console.error(
      "Error exchanging public token:",
      error.response?.data || error.message
    );
    response.status(500).json({ error: "Unable to exchange public token" });
  }
});
// Route to fetch transactions and analyze payment history
app.post("/api/transactions", function (request, response, next) {
  Promise.resolve()
    .then(async function () {
      console.log("Transactions API hit");
      // Set cursor to empty to receive all historical updates
      let cursor = null;

      // New transaction updates since "cursor"
      let added = [];
      let modified = [];
      // Removed transaction ids
      let removed = [];
      let hasMore = true;
      // Iterate through each page of new transaction updates for item
      while (hasMore) {
        const request = {
          access_token: ACCESS_TOKEN,
          cursor: cursor,
        };
        const transactionsResponse = await plaidClient.transactionsSync(
          request
        );
        const data = transactionsResponse.data;

        // If no transactions are available yet, wait and poll the endpoint.
        cursor = data.next_cursor;
        if (cursor === "") {
          await sleep(2000);
          continue;
        }

        // Add this page of results
        added = added.concat(data.added);
        modified = modified.concat(data.modified);
        removed = removed.concat(data.removed);
        hasMore = data.has_more;

        //prettyPrintResponse(transactionsResponse);
      }

      const compareTxnsByDateAscending = (a, b) =>
        (a.date > b.date) - (a.date < b.date);
      // Return the 8 most recent transactions
      const recently_added = [...added]
        .sort(compareTxnsByDateAscending)
        .slice(-10);

      // Format the transaction summary
      const summary = formatTransactionSummary(recently_added);

      // Send the summary via SMS
      sendTransactionSummary(request.body.phoneNumber, summary);

      response.json({ latest_transactions: recently_added });
    })
    .catch(next);
});
// Route to login a phone number
app.post("/api/login", async (req, res) => {
  const { phoneNumber, verificationCode } = req.body;

  try {
    // TODO Verify the verification code
    // const decodedToken = await admin.auth().verifyIdToken(verificationCode);

    // Check if user already exists
    const userDoc = db.collection("users").doc(phoneNumber);
    const userSnapshot = await userDoc.get();

    if (!userSnapshot.exists) {
      // If user doesn't exist, create a new record
      await userDoc.set({
        phoneNumber,
        notificationPreference: "daily", // default preference
      });
    }

    res.status(200).json({ message: "User logged in successfully." });
  } catch (error) {
    console.error("Error during login:", error);
    res
      .status(400)
      .json({ message: "Login failed. Invalid verification code." });
  }
});
// Unsubscribe endpoint to delete user data
app.post("/api/unsubscribe", async (req, res) => {
  const { phoneNumber } = req.body;

  try {
    const userDoc = db.collection("users").doc(phoneNumber);

    // Check if the user exists before attempting to delete
    const userSnapshot = await userDoc.get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    // Delete the user's document from Firestore
    await userDoc.delete();

    res.status(200).json({ message: "User unsubscribed successfully." });
  } catch (error) {
    console.error("Error during unsubscribe:", error);
    res
      .status(500)
      .json({ message: "Failed to unsubscribe. Please try again later." });
  }
});
// Update notification preferences endpoint
app.post("/api/updateNotifications", async (req, res) => {
  const { phoneNumber, notificationPreference } = req.body;

  try {
    const userDoc = db.collection("users").doc(phoneNumber);

    // Check if user exists before updating
    const userSnapshot = await userDoc.get();
    if (!userSnapshot.exists) {
      return res.status(404).json({ message: "User not found." });
    }

    // Update the user's notification preference
    await userDoc.update({ notificationPreference });

    res
      .status(200)
      .json({ message: "Notification preference updated successfully." });
  } catch (error) {
    console.error("Error updating notification preferences:", error);
    res
      .status(500)
      .json({ message: "Failed to update notification preferences." });
  }
});

//TODO Balance! maybe investments!
// Start the server
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
