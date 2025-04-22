import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Drawer, List, ListItem, Box, ListItemIcon, Typography } from '@mui/material';
import { HolidayVillage, Policy, Person, BarChart } from '@mui/icons-material';
import { useAuth } from './auth/AuthContext';
import AppsIcon from '@mui/icons-material/Apps';
import AddLocationAltIcon from '@mui/icons-material/AddLocationAlt';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LocalAirportIcon from '@mui/icons-material/LocalAirport';
import HowToRegIcon from '@mui/icons-material/HowToReg';
import MapIcon from '@mui/icons-material/Map';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import LaptopIcon from '@mui/icons-material/Laptop';
import SummarizeIcon from '@mui/icons-material/Summarize';
import AddHomeWorkIcon from '@mui/icons-material/AddHomeWork';
import LibraryBooksIcon from '@mui/icons-material/LibraryBooks';
import HRSmileLogo from "../assets/images (1).png";
// import ChecklistIcon from '@mui/icons-material/Checklist';
// import MenuIcon from '@mui/icons-material/Menu';
function Sidebar() {
    const location = useLocation();
    const { user } = useAuth();
    
    // Module Mapping
    const moduleMapping = {
        21: { path: '/attendance', name: 'Attendance', icon: <BarChart /> },
        3: { path: '/leave', name: 'Leave', icon: <Person /> },
        10: { path: '/policy', name: 'Policy', icon: <Policy /> },
        8: { path: '/holiday', name: 'Holiday', icon: <HolidayVillage /> },
        12: { path: '/library', name: 'Library', icon: <LibraryBooksIcon /> },
        17: { path: '/fee-structure', name: 'Fees', icon: <AppsIcon /> },
        18:  { path: '/teachers', name: 'Teachers', icon: <Person /> },
    };

    // Default routes visible to everyone
    const defaultRoutes = [
        { path: '/admissions', name: 'Admissions', icon: <AddHomeWorkIcon /> },
        // { path: '/notification', name: 'Notification', icon: <Notifications /> }

    ];

    const userModules = user?.modules || [];
    const allowedRoutes = userModules.map(moduleId => moduleMapping[moduleId]).filter(Boolean);

    // HR-specific routes
    if (user?.role === 'HR') {
        allowedRoutes.push(
           
            { path: '/report', name: 'Report', icon: <SummarizeIcon /> },
        //      { path: '/menus', name: 'Menus', icon: <MenuIcon /> },
        // { path: '/checkpoints', name: 'Checkpoints', icon: <ChecklistIcon /> },
        );
    }

    // If module 5 (Visit) exists, also add Maps
    if (userModules.includes(5)) {
        allowedRoutes.push({ path: '/maps', name: 'Maps', icon: <MapIcon /> });
    }

    // Combine all available routes
    const routes = [...defaultRoutes, ...allowedRoutes];

    return (
        <Drawer
            variant="permanent"
            sx={{
                '& .MuiDrawer-paper': {
                    width: 100,
                    bgcolor: '#fff',
                    display: 'flex',
                    alignItems: 'center',
                    boxShadow: 1,
                    borderRight: '1px solid #ddd',
                    overflow: 'hidden',
                    scrollbarWidth: 'none',
                    '&::-webkit-scrollbar': { display: 'none' },
                },
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <img src={HRSmileLogo} alt="HRMS Logo" style={{ width: 50 }} />
            </Box>
            <List sx={{ width: '100%', overflowY: 'auto', scrollbarWidth: 'none', '&::-webkit-scrollbar': { display: 'none' } }}>
                {routes.map((route, index) => (
                    <ListItem
                        button
                        component={Link}
                        to={route.path}
                        selected={location.pathname === route.path}
                        key={index}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: 'black',
                            my: 1,
                            '&:hover': { bgcolor: 'rgba(0, 0, 0, 0.05)' },
                            transition: 'all 0.3s ease',
                        }}
                    >
                        <ListItemIcon sx={{ color: 'black', minWidth: 'auto' }}>
                            {route.icon}
                        </ListItemIcon>
                        <Typography variant="caption" sx={{ mt: 0.5 }}>
                            {route.name}
                        </Typography>
                    </ListItem>
                ))}
            </List>
        </Drawer>
    );
}

export default Sidebar;
