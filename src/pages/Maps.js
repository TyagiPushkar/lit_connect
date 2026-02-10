import React, { useState } from 'react';
import { Box, useMediaQuery, Button, Stack } from '@mui/material';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import MapPage from "../components/dealers/MapPage";

function Maps() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const drawerWidth = isMobile ? 0 : 100;

  return (
    <Box sx={{ display: "flex", height: "100vh" }}>
      {/* Sidebar */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Navbar />

        <Box sx={{ mt: 1, p: 1 }}>
          <MapPage />
        </Box>
      </Box>
    </Box>
  );
}

export default Maps;
