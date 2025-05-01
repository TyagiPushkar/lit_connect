import React, { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography,
    Grid,
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
                showConfirmButton: true,
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
                Swal.fire({
                    icon: 'success',
                    title: result.message,
                    showConfirmButton: true,
                });

                setCourse('');
                setSem('');
                setSubject('');
                setFile(null);
            } else {
                Swal.fire({
                    icon: 'error',
                    title: result.message || 'Upload failed',
                    showConfirmButton: true,
                });
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Network or server error.',
                showConfirmButton: true,
            });
        }
    };

    return (
        <Box sx={{ p: 0 }}>
            <Grid container spacing={ 5} alignItems="center">
                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={course}
                            label="Course"
                            onChange={(e) => setCourse(e.target.value)}
                        >
                            <MenuItem value="BCA">BCA</MenuItem>
                            <MenuItem value="MCA">MCA</MenuItem>
                            <MenuItem value="BSc">BSc</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Semester</InputLabel>
                        <Select
                            value={sem}
                            label="Semester"
                            onChange={(e) => setSem(e.target.value)}
                        >
                            <MenuItem value="1">1</MenuItem>
                            <MenuItem value="2">2</MenuItem>
                            <MenuItem value="3">3</MenuItem>
                            <MenuItem value="4">4</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 150 }}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={subject}
                            label="Subject"
                            onChange={(e) => setSubject(e.target.value)}
                        >
                            <MenuItem value="Math">Math</MenuItem>
                            <MenuItem value="English">English</MenuItem>
                            <MenuItem value="Computer">Computer</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownloadSample}
                    >
                        Download Sample
                    </Button>
                </Grid>

                <Grid item>
                    <Button
                        size="small"
                        variant="contained"
                        component="label"
                        startIcon={<CloudUploadIcon />}
                        sx={{ backgroundColor: "#CC7A00", '&:hover': { backgroundColor: "#b36600" } }}
                    >
                        Upload Excel
                        <input
                            type="file"
                            accept=".xlsx, .xls"
                            hidden
                            onChange={handleFileChange}
                        />
                    </Button>
                </Grid>

                <Grid item>
                    <Button
                        size="small"
                        variant="contained"
                        disabled={!file || !course || !sem || !subject}
                        onClick={handleUpload}
                        sx={{ backgroundColor: "#CC7A00", '&:hover': { backgroundColor: "#b36600" } }}
                    >
                        Submit
                    </Button>
                </Grid>

                {file && (
                    <Grid item>
                        <Typography variant="caption" color="text.secondary">
                            {file.name}
                        </Typography>
                    </Grid>
                )}
            </Grid>

            <Box mt={2}>
                <ListInternalExam />
            </Box>
        </Box>
    );
}

export default InternalExam;
