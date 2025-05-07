import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import { Box, Button, ButtonGroup, useMediaQuery } from '@mui/material';

import CertificateSelector from '../components/certificate/CertificateSelector';
import CertificateListView from '../components/certificate/CertificateListView';

function Certificate() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const drawerWidth = isMobile ? 0 : 100;

  const [viewMode, setViewMode] = useState('issued'); // 'issued' | 'generate'

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {/* Sidebar with fixed width */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      <Box component="main" sx={{ flexGrow: 1, p: 0 }}>
        <Navbar />
        <Box sx={{ mt: 1, p: 1 }}>
          {/* Centered & Styled Toggle Buttons */}
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              mb: 0,
              borderRadius: 2,
              p: 1,
            }}
          >
            <ButtonGroup variant="contained">
              <Button
                sx={{
                  backgroundColor: viewMode === 'issued' ? '#CC7A00' : 'transparent',
                  color: viewMode === 'issued' ? '#fff' : '#CC7A00',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#fff',
                    color: '#CC7A00',
                  },
                }}
                onClick={() => setViewMode('issued')}
              >
                Issued
              </Button>
              <Button
                sx={{
                  backgroundColor: viewMode === 'generate' ? '#CC7A00' : 'transparent',
                  color: viewMode === 'generate' ? '#fff' : '#CC7A00',
                  fontWeight: 'bold',
                  '&:hover': {
                    backgroundColor: '#fff',
                    color: '#CC7A00',
                  },
                }}
                onClick={() => setViewMode('generate')}
              >
                Generate
              </Button>
            </ButtonGroup>
          </Box>

          {/* Conditional Rendering */}
          {viewMode === 'issued' ? <CertificateListView /> : <CertificateSelector />}
        </Box>
      </Box>
    </Box>
  );
}

export default Certificate;
