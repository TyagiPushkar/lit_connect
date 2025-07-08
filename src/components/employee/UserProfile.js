import React, { useState } from "react";
import {
  Box,
  Typography,
  Paper,
  Avatar,
  Grid,
  Divider,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  CircularProgress,
} from "@mui/material";
import { useAuth } from "../auth/AuthContext"; // Assuming you have an AuthContext
import axios from "axios";
// import DashboardData from '../dashboard/DashboardData';

const UserProfile = () => {
  const { user } = useAuth(); // Get the user data from AuthContext
  const [open, setOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setCurrentPassword("");
    setNewPassword("");
    setError("");
    setSuccess("");
  };

  const handleChangePassword = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const response = await axios.post(
        "http://139.5.190.143/LIT/src/auth/change_password.php",
        {
          EmpId: user?.emp_id,
          currentPassword,
          newPassword,
        },
      );
      if (response.data.success) {
        setSuccess(response.data.message);
        setTimeout(handleClose, 2000);
      } else {
        setError(response.data.message);
      }
    } catch (err) {
      setError("Failed to change password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        maxWidth: 900,
        margin: "auto",
        mt: 4,
        p: 3,
        background: "linear-gradient(135deg, #f3f4f6, #fff)",
        borderRadius: 4,
        boxShadow: 6,
      }}
    >
      <Paper
        elevation={0}
        sx={{
          p: 4,
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: "center",
          gap: 4,
          background: "#fff",
          borderRadius: 4,
          boxShadow: 3,
        }}
      >
        {/* Avatar */}
        <Box sx={{ position: "relative" }}>
          <Avatar
            sx={{
              width: 120,
              height: 120,
              border: "4px solid white",
              boxShadow: 4,
            }}
            src={user?.image}
            alt={user?.name || "User"}
          />
        </Box>

        {/* User Info */}
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight={600} gutterBottom>
            {user?.username || "N/A"}
          </Typography>
          <Divider sx={{ mb: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Employee ID
              </Typography>
              <Typography variant="body1">{user?.emp_id || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="subtitle2" color="text.secondary">
                Email
              </Typography>
              <Typography variant="body1">{user?.email || "N/A"}</Typography>
            </Grid>
          </Grid>

          <Box mt={3}>
            <Button
              variant="contained"
              size="large"
              onClick={handleOpen}
              sx={{
                background: "linear-gradient(to right, #ff9800, #f57c00)",
                borderRadius: 3,
                px: 4,
                boxShadow: 2,
              }}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Paper>

      {/* <DashboardData/> */}
      {/* Change Password Dialog */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Current Password"
            type="password"
            fullWidth
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
          />
          <TextField
            margin="dense"
            label="New Password"
            type="password"
            fullWidth
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
          />
          {loading && <CircularProgress size={24} sx={{ mt: 2 }} />}
          {error && (
            <Typography color="error" sx={{ mt: 2 }}>
              {error}
            </Typography>
          )}
          {success && (
            <Typography color="success.main" sx={{ mt: 2 }}>
              {success}
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="secondary">
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            color="primary"
            disabled={loading}
          >
            Change Password
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserProfile;
