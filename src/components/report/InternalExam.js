import React, { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography,
    Paper,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import ListInternalExam from './ListInternalExam';

function InternalExam() {
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [subject, setSubject] = useState('');
    const [file, setFile] = useState(null);

    const handleDownloadSample = () => {
        const sampleData = [
            ['StudId', 'MaxMarks', 'ObtainedMarks'],
            ['1001', '100', '85'],
            ['1002', '100', '90']
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
        XLSX.writeFile(workbook, 'InternalExamSample.xlsx');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!course || !sem || !subject || !file) {
            Swal.fire({
                icon: 'warning',
                title: 'All fields are required!',
                showConfirmButton: true, // Keep the 'OK' button
            });
            return;
        }

        const formData = new FormData();
        formData.append('Course', course);
        formData.append('Sem', sem);
        formData.append('Subject', subject);
        formData.append('file', file);

        try {
            const res = await fetch('https://namami-infotech.com/LIT/src/report/add_internal_exam_marks.php', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            if (result.success) {
                // Show success SweetAlert
                Swal.fire({
                    icon: 'success',
                    title: result.message,
                    showConfirmButton: true, // User has to click OK to dismiss
                });

                // Clear all fields after success
                setCourse('');
                setSem('');
                setSubject('');
                setFile(null);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: result.message || 'Upload failed',
                    showConfirmButton: true, // Keep the 'OK' button
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Network or server error.',
                showConfirmButton: true, // Keep the 'OK' button
            });
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            {/* <Typography variant="h6" mb={2} align="center" color="primary">
                Internal Exam Upload
            </Typography> */}

           
                <Box display="flex" gap={2} mb={2} justifyContent="space-between" alignItems="center">
                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={course}
                            label="Course"
                            onChange={(e) => setCourse(e.target.value)}
                            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
                        >
                            <MenuItem value="BCA">BCA</MenuItem>
                            <MenuItem value="MCA">MCA</MenuItem>
                            <MenuItem value="BSc">BSc</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 150 }}>
                        <InputLabel>Semester</InputLabel>
                        <Select
                            value={sem}
                            label="Semester"
                            onChange={(e) => setSem(e.target.value)}
                            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
                        >
                            <MenuItem value="1">1</MenuItem>
                            <MenuItem value="2">2</MenuItem>
                            <MenuItem value="3">3</MenuItem>
                            <MenuItem value="4">4</MenuItem>
                        </Select>
                    </FormControl>

                    <FormControl sx={{ minWidth: 200 }}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={subject}
                            label="Subject"
                            onChange={(e) => setSubject(e.target.value)}
                            sx={{ backgroundColor: '#f5f5f5', borderRadius: 1 }}
                        >
                            <MenuItem value="Math">Math</MenuItem>
                            <MenuItem value="English">English</MenuItem>
                            <MenuItem value="Computer">Computer</MenuItem>
                        </Select>
                    </FormControl>

                    <Button
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadSample}
                        sx={{ borderRadius: 1 }}
                    >
                        Download Excel
                    </Button>
                </Box>

                <Box display="flex" gap={2} mb={2} justifyContent="space-between" alignItems="center">
                    <Button
                        variant="contained"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        sx={{ borderRadius: 1, backgroundColor:"#CC7A00" }}
                    >
                        Upload Excel File
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>

                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleUpload}
                        disabled={!file || !course || !sem || !subject}
                        sx={{
                            borderRadius: 1,
                            backgroundColor: '#CC7A00',
                            '&:hover': {
                                backgroundColor: '#CC7A00',
                            },
                        }}
                    >
                        Submit 
                    </Button>
                </Box>

                <Box mb={2} display="flex" gap={2} flexWrap="wrap">
                    {file && <Typography variant="body2" mt={1}>{file.name}</Typography>}
                </Box>
            <ListInternalExam/>
        </Box>
    );
}

export default InternalExam;
