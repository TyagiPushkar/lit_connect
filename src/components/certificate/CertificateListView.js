import React, { useEffect, useState } from 'react';
import {
  Box, Table, TableHead, TableRow, TableCell, TableBody, Button, Typography, Paper
} from '@mui/material';
import axios from 'axios';

function CertificateListView() {
  const [certificates, setCertificates] = useState([]);

  useEffect(() => {
    axios.get('https://namami-infotech.com/LIT/src/certificate/certificate_list.php')
      .then(response => {
        if (response.data.success) {
          setCertificates(response.data.data);
        }
      })
      .catch(error => {
        console.error("Error fetching certificate list:", error);
      });
  }, []);

  return (
    <Box sx={{ p: 2 }}>
      <Typography variant="h5" gutterBottom>
        Certificate List
      </Typography>
      <Paper elevation={3}>
        <Table>
          <TableHead style={{ backgroundColor: '#CC7A00', color: 'white' }}>
            <TableRow>
              <TableCell style={{ backgroundColor: '#CC7A00', color: 'white' }}><strong>Title</strong></TableCell>
              <TableCell style={{ backgroundColor: '#CC7A00', color: 'white' }}><strong>Issued To</strong></TableCell>
              <TableCell style={{ backgroundColor: '#CC7A00', color: 'white' }}><strong>Date</strong></TableCell>
              <TableCell style={{ backgroundColor: '#CC7A00', color: 'white' }}><strong>View</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {certificates.map((cert) => (
              <TableRow key={cert.CertificateId}>
                <TableCell>{cert.Title}</TableCell>
                <TableCell>{cert.StudentId}</TableCell>
                <TableCell>{new Date(cert.Datetime).toLocaleString()}</TableCell>
                <TableCell>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={() => window.open(cert.Link, '_blank')}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {certificates.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center">
                  No certificates found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
}

export default CertificateListView;
