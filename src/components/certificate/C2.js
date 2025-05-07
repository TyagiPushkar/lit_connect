import React, { useRef, useState } from 'react';
import {
  Box, TextField, Typography, Button, useMediaQuery
} from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import backgroundImage from "../../assets/C2.png"; // Use your uploaded path
import logo from "../../assets/images (1).png";

function C2() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    appreciation: '',
  });

  const certificateRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const generatePDF = async () => {
    const input = certificateRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);
    pdf.save(`${formData.name || 'certificate'}.pdf`);
  };

  const getTodayDate = () => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 4, justifyContent: 'center' }}>
        <TextField label="Student ID" name="studentId" value={formData.studentId} onChange={handleChange} />
        <TextField label="Student Name" name="name" value={formData.name} onChange={handleChange} />
        <TextField label="Position / Appreciation" name="appreciation" value={formData.appreciation} onChange={handleChange} />
        <Button variant="contained" onClick={generatePDF}>Generate Certificate PDF</Button>
      </Box>

      <Box
        ref={certificateRef}
        sx={{
          width: '100%',
          maxWidth: 1000,
          height: 500,
          mx: 'auto',
          position: 'relative',
          backgroundImage: `url(${backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          p: 5,
          textAlign: 'center',
        }}
      >
        <Box sx={{ position: 'relative', zIndex: 2 }}>
          <img src={logo} alt="College Logo" style={{ width: 80, marginBottom: 8 }} />
          <Typography variant="h4" fontWeight="bold" color="#333">
            Lakshay Institute Of Technology
          </Typography>
          <Typography variant="h6" color="#333">Affiliated To Utkal University</Typography>
          <Typography variant="h5" sx={{ mt: 2, mb: 1 }} fontWeight="bold" color="#222">
            Certificate of Appreciation
          </Typography>
          <Typography variant="body1" sx={{ fontSize: '1.2rem' }}>
            This certificate is proudly presented to
          </Typography>
          <Typography variant="h5" fontWeight="bold" sx={{ mt: 1 }}>
            {formData.name || 'Student Name'}
          </Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            For outstanding performance and achievement in the role of
          </Typography>
          <Typography variant="h6" fontWeight="bold" sx={{ mt: 1 }}>
            {formData.appreciation || 'Position / Achievement'}
          </Typography>
          <Typography sx={{ mt: 4 }}>Student ID: {formData.studentId || 'XXXX'}</Typography>
          <Typography>Date: {getTodayDate()}</Typography>
        </Box>
      </Box>
    </Box>
  );
}

export default C2;
