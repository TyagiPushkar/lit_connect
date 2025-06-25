import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Button, MenuItem, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';

function AddNotices({ open, onClose, onNoticeAdded }) {
  const [text, setText] = useState('');
  const [status, setStatus] = useState('Active');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  const resetForm = () => {
    setText('');
    setStatus('Active');
    setDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = async () => {
    try {
      const payload = { Text: text, Status: status, Date: date };
      const response = await axios.post(
        'https://namami-infotech.com/LIT/src/notification/add_notice.php',
        payload,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.data.success) {
        setSnackbarOpen(true);
        resetForm();
        onNoticeAdded();  // Refresh table
        onClose();        // Close dialog
      } else {
        console.error('Failed to add notice:', response.data.message);
      }
    } catch (err) {
      console.error('Error while adding notice:', err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Add New Notice</DialogTitle>
        <DialogContent>
          <TextField
            label="Notice Text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            rows={4}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Status"
            select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            fullWidth
            margin="normal"
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Inactive">Inactive</MenuItem>
          </TextField>
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="normal"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="secondary">Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#CC7A00' }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for success */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity="success" sx={{ width: '100%' }}>
          Notice added successfully!
        </Alert>
      </Snackbar>
    </>
  );
}

export default AddNotices;
