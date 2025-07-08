import React, { useEffect, useState } from 'react';
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Typography, CircularProgress, Button, Box
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import AddNotices from './AddNotices';

function ViewNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const fetchNotices = async () => {
    try {
      const response = await axios.get('http://139.5.190.143/LIT/src/notification/get_notice.php');
      setNotices(response.data.notices || []);
    } catch (err) {
      setError('Failed to fetch notices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleOpenDialog = () => setDialogOpen(true);
  const handleCloseDialog = () => setDialogOpen(false);
  const handleNoticeAdded = () => {
    setLoading(true);
    fetchNotices();
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" mt={4}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box p={0}>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h5" gutterBottom>
        Notices
      </Typography>

      {user?.role === 'HR' && (
        <Button
          variant="contained"
          onClick={handleOpenDialog}
          sx={{ mb: 2, backgroundColor: '#CC7A00', '&:hover': { backgroundColor: '#b86a00' } }}
        >
          Add Notice
        </Button>
      )}
</div>
      <TableContainer component={Paper}>
        <Table>
          <TableHead sx={{ backgroundColor: '#CC7A00' }}>
            <TableRow>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Notice</TableCell>
              <TableCell sx={{ color: 'white', fontWeight: 'bold' }}>Date</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <TableRow key={notice.Id}>
                  <TableCell>{notice.Text}</TableCell>
                  <TableCell>{notice.Date}</TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2}>No notices available.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddNotices
        open={dialogOpen}
        onClose={handleCloseDialog}
        onNoticeAdded={handleNoticeAdded}
      />
    </Box>
  );
}

export default ViewNotices;
