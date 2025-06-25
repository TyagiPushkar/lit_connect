import React from 'react';
import {
  Card, CardMedia, CardContent, Typography, CardActions, Button
} from '@mui/material';

function CollegeNewsCard({ news }) {
  return (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {news.Image && (
        <CardMedia
          component="img"
          height="140"
          image={news.Image}
          alt={news.Title}
        />
      )}
      <CardContent>
        <Typography variant="h6" gutterBottom>{news.Title}</Typography>
        <Typography variant="body2" color="text.secondary">{news.Detail}</Typography>
        <Typography variant="caption" display="block" mt={1}>{news.Date}</Typography>
      </CardContent>
      {news.Link && (
        <CardActions>
          <Button size="small" href={news.Link} target="_blank" sx={{ ml: 1 }}>View More</Button>
        </CardActions>
      )}
    </Card>
  );
}

export default CollegeNewsCard;
