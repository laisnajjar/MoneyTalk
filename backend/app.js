"use strict"; //indicate that the code should be executed in "strict mode".

// Load packages
const { Configuration, PlaidApi, PlaidEnvironments } = require("plaid"); //Plaid API
const express = require("express"); //back end web application framework for building RESTful APIs with Node.js
const bodyParser = require("body-parser"); //parse incoming request bodies in a middleware before your handlers, available under the req.body property.
const cors = require("cors"); //allows a server to indicate any origins (domain, scheme, or port) other than its own from which a browser should permit loading resources
const moment = require("moment"); //parse, validate, manipulate, and display dates and times in JavaScript.
const util = require("util");
require("dotenv").config(); // dotenv loads variables from .env
// Initialize the Express server
const app = express();
// const userRoutes = require("./routes/user");
app.use(express.json()); // Parse JSON bodies
// app.use("/api/user", userRoutes);
// Middleware
app.use(cors());
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
const client = new PlaidApi(configuration);
// helper functions
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

    const createTokenResponse = await client.linkTokenCreate(configs);
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

    const tokenResponse = await client.itemPublicTokenExchange({
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
        const transactionsResponse = await client.transactionsSync(request);
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

        prettyPrintResponse(transactionsResponse);
      }

      // // Calculate yesterday's date
      // const yesterday = moment().subtract(1, "days").format("YYYY-MM-DD");

      // // Filter transactions to only include those from yesterday
      // const yesterdayTransactions = added.filter(
      //   (txn) => txn.date === yesterday
      // );
      const compareTxnsByDateAscending = (a, b) =>
        (a.date > b.date) - (a.date < b.date);
      // Return the 8 most recent transactions
      const recently_added = [...added]
        .sort(compareTxnsByDateAscending)
        .slice(-10);
      response.json({ latest_transactions: recently_added });
    })
    .catch(next);
});
//TODO Balance! maybe investments!
// Route to unsubscribe a phone number from notifications
// app.post("/api/unsubscribe", async (req, res) => {
//   try {
//     const { phoneNumber } = req.body;

//     if (!phoneNumber) {
//       return res.status(400).json({ error: "Phone number is required" });
//     }

//     // Assuming you're using Firestore to store the phone numbers
//     const userRef = db.collection("users").doc(phoneNumber);
//     const doc = await userRef.get();

//     if (!doc.exists) {
//       return res.status(404).json({ error: "Phone number not found" });
//     }

//     // Remove the phone number from the Firestore collection or mark it as unsubscribed
//     await userRef.update({
//       subscribed: false, // Or you could delete the document with `await userRef.delete();`
//     });

//     res.json({ success: true, message: `Unsubscribed ${phoneNumber}` });
//   } catch (error) {
//     console.error("Error unsubscribing:", error);
//     res.status(500).json({ error: "Failed to unsubscribe" });
//   }
// });
// Start the server
const PORT = process.env.APP_PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
