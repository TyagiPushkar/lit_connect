import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, useMediaQuery } from '@mui/material';
import OtherFeesTransaction from '../components/fees/OtherFeesTransaction';

function OtherFees() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 100;

    return (
        <Box sx={{ display: 'flex', height: '100vh', overflow: 'hidden' }}>
            {/* Sidebar with fixed width */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 0, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
                <Navbar />
                <Box sx={{ flexGrow: 1, p: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    <OtherFeesTransaction/>
                </Box>
            </Box>
        </Box>
    );
}

export default OtherFees;
