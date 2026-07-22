import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, useMediaQuery } from '@mui/material';
import LibraryList from '../components/library/LibraryList';

function Library() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 100;

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar with fixed width */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>
            <Box component="main" sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, height: '100vh', minWidth: 0, overflow: 'hidden', p: 0 }}>
                <Navbar />
                <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1, minHeight: 0, overflow: 'hidden', p: 1 }}>
                    <LibraryList/>
                </Box>
            </Box>
        </Box>
    );
}

export default Library;
