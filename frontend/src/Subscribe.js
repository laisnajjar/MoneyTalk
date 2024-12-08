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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import SecurityIcon from "@mui/icons-material/Security";

const API_BASE_URL =
  process.env.REACT_APP_API_BASE_URL || "http://localhost:5000";
console.log("API_BASE_URL:", API_BASE_URL);

const Subscribe = () => {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [linkToken, setLinkToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);
  const [notificationPreference, setNotificationPreference] = useState("");

  // Fetch the Plaid Link token from the backend when the component mounts
  const fetchLinkToken = async (phoneNumber) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/create_link_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const data = await response.json();
      setLinkToken(data.link_token);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching Plaid link token:", error);
      setLoading(false);
    }
  };

  // Handle Plaid success event
  const handlePlaidSuccess = async (publicToken, metadata) => {
    try {
      console.log("Public Token:", publicToken);
      const response = await fetch(`${API_BASE_URL}/api/set_access_token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          public_token: publicToken,
          phoneNumber: phoneNumber,
        }),
      });
      console.log("Access Token Response:", response);
      const checkTransaction = await fetch(`${API_BASE_URL}/api/transactions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber: phoneNumber }),
      });
      console.log("Access Token Response:", checkTransaction);
    } catch (error) {
      console.error("Error exchanging public token:", error);
    }
  };

  // Handle login
  const handleLogin = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = await response.json();
      if (result.message === "User logged in successfully.") {
        setLoggedIn(true);
        alert("Logged in successfully.");
        fetchLinkToken(phoneNumber);
      } else {
        alert("Login failed. Please try again.");
      }
    } catch (error) {
      console.error("Error during login:", error);
      alert("Failed to login. Please try again.");
    }
  };

  // Handle unsubscribe action
  const handleUnsubscribe = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/unsubscribe`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ phoneNumber }),
      });
      const result = await response.json();
      if (result.message === "User unsubscribed successfully.") {
        setLoggedIn(false);
        setPhoneNumber("");
        alert(`Unsubscribed successfully for phone number: ${phoneNumber}`);
      } else {
        alert("Failed to unsubscribe. Please try again.");
      }
    } catch (error) {
      console.error("Error unsubscribing:", error);
      alert("Failed to unsubscribe. Please try again.");
    }
  };

  // Handle notification preference change
  const handlePreferenceChange = async (event) => {
    const newPreference = event.target.value;
    setNotificationPreference(newPreference);

    // Update preference in backend
    try {
      const response = await fetch(`${API_BASE_URL}/api/updateNotifications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          phoneNumber,
          notificationPreference: newPreference,
        }),
      });
      const result = await response.json();
      if (result.message === "Notification preference updated successfully.") {
        alert("Notification preference updated successfully.");
      } else {
        alert("Failed to update notification preferences.");
      }
    } catch (error) {
      console.error("Error updating notification preferences:", error);
      alert("Failed to update notification preferences. Please try again.");
    }
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
          MoneyTalk
        </Typography>

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
          Your accessible-for-all personal finance assistant. Connect your bank,
          track your spending, and gain control over your finances.
        </Typography>

        {loggedIn ? (
          <>
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
              Select your notification preferences and connect your bank.
            </Typography>

            <FormControl fullWidth sx={{ mb: 4 }}>
              <InputLabel>Notification Preference</InputLabel>
              <Select
                value={notificationPreference}
                onChange={handlePreferenceChange}
                label="Notification Preference"
              >
                <MenuItem value="daily">Daily SMS</MenuItem>
                <MenuItem value="weekly">Weekly SMS</MenuItem>
                <MenuItem value="monthly">Monthly SMS</MenuItem>
              </Select>
            </FormControl>

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
          </>
        ) : (
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
              onClick={handleLogin}
            >
              Login
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
        )}
      </Box>
    </Container>
  );
};

export default Subscribe;
