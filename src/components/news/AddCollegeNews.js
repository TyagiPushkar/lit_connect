import React, { useState } from 'react';
import {
  Dialog, DialogTitle, DialogContent, DialogActions, TextField,
  Button, Snackbar, Alert,Typography
} from '@mui/material';
import axios from 'axios';

function AddCollegeNews({ open, onClose, onSuccess }) {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [link, setLink] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [image, setImage] = useState(null);
  const [snackbar, setSnackbar] = useState(false);

  const handleFileChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleSubmit = async () => {
    const formData = new FormData();
    formData.append('Title', title);
    formData.append('Detail', detail);
    formData.append('Link', link);
    formData.append('Date', date);
    if (image) formData.append('Image', image);

    try {
      const response = await axios.post(
        'http://139.5.190.143/LIT/src/notification/add_college_news.php',
        formData
      );

      if (response.data.success) {
        setSnackbar(true);
        setTitle('');
        setDetail('');
        setLink('');
        setDate(new Date().toISOString().split('T')[0]);
        setImage(null);
        onSuccess();
      } else {
        console.error(response.data.message);
      }
    } catch (err) {
      console.error('Upload failed:', err);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
        <DialogTitle>Add College News</DialogTitle>
        <DialogContent>
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Detail"
            value={detail}
            onChange={(e) => setDetail(e.target.value)}
            fullWidth
            multiline
            rows={3}
            margin="dense"
          />
          <TextField
            label="Link"
            value={link}
            onChange={(e) => setLink(e.target.value)}
            fullWidth
            margin="dense"
          />
          <TextField
            label="Date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            fullWidth
            margin="dense"
          />
          <Button variant="outlined" component="label" sx={{ mt: 1 }}>
            Upload Image
            <input type="file" hidden onChange={handleFileChange} />
          </Button>
          {image && <Typography variant="body2" mt={1}>{image.name}</Typography>}
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" sx={{ backgroundColor: '#007B83' }}>
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar}
        autoHideDuration={3000}
        onClose={() => setSnackbar(false)}
      >
        <Alert severity="success" onClose={() => setSnackbar(false)}>News added successfully!</Alert>
      </Snackbar>
    </>
  );
}

export default AddCollegeNews;
