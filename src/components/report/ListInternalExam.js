import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, CircularProgress, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import axios from 'axios';

function ListInternalExam({ setView }) {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [subject, setSubject] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (course && sem && subject) fetchRecords();
    }, [course, sem, subject]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, records]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('https://namami-infotech.com/LIT/src/report/list_internal_exam.php', {
                params: { Course: course, Sem: sem, Subject: subject }
            });
            if (data.success) setRecords(data.data);
            else setRecords([]);
        } catch (err) {
            console.error("Failed to fetch records", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = records;
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(item =>
                item.StudId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredRecords(filtered);
        setPage(0);
    };

    return (
        <Box sx={{ p: 3 }}>
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center" mb={2} gap={2}>
                {/* <Button startIcon={<ArrowBackIcon />} variant="outlined" onClick={() => setView('dashboard')}>
                    Back
                </Button> */}
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Course</InputLabel>
                    <Select value={course} onChange={(e) => setCourse(e.target.value)} label="Course">
                        <MenuItem value="BCA">BCA</MenuItem>
                        <MenuItem value="MCA">MCA</MenuItem>
                        <MenuItem value="BSc">BSc</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Semester</InputLabel>
                    <Select value={sem} onChange={(e) => setSem(e.target.value)} label="Semester">
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                        <MenuItem value="3">3</MenuItem>
                        <MenuItem value="4">4</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Subject</InputLabel>
                    <Select value={subject} onChange={(e) => setSubject(e.target.value)} label="Subject">
                        <MenuItem value="Math">Math</MenuItem>
                        <MenuItem value="English">English</MenuItem>
                        <MenuItem value="Computer">Computer</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    label="Search by Student ID"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ borderRadius: '16px' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#CC7A00' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff' }}>Student ID</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Course</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Semester</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Subject</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Max Marks</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Obtained Marks</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.StudId}</TableCell>
                                        <TableCell>{row.Course}</TableCell>
                                        <TableCell>{row.Sem}</TableCell>
                                        <TableCell>{row.Subject}</TableCell>
                                        <TableCell>{row.MaxMarks}</TableCell>
                                        <TableCell>{row.ObtainedMarks}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={filteredRecords.length}
                        page={page}
                        onPageChange={(e, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </Paper>
            )}
        </Box>
    );
}

export default ListInternalExam;
