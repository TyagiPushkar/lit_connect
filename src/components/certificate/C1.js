import React, { useEffect, useRef, useState } from 'react';
import {
  Box, TextField, Typography, Button, useMediaQuery, Autocomplete
} from '@mui/material';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import axios from 'axios';
import logo from "../../assets/images (1).png";
import awardIcon from "../../assets/award.png";

function C1() {
  const isMobile = useMediaQuery('(max-width:600px)');
  const [formData, setFormData] = useState({
    studentId: '',
    name: '',
    appreciation: '',
    title: 'Certificate of Appreciation',
  });

  const [studentOptions, setStudentOptions] = useState([]);
  const certificateRef = useRef(null);
const [loading, setLoading] = useState(false);

  useEffect(() => {
    axios.get('https://namami-infotech.com/LIT/src/students/get_student.php')
      .then(response => {
        if (response.data.success) {
          const options = response.data.data.map(student => ({
            label: `${student.StudentID} - ${student.CandidateName}`,
            studentId: student.StudentID,
            name: student.CandidateName,
          }));
          setStudentOptions(options);
        }
      })
      .catch(error => {
        console.error('Error fetching student data:', error);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleStudentSelect = (_, selectedOption) => {
    if (selectedOption) {
      setFormData(prev => ({
        ...prev,
        studentId: selectedOption.studentId,
        name: selectedOption.name,
      }));
    }
  };

  const user = JSON.parse(localStorage.getItem("user") || "{}"); // assumes emp_id is in user object

const generatePDF = async () => {
  if (!formData.studentId || !formData.name || !formData.appreciation || !formData.title) {
    alert("Please fill all fields before generating the certificate.");
    return;
  }

  setLoading(true); // Start loader

  try {
    const input = certificateRef.current;
    const canvas = await html2canvas(input);
    const imgData = canvas.toDataURL('image/png');
    const pdf = new jsPDF('landscape', 'pt', 'a4');
    const width = pdf.internal.pageSize.getWidth();
    const height = pdf.internal.pageSize.getHeight();
    pdf.addImage(imgData, 'PNG', 0, 0, width, height);

    const pdfBlob = pdf.output('blob');

    const formDataToUpload = new FormData();
    formDataToUpload.append("StudentId", formData.studentId);
    formDataToUpload.append("Title", formData.title);
    formDataToUpload.append("IssuedBy", user.emp_id || '');
    formDataToUpload.append("certificate", pdfBlob, `${formData.name || 'certificate'}.pdf`);

    const response = await axios.post(
      "https://namami-infotech.com/LIT/src/certificate/upload_certificate.php",
      formDataToUpload,
      { headers: { "Content-Type": "multipart/form-data" } }
    );

    if (response.data.success) {
      alert("Certificate uploaded successfully!");
      setFormData({
        studentId: '',
        name: '',
        appreciation: '',
        title: 'Certificate of Appreciation',
      });
    } else {
      alert("Failed to upload certificate.");
    }
  } catch (err) {
    console.error("Upload error:", err);
    alert("Error uploading certificate.");
  }

  setLoading(false); // Stop loader
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
        <Autocomplete
          options={studentOptions}
          sx={{ minWidth: 250 }}
          onChange={handleStudentSelect}
          renderInput={(params) => <TextField {...params} label="Select Student" />}
        />
        <TextField
          label="Certificate Title"
          name="title"
          value={formData.title}
          onChange={handleChange}
        />
        <TextField
          label="Position / Appreciation"
          name="appreciation"
          value={formData.appreciation}
          onChange={handleChange}
        />
        <Button
  variant="contained"
  onClick={generatePDF}
                  disabled={loading}
                  style={{backgroundColor: '#8a4f7d',color:"#fff"}}
>
  {loading ? 'Uploading...' : 'Generate Certificate PDF'}
</Button>

      </Box>

      <Box
        ref={certificateRef}
        sx={{
          width: '100%',
          maxWidth: 1000,
          mx: 'auto',
          p: 5,
          background: '#fffdf6',
          border: '8px double #8a4f7d',
         
          textAlign: 'center',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <img src={logo} alt="College Logo" style={{ width: 80, marginBottom: 8 }} />
        <Typography variant="h4" fontWeight="bold" sx={{ color: '#8a4f7d' }}>
          Lakshay Institute Of Technology
        </Typography>
        <Typography variant="h6" sx={{ mb: 2, color: '#444' }}>
          Affiliated To Utkal University
        </Typography>

        <img src={awardIcon} alt="Award" style={{ width: 60, marginTop: 10 }} />
        <Typography variant="h5" sx={{ mt: 1, mb: 2, fontWeight: 'bold', color: '#333' }}>
          {formData.title || 'Certificate Title'}
        </Typography>

        <Typography variant="body1" sx={{ fontSize: '1.2rem', color: '#555' }}>
          This certificate is proudly presented to
        </Typography>
        <Typography variant="h5" sx={{ mt: 1, fontWeight: 'bold', color: '#222' }}>
          {formData.name || 'Student Name'}
        </Typography>

        <Typography variant="body1" sx={{ mt: 2, fontSize: '1.1rem', color: '#555' }}>
          For outstanding performance and achievement in the role of
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, fontWeight: 'bold', color: '#222' }}>
          {formData.appreciation || 'Position / Achievement'}
        </Typography>

        <Typography variant="body2" sx={{ mt: 4, color: '#666' }}>
          Student ID: {formData.studentId || 'XXXX'}
        </Typography>
        <Typography variant="body2" sx={{ mt: 1, color: '#666' }}>
          Date: {getTodayDate()}
        </Typography>
      </Box>
    </Box>
  );
}

export default C1;
