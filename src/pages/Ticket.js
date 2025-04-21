import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, useMediaQuery } from '@mui/material';
import { useAuth } from '../components/auth/AuthContext';
import ViewTickets from '../components/ticket/ViewTickets';



function Ticket() {
    const { user } = useAuth();

    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 11;



    return (
        <Box sx={{ display: 'flex' }}>
            {/* Sidebar with fixed width */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 0, ml: drawerWidth }}>
                <Navbar />
                <div style={{ marginTop: "20px", marginLeft: "10px" }}>
                    {/* Uncomment and update the ViewLeave component as needed */}
                    {user && user.emp_id && <ViewTickets empId={user.emp_id} />}
                </div>
            </Box>
        </Box>
    );
}

export default Ticket;
