import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Grid, Button, Tabs, Tab, Paper
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import AddCollegeNews from './AddCollegeNews';
import CollegeNewsCard from './CollegeNewsCard';

function ViewNews() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [tab, setTab] = useState(0);
  const { user } = useAuth();

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://namami-infotech.com/LIT/src/notification/get_college_news.php');
      setNews(response.data.news || []);
    } catch (err) {
      console.error('Failed to load news:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const handleAddSuccess = () => {
    fetchNews();
    setOpenAddDialog(false);
  };

  return (
      <Box p={0}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
      <Typography variant="h5" gutterBottom>College News</Typography>

      {user?.role === 'HR' && (
        <Button
          variant="contained"
          sx={{ mb: 2, backgroundColor: '#CC7A00', '&:hover': { backgroundColor: '#00646d' } }}
          onClick={() => setOpenAddDialog(true)}
        >
          Add News
        </Button>
      )}
</div>
      {loading ? (
        <CircularProgress />
      ) : (
        <Grid container spacing={2}>
          {news.length === 0 ? (
            <Typography>No news available.</Typography>
          ) : (
            news.map((item) => (
              <Grid item xs={12} sm={6} md={4} key={item.Id}>
                <CollegeNewsCard news={item} />
              </Grid>
            ))
          )}
        </Grid>
      )}

      <AddCollegeNews open={openAddDialog} onClose={() => setOpenAddDialog(false)} onSuccess={handleAddSuccess} />
    </Box>
  );
}

export default ViewNews;
