"use client";

import React, { useState } from "react";
import {
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Box,
  Container,
  Grid,
  IconButton,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { useAuth } from "../components/auth/AuthContext";
import logo from "../assets/images (1).png";
import banner from "../assets/about-image.png";
import playstore from "../assets/playstore.png";
import appstore from "../assets/appstore.png";

const API_URL = "http://139.5.190.143/LIT/src/auth";

export default function LoginPage() {
  const [empId, setEmpId] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotPasswordError, setForgotPasswordError] = useState("");
  const [forgotPasswordSuccess, setForgotPasswordSuccess] = useState("");
  const [openDialog, setOpenDialog] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md")); // Check if the screen is mobile

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await axios.post(`${API_URL}/login.php`, {
        EmpId: empId,
        password: password,
      });

      if (response.data.success) {
        login(response.data.data);
        setTimeout(() => {
          navigate("/profile");
        }, 1000);
        setLoading(false);
      } else {
        setLoading(false);
        setError(response.data.message);
      }
    } catch (error) {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setLoading(true);
    setForgotPasswordError("");
    setForgotPasswordSuccess("");

    try {
      const response = await axios.post(`${API_URL}/forget_password.php`, {
        email: forgotEmail,
      });

      if (response.data.success) {
        setForgotPasswordSuccess("An email with a new password has been sent.");
        setOpenDialog(false);
      } else {
        setForgotPasswordError(response.data.message || "Error sending email");
      }
    } catch (error) {
      setForgotPasswordError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container
      maxWidth={false}
      style={{
        padding: 0,
        margin: 0,
        width: "100%",
        height: isMobile ? "auto" : "100vh", // Allow scrolling on mobile
        overflow: "hidden",
      }}
    >
      <Grid
        container
        alignItems="center"
        justifyContent="center"
        style={{ height: isMobile ? "auto" : "100vh", width: "100%" }} // Allow scrolling on mobile
      >
        <Grid
          item
          xs={12}
          md={7.5}
          style={{
            position: "relative",
            background: "linear-gradient(to top, #1B3156, #1B3156)",
            height: isMobile ? "40vh" : "100vh",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            overflow: "hidden",
          }}
        >
          {/* Banner Image */}
          <img
            src={banner}
            alt="Banner"
            style={{
              width: isMobile ? "100%" : "100%",
              height: "100%",
              objectFit: "cover",
              position: "absolute",
              top: 0,
              left: 0,
              zIndex: 1,
            }}
          />

          {/* Light Overlay Mask */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(53, 44, 44, 0.46)", // Light mask
              zIndex: 2,
            }}
          />

          {/* Text Overlay */}
          {/* Top-left heading */}
          <Box
            sx={{
              position: "absolute",
              top: 30,
              left: 30,
              zIndex: 3,
              color: "#fff",
              display: "flex",
              alignItems: "center",
              gap: "15px",
            }}
          >
            <img
              src={logo}
              alt="Namami Infotech Logo"
              width={40}
              height={40}
              style={{ marginBottom: 5 }}
            />
            <Typography
              variant={isMobile ? "h6" : "h5"}
              fontWeight="bold"
              sx={{ lineHeight: 1.2 }}
            >
              Lakshay Institute of Technology
            </Typography>
          </Box>

          {/* Centered paragraph */}
          {!isMobile && 
           <Box
            sx={{
              position: "relative",
              zIndex: 3,
              
              padding: "0 20px",
              color: "#fff",
            }}
          >
            <Typography
              variant="h5"
              sx={{ maxWidth: "600px", margin: "0 auto" }}
            >
              Lakshya Institute of Technology (LIT), Bhubaneswar: A Vision for
              IT Excellence
            </Typography>
            <br/>
            <Typography
              variant="body1"
              sx={{ maxWidth: "600px", margin: "0 auto" }}
            >
              Lakshya Institute of Technology (LIT), Bhubaneswar, was founded in
              2016 by Prof. Susant K. Rout with the vision of bridging the gap
              between academic education and IT industry demands. Recognizing
              Odisha’s growing potential in technology, LIT is committed to
              producing skilled professionals through practical,
              industry-oriented training.
            </Typography>
          </Box>
          }
         
        </Grid>

        {/* Right Side (30% of the screen) */}
        <Grid
          item
          xs={12}
          md={4.5} // 30% of the screen
          style={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            height: isMobile ? "auto" : "100vh", // Allow scrolling on mobile
            padding: isMobile ? "20px 0" : 0, // Add padding on mobile
          }}
        >
          <Box
            display="flex"
            flexDirection="column"
            alignItems="center"
            style={{
              padding: 20,
              maxWidth: "350px",
              width: "100%",
            }}
          >
            <img
              src={logo}
              alt="Namami Infotech Logo"
              width={120}
              height={120}
              style={{ marginBottom: 10 }}
            />
            <Typography variant="h5" style={{ color: "black" }}>
              WELCOME TO LIT
            </Typography>
            {error && <Typography color="error">{error}</Typography>}
            <form
              onSubmit={handleLogin}
              style={{
                width: "100%",
                marginTop: 20,
              }}
            >
              <TextField
                fullWidth
                label="Username"
                variant="outlined"
                margin="normal"
                value={empId}
                onChange={(e) => setEmpId(e.target.value)}
              />
              <TextField
                fullWidth
                label="Password"
                type={showPassword ? "text" : "password"}
                variant="outlined"
                margin="normal"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  endAdornment: (
                    <IconButton onClick={() => setShowPassword(!showPassword)}>
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  ),
                }}
              />
              <Button
                fullWidth
                variant="contained"
                type="submit"
                disabled={loading}
                style={{
                  marginTop: 20,
                  backgroundColor: "#CC7A00",
                  color: "white",
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </Button>
            </form>
            <Button
              onClick={() => setOpenDialog(true)}
              style={{ marginTop: 10 }}
            >
              Forgot Password?
            </Button>
            <Box
              display="flex"
              flexDirection="row"
              justifyContent="center"
              alignItems="center"
              mt={3}
            >
              <Link
                to="https://play.google.com/store/apps/details?id=com.nanami.hrsmile"
                target="_blank"
              >
                <img
                  src={playstore}
                  alt="Google Play Store"
                  width={140}
                  style={{ marginRight: 10, cursor: "pointer" }}
                />
              </Link>
              <Link
                to="https://apps.apple.com/in/app/hr-smile/id6738949653"
                target="_blank"
              >
                <img
                  src={appstore}
                  alt="Apple App Store"
                  width={130}
                  style={{ cursor: "pointer" }}
                />
              </Link>
            </Box>
          </Box>
        </Grid>
      </Grid>

      {/* Forgot Password Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Forgot Password</DialogTitle>
        <DialogContent>
          <Typography>
            Enter your email address and we'll send you a new password.
          </Typography>
          {forgotPasswordError && (
            <Typography color="error">{forgotPasswordError}</Typography>
          )}
          {forgotPasswordSuccess && (
            <Typography color="success">{forgotPasswordSuccess}</Typography>
          )}
          <TextField
            fullWidth
            label="Email"
            variant="outlined"
            margin="normal"
            value={forgotEmail}
            onChange={(e) => setForgotEmail(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleForgotPassword}
            color="primary"
            disabled={loading}
          >
            {loading ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
