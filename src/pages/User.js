import React from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, useMediaQuery, Container, Grid } from '@mui/material';
import EmployeeProfile from '../components/employee/UserProfile';

function EmpProfile() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 100;

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar with fixed width */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>
            <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
                <Navbar />
                <Container maxWidth="lg">
                    <Grid container spacing={3}>
                        <Grid item xs={12}>
                            <Box sx={{ mt: 1 }}>
                                <EmployeeProfile/>
                            </Box>

                        </Grid>
                    </Grid>
                </Container>
            </Box>
        </Box>
    );
}

export default EmpProfile;
