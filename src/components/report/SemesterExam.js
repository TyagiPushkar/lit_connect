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
import ListSemesterExam from './ListSemesterExam';

function SemesterExam() {
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [file, setFile] = useState(null);

    const handleDownloadSample = () => {
        const sampleData = [
            ['StudId', 'CGPA', 'REMARK'],
            ['1001', '40', 'PASS'],
            ['1002', '50.5', 'PASS'],
            ['1003', '30', 'FAIL'],
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
        XLSX.writeFile(workbook, 'SemesterExamSample.xlsx');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!course || !sem || !file) {
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
        formData.append('file', file);

        try {
            const res = await fetch('https://namami-infotech.com/LIT/src/report/add_semester_exam_marks.php', {
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
            <Grid container spacing={5} alignItems="center">
                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Course</InputLabel>
                        <Select
                            value={course}
                            label="Course"
                            onChange={(e) => setCourse(e.target.value)}
                        >
                            <MenuItem value="BSc. DS">BSc. DS</MenuItem>
                            <MenuItem value="BSc. CS(H)">BSc. CS(H)</MenuItem>
                            <MenuItem value="BSc. ITM(H)">BSc. ITM(H)</MenuItem>
                            <MenuItem value="BCA">BCA</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 120 }}>
                        <InputLabel>Semester</InputLabel>
                        <Select
                            value={sem}
                            label="Semester"
                            onChange={(e) => setSem(e.target.value)}
                        >
                            {[1, 2, 3, 4, 5, 6].map((num) => (
                                <MenuItem key={num} value={num}>{num}</MenuItem>
                            ))}
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
                        disabled={!file || !course || !sem}
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
                <ListSemesterExam />
            </Box>
        </Box>
    );
}

export default SemesterExam;