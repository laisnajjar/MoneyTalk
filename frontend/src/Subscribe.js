import React, { useEffect, useState } from "react";
import { PlaidLink } from "react-plaid-link";
import {
  Box,
  Button,
  Container,
  CssBaseline,
  TextField,
  Typography,
  CircularProgress,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";

const Subscribe = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch the Plaid Link token from the backend when the component mounts
  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await fetch(
          "http://localhost:5000/api/create_link_token",
          {
            method: "POST",
          }
        );
        const data = await response.json();
        setLinkToken(data.link_token); // Set the Plaid link token in state
        setLoading(false); // Stop the loading indicator
      } catch (error) {
        console.error("Error fetching Plaid link token:", error);
        setLoading(false); // Stop the loading indicator even on error
      }
    };

    fetchLinkToken();
  }, []);

  // Handle Plaid success event
  const handlePlaidSuccess = async (publicToken, metadata) => {
    try {
      console.log("Public Token:", publicToken);

      // Send public token to the backend to exchange it for access token
      const response = await fetch(
        "http://localhost:5000/api/set_access_token",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ public_token: publicToken }),
        }
      );
      console.log("Access Token Response:", response);
      // After exchanging the token, fetch transactions for yesterday
      const transactionResponse = await fetch(
        "http://localhost:5000/api/transactions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          // body: JSON.stringify({
          //   phoneNumber, // Pass the phone number
          // }),
        }
      );

      const transactionData = await transactionResponse.json();
      console.log("Transaction SMS Sent:", transactionData);
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  // Handle unsubscribe action
  const handleUnsubscribe = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }), // Send the phone number to unsubscribe
      });
      const result = await response.json();
      console.log("Unsubscribe Response:", result);
      alert(`Unsubscribed successfully for phone number: ${phoneNumber}`);
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Failed to unsubscribe. Please try again.");
    }
  };

  // Handle form submission
  const handleSubmit = () => {
    console.log("Phone Number:", phoneNumber);
  };

  return (
    <Container component="main" maxWidth="md">
      <CssBaseline />
      <Box
        sx={{
          marginTop: 8,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        {/* Enhanced SpendWise Title */}
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: "bold",
            color: "primary.main",
            textAlign: "center",
            mb: 2,
          }}
        >
          Eagle Eye Spending
        </Typography>

        {/* Cool Tagline/Description */}
        <Typography
          variant="h6"
          component="p"
          gutterBottom
          sx={{
            color: "text.secondary",
            textAlign: "center",
            fontStyle: "italic",
            mb: 2,
          }}
        >
          Your smart personal finance assistant. Connect your bank, track your
          spending, and gain control over your finances.
        </Typography>
        <Typography
          variant="subtitle1"
          component="p"
          gutterBottom
          sx={{
            color: "text.secondary",
            textAlign: "center",
            fontStyle: "italic",
            mb: 4,
          }}
        >
          Receive a daily SMS message about your spending, weekly & monthly
          insights.
        </Typography>

        {/* Security Assurance Section */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            mb: 4,
          }}
          maxWidth="md"
        >
          <SecurityIcon color="success" sx={{ mr: 1 }} />
          <Typography
            variant="body2"
            component="p"
            sx={{
              color: "text.secondary",
              textAlign: "center",
            }}
          >
            Your data is secure and encrypted with <strong>Plaid</strong>.
          </Typography>
        </Box>

        {loading ? (
          <CircularProgress sx={{ mt: 4 }} />
        ) : linkToken ? (
          <PlaidLink
            token={linkToken}
            onSuccess={handlePlaidSuccess}
            onExit={(error, metadata) =>
              console.log("Plaid Exit", error, metadata)
            }
          >
            <Button
              variant="contained"
              color="success"
              sx={{
                mt: 3,
                backgroundColor: "success.light",
                "&:hover": {
                  backgroundColor: "success.dark",
                },
              }}
            >
              Connect Your Bank
            </Button>
          </PlaidLink>
        ) : (
          <Typography variant="body1" color="error" sx={{ mt: 4 }}>
            Unable to load. Please try again.
          </Typography>
        )}

        <Box component="form" noValidate sx={{ mt: 4 }} maxWidth="md">
          <TextField
            variant="outlined"
            fullWidth
            label="Phone Number"
            placeholder="Enter your phone number"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            margin="normal"
          />
          <Button
            variant="contained"
            color="success"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleSubmit}
          >
            Subscribe
          </Button>
          <Button
            variant="outlined"
            color="error"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleUnsubscribe}
          >
            Unsubscribe
          </Button>
        </Box>
      </Box>
    </Container>
  );
};

export default Subscribe;
