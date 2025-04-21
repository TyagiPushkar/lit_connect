import React, { useState } from 'react';
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
    CircularProgress
} from '@mui/material';
import { useAuth } from '../auth/AuthContext'; // Assuming you have an AuthContext
import axios from 'axios';
// import DashboardData from '../dashboard/DashboardData';

const UserProfile = () => {
    const { user } = useAuth(); // Get the user data from AuthContext
    const [open, setOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    const handleOpen = () => {
        setOpen(true);
    };

    const handleClose = () => {
        setOpen(false);
        setCurrentPassword('');
        setNewPassword('');
        setError('');
        setSuccess('');
    };

    const handleChangePassword = async () => {
        setLoading(true);
        setError('');
        setSuccess('');
        try {
            const response = await axios.post('https://namami-infotech.com/LIT/src/auth/change_password.php', {
                EmpId: user?.emp_id,
                currentPassword,
                newPassword,
            });
            if (response.data.success) {
                setSuccess(response.data.message);
                setTimeout(handleClose, 2000);
            } else {
                setError(response.data.message);
            }
        } catch (err) {
            setError('Failed to change password. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{ padding: { xs: 2, sm: 3 }, maxWidth: 800, margin: 'auto' }}>
            <Paper elevation={3} sx={{ padding: 3 }}>
                <Grid container spacing={3} alignItems="center">
                    <Grid item xs={12} sm={4} container justifyContent="center">
                        <Avatar
                            sx={{ width: { xs: 80, sm: 120 }, height: { xs: 80, sm: 120 } }}
                            src={user?.image || user?.username}
                            alt={user?.name || 'User Profile Picture'}
                        />
                    </Grid>
                    <Grid item xs={12} sm={8}>
                        <Typography variant="h4" gutterBottom>
                            {user?.username || 'N/A'} Profile
                        </Typography>
                        <Divider sx={{ marginY: 2 }} />
                        <Typography variant="h6">EmpId:  {user?.emp_id || 'N/A'}</Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }} />
                        <Typography variant="h6">Employee Name: {user?.username || 'N/A'}</Typography>
                        <Typography variant="h6">Email:  {user?.email || 'N/A'}</Typography>
                        <Typography variant="body1" sx={{ marginBottom: 1 }} />
                       
                        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                           
                            <Button variant="contained" style={{backgroundColor:"orange"}} onClick={handleOpen}>
                                Change Password
                            </Button>
                        </Box>
                    </Grid>
                </Grid>
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
                    {error && <Typography color="error" sx={{ mt: 2 }}>{error}</Typography>}
                    {success && <Typography color="success.main" sx={{ mt: 2 }}>{success}</Typography>}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="secondary">Cancel</Button>
                    <Button onClick={handleChangePassword} color="primary" disabled={loading}>Change Password</Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};

export default UserProfile;
