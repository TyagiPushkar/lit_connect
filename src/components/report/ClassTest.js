import React, { useState, useEffect } from 'react';
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
import ListCBTExam from './ListCBTExam';
import ListClassTest from './ListClassTest';

function ClassTest() {
    const [course, setCourse] = useState('');
    const [Category, setCategory] = useState('');
    const [sem, setSem] = useState('');
    const [subject, setSubject] = useState('');
    const [file, setFile] = useState(null);
    const [subjectsList, setSubjectsList] = useState([]);

    useEffect(() => {
        const fetchSubjects = async () => {
            if (!course || !sem) return;

            try {
                const res = await fetch(`http://139.5.190.143/LIT/src/menu/subjects.php?Course=${course}&Sem=${sem}`);
                const result = await res.json();
                if (result.success) {
                    setSubjectsList(result.data || []);
                } else {
                    setSubjectsList([]);
                    Swal.fire({
                        icon: 'info',
                        title: result.message || 'No subjects found.',
                    });
                }
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: 'Failed to fetch subjects.',
                });
            }
        };

        fetchSubjects();
    }, [course, sem]);

    const handleDownloadSample = () => {
        const sampleData = [
            ['StudId', 'MaxMarks', 'ObtainedMarks'],
            ['1001', '100', '85'],
            ['1002', '100', '90']
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
        XLSX.writeFile(workbook, 'ClassTestExamSample.xlsx');
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
        formData.append('Category', Category);
        formData.append('Subject', subject);
        formData.append('file', file);

        try {
            const res = await fetch('http://139.5.190.143/LIT/src/report/add_class_test_marks.php', {
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
                setCategory('');
                setFile(null);
                setSubjectsList([]);
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
                             <MenuItem value="BSC.DS">BSc. DS</MenuItem>
                                                        <MenuItem value="BSC.CS(H)">BSc. CS(H)</MenuItem>
                                                        <MenuItem value="BSC.ITM(H)">BSc. ITM(H)</MenuItem>
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
                    <FormControl size="small" sx={{ minWidth: 200 }}>
                        <InputLabel>Subject</InputLabel>
                        <Select
                            value={subject}
                            label="Subject"
                            onChange={(e) => setSubject(e.target.value)}
                            disabled={subjectsList.length === 0}
                        >
                            {subjectsList.map((subj, index) => (
                                <MenuItem key={index} value={subj.Subject}>
                                    {subj.Subject}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid item>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                            value={Category}
                            label="Category"
                            onChange={(e) => setCategory(e.target.value)}
                        >
                            <MenuItem value="CT 1">CT 1</MenuItem>
                            <MenuItem value="CT 2">CT 2</MenuItem>
                            <MenuItem value="CT 3">CT 3</MenuItem>
                            <MenuItem value="CT 4">CT 4</MenuItem>
                            <MenuItem value="CT 5">CT 5</MenuItem>
                            <MenuItem value="CT 6">CT 6</MenuItem>
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
                <ListClassTest/>
            </Box>
        </Box>
    );
}

export default ClassTest;
