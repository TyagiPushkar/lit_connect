import React, { useState, useEffect } from 'react';
import { useAuth } from '../components/auth/AuthContext';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Avatar, Menu, MenuItem, Box, IconButton, Drawer, List, ListItem, ListItemText } from '@mui/material';
import { Notifications, Menu as MenuIcon } from '@mui/icons-material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import HRSmileLogo from '../assets/HRSmileLogo.jpeg';

function Navbar() {
    const [anchorEl, setAnchorEl] = useState(null);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [greeting, setGreeting] = useState('');
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
                            <Avatar src={user.image} />
                        </IconButton>
                        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose}>
                            <MenuItem onClick={handleProfile}>Profile</MenuItem>
                            <MenuItem onClick={handleLogout}>Logout</MenuItem>
                        </Menu>
                        
                    </Box>
                </Toolbar>
            </AppBar>
            <Drawer variant="temporary" open={mobileOpen} onClose={handleDrawerToggle}>
                {drawer}
            </Drawer>
        </>
    );
}

export default Navbar;
