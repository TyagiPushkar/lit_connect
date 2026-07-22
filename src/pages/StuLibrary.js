import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, useMediaQuery } from '@mui/material';
import StudentBooksView from '../components/library/StudentBookView';

function StuLibrary() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 100;

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar with fixed width */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>
            <Box component="main" className="scrollable-y" sx={{ flexGrow: 1, p: 0, height: '100vh', overflowY: 'auto' }}>
                <Navbar />
                <Box sx={{ mt: -1, p: 1 }}>
                  <StudentBooksView/>
                </Box>
            </Box>
        </Box>
    );
}

export default StuLibrary;
