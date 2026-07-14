import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { 
    AppBar, 
    Toolbar, 
    Typography, 
    Avatar, 
    Box, 
    IconButton, 
    Drawer, 
    List, 
    ListItem, 
    ListItemText,
    Popover,
    Divider,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    TextField,
    Button,
    CircularProgress
} from '@mui/material';
import { 
    Notifications, 
    Menu as MenuIcon,
    LockOutlined,
    LogoutOutlined
} from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import HRSmileLogo from '../assets/HRSmileLogo.jpeg';
import axios from 'axios';

function Navbar() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [greeting, setGreeting] = useState('');
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Change Password Dialog states
    const [changePasswordOpen, setChangePasswordOpen] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [changePasswordLoading, setChangePasswordLoading] = useState(false);
    const [changePasswordError, setChangePasswordError] = useState("");
    const [changePasswordSuccess, setChangePasswordSuccess] = useState("");

    const handleChangePasswordClose = () => {
        setChangePasswordOpen(false);
        setCurrentPassword("");
        setNewPassword("");
        setChangePasswordError("");
        setChangePasswordSuccess("");
    };

    const handleChangePasswordSubmit = async () => {
        setChangePasswordLoading(true);
        setChangePasswordError("");
        setChangePasswordSuccess("");
        try {
            const response = await axios.post(
                "https://namami-infotech.com/LIT/src/auth/change_password.php",
                {
                    EmpId: user?.emp_id,
                    currentPassword,
                    newPassword,
                },
            );
            if (response.data.success) {
                setChangePasswordSuccess(response.data.message);
                setTimeout(handleChangePasswordClose, 2000);
            } else {
                setChangePasswordError(response.data.message);
            }
        } catch (err) {
            setChangePasswordError("Failed to change password. Please try again.");
        } finally {
            setChangePasswordLoading(false);
        }
    };

    useEffect(() => {
        const hour = new Date().getHours();
        if (hour < 12) {
            setGreeting('Good Morning');
        } else if (hour < 18) {
            setGreeting('Good Afternoon');
        } else {
            setGreeting('Good Evening');
        }
    }, []);

    const handleMenu = (event) => setAnchorEl(event.currentTarget);
    const handleClose = () => setAnchorEl(null);
    const handleProfile = () => { setAnchorEl(null); navigate("/profile"); };
    const handleLogout = () => { logout(); navigate('/'); };
    const handleDrawerToggle = () => setMobileOpen(!mobileOpen);

    const drawer = (
        <Box sx={{ width: 240, bgcolor: '#f5f5f5', height: '100vh', p: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                <img src={HRSmileLogo} alt="HRMS Logo" style={{ width: '140px' }} />
            </Box>
            <List>
                <ListItem button component={Link} to="/dashboard" selected={location.pathname === "/dashboard"}>
                    <ListItemText primary="Dashboard" />
                </ListItem>
                <ListItem button component={Link} to="/notification" selected={location.pathname === "/notification"}>
                    <ListItemText primary="Notification" />
                </ListItem>
            </List>
        </Box>
    );

    return (
        <>
            <AppBar position="sticky" sx={{ bgcolor: '#fff',boxShadow: 1}}>
                <Toolbar sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {isMobile && (
                            <IconButton onClick={handleDrawerToggle}>
                                <MenuIcon sx={{ color: 'black' }} />
                            </IconButton>
                        )}
                        <Typography variant="h6" sx={{ color: 'black', marginLeft: '5px' }}>
                            {greeting} {user ? user.username : 'Guest'}!
                        </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton onClick={() => navigate("/notification")}>
                            <Notifications sx={{ color: 'black' }} />
                        </IconButton>
                        <IconButton onClick={handleMenu}>
                            <Avatar src={user?.image} />
                        </IconButton>
                        
                        <Popover
                            anchorEl={anchorEl}
                            open={Boolean(anchorEl)}
                            onClose={handleClose}
                            anchorOrigin={{
                                vertical: 'bottom',
                                horizontal: 'right',
                            }}
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            PaperProps={{
                                sx: {
                                    width: 280,
                                    borderRadius: '16px',
                                    boxShadow: '0px 10px 30px rgba(0, 0, 0, 0.08)',
                                    p: 2,
                                    mt: 1.5,
                                    border: '1px solid rgba(0,0,0,0.05)',
                                    bgcolor: '#ffffff',
                                }
                            }}
                        >
                            {/* Profile Info Header */}
                            <Box sx={{
                                bgcolor: '#F8F9FA',
                                borderRadius: '12px',
                                p: 2,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                mb: 1.5,
                                border: '1px solid rgba(0,0,0,0.02)'
                            }}>
                                <Avatar 
                                    src={user?.image} 
                                    alt={user?.username || 'User'}
                                    sx={{ 
                                        width: 56, 
                                        height: 56, 
                                        mb: 1,
                                        boxShadow: '0px 4px 10px rgba(0,0,0,0.06)',
                                        border: '2px solid #ffffff'
                                    }} 
                                />
                                <Typography sx={{ fontWeight: 700, fontSize: '0.95rem', color: '#111111', lineHeight: 1.2, textAlign: 'center' }}>
                                    {user?.username || 'Guest'}
                                </Typography>
                                <Typography sx={{ color: '#757575', fontSize: '0.75rem', fontWeight: 500, wordBreak: 'break-all', textAlign: 'center', mt: 0.5 }}>
                                    {user?.email || 'N/A'}
                                </Typography>
                            </Box>

                            {/* Detailed Info Section */}
                            <Box sx={{
                                border: '1px solid rgba(0,0,0,0.06)',
                                borderRadius: '12px',
                                p: 1.5,
                                my: 1.5,
                                bgcolor: '#FAFAFA',
                                display: 'flex',
                                flexDirection: 'column',
                                gap: 0.8
                            }}>
                                <Typography variant="caption" sx={{ fontWeight: 700, color: '#9E9E9E', textTransform: 'uppercase', fontSize: '0.62rem', mb: 0.5, letterSpacing: '0.5px' }}>
                                    Employee Details
                                </Typography>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                    <Typography sx={{ color: '#757575', fontWeight: 500 }}>ID:</Typography>
                                    <Typography sx={{ color: '#212121', fontWeight: 600 }}>{user?.emp_id || 'N/A'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', fontSize: '0.72rem', gap: 1 }}>
                                    <Typography sx={{ color: '#757575', fontWeight: 500, whiteSpace: 'nowrap' }}>Role & Designation:</Typography>
                                    <Typography sx={{ color: '#212121', fontWeight: 600, wordBreak: 'break-all', textAlign: 'right' }}>
                                        {user?.designation || user?.role || 'Employee'}
                                    </Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                    <Typography sx={{ color: '#757575', fontWeight: 500 }}>Shift:</Typography>
                                    <Typography sx={{ color: '#212121', fontWeight: 600 }}>{user?.shift || 'N/A'}</Typography>
                                </Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                                    <Typography sx={{ color: '#757575', fontWeight: 500 }}>Contact:</Typography>
                                    <Typography sx={{ color: '#212121', fontWeight: 600 }}>{user?.enquiry || 'N/A'}</Typography>
                                </Box>
                            </Box>

                            {/* Menu Items */}
                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                                <Box
                                    onClick={() => {
                                        handleClose();
                                        setChangePasswordOpen(true);
                                    }}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        p: '10px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        color: '#444444',
                                        '&:hover': {
                                            bgcolor: '#FFF5F2',
                                            color: '#f57c00',
                                            '& .MuiSvgIcon-root': {
                                                color: '#f57c00'
                                            }
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#757575', transition: 'color 0.2s' }}>
                                        <LockOutlined sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 550, fontSize: '0.85rem' }}>
                                      Forget Password
                                    </Typography>
                                </Box>

                                <Box
                                    onClick={handleLogout}
                                    sx={{
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 1.5,
                                        p: '10px 16px',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        bgcolor: '#FFEBEE',
                                        color: '#fa0404',
                                        '&:hover': {
                                            bgcolor: '#FFCDD2',
                                        }
                                    }}
                                >
                                    <Box sx={{ display: 'flex', alignItems: 'center', color: '#fa0404' }}>
                                        <LogoutOutlined sx={{ fontSize: 20 }} />
                                    </Box>
                                    <Typography sx={{ fontWeight: 550, fontSize: '0.85rem', color: '#fa0404' }}>
                                      Log Out
                                    </Typography>
                                </Box>
                            </Box>

                            {/* Footer links */}
                            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1, mt: 2, pt: 1, borderTop: '1px dashed rgba(0,0,0,0.05)' }}>
                                <Typography variant="caption" sx={{ color: '#9E9E9E', cursor: 'pointer', fontSize: '0.68rem', '&:hover': { color: '#757575' } }}>
                                    Privacy Policy
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9E9E9E', fontSize: '0.68rem' }}>
                                    •
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#9E9E9E', cursor: 'pointer', fontSize: '0.68rem', '&:hover': { color: '#757575' } }}>
                                    Terms of Service
                                </Typography>
                            </Box>
                        </Popover>
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}>
                {drawer}
            </Drawer>

            {/* Change Password Dialog */}
            <Dialog open={changePasswordOpen} onClose={handleChangePasswordClose}>
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
                    {changePasswordLoading && <CircularProgress size={24} sx={{ mt: 2 }} />}
                    {changePasswordError && (
                        <Typography color="error" sx={{ mt: 2 }}>
                            {changePasswordError}
                        </Typography>
                    )}
                    {changePasswordSuccess && (
                        <Typography color="success.main" sx={{ mt: 2 }}>
                            {changePasswordSuccess}
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleChangePasswordClose} color="secondary">
                        Cancel
                    </Button>
                    <Button
                        onClick={handleChangePasswordSubmit}
                        color="primary"
                        disabled={changePasswordLoading}
                    >
                        Change Password
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default Navbar;
