import React, { useState, useEffect } from 'react';
import {
    Box, Typography, TextField, CircularProgress, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import axios from 'axios';

function ListAssignmentReport() {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [month, setMonth] = useState('');
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        if (course && sem && month) fetchRecords();
    }, [course, sem, month]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, records]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get('http://139.5.190.143/LIT/src/report/list_assignment.php', {
                params: { Course: course, Semester: sem, Month: month }
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
                item.StudentId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        setFilteredRecords(filtered);
        setPage(0);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Typography variant="h6" color="#CC7A00" gutterBottom>
                                Assignment Report
                            </Typography>
            <Box display="flex" justifyContent="space-between" flexWrap="wrap" alignItems="center" mb={2} gap={2}>
                <FormControl sx={{ minWidth: 150 }} size='small'>
                    <InputLabel>Course</InputLabel>
                    <Select value={course} onChange={(e) => setCourse(e.target.value)} label="Course">
                        <MenuItem value="BSC.DS">BSC.DS</MenuItem>
                        <MenuItem value="BSC.CS(H)">BSC.CS(H)</MenuItem>
                        <MenuItem value="BSC.ITM(H)">BSC.ITM(H)</MenuItem>
                        <MenuItem value="BCA">BCA</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }} size='small'>
                    <InputLabel>Semester</InputLabel>
                    <Select value={sem} onChange={(e) => setSem(e.target.value)} label="Semester">
                        <MenuItem value="1">1</MenuItem>
                        <MenuItem value="2">2</MenuItem>
                        <MenuItem value="3">3</MenuItem>
                        <MenuItem value="4">4</MenuItem>
                        <MenuItem value="5">5</MenuItem>
                        <MenuItem value="6">6</MenuItem>
                    </Select>
                </FormControl>
                <FormControl sx={{ minWidth: 150 }} size='small'>
                    <InputLabel>Month</InputLabel>
                    <Select value={month} onChange={(e) => setMonth(e.target.value)} label="Month">
                        <MenuItem value="January">January</MenuItem>
                        <MenuItem value="February">February</MenuItem>
                        <MenuItem value="March">March</MenuItem>
                        <MenuItem value="April">April</MenuItem>
                        <MenuItem value="May">May</MenuItem>
                        <MenuItem value="June">June</MenuItem>
                        <MenuItem value="July">July</MenuItem>
                        <MenuItem value="August">August</MenuItem>
                        <MenuItem value="September">September</MenuItem>
                        <MenuItem value="October">October</MenuItem>
                        <MenuItem value="November">November</MenuItem>
                        <MenuItem value="December">December</MenuItem>
                    </Select>
                </FormControl>
                <TextField
                    label="Search by Student ID"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size='small'
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
                                    <TableCell sx={{ color: '#fff' }}>Month</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Total Classes</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Present Classes</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.StudentId}</TableCell>
                                        <TableCell>{row.Course}</TableCell>
                                        <TableCell>{row.Semester}</TableCell>
                                        <TableCell>{row.Month}</TableCell>
                                        <TableCell>{row.NoOfClasses}</TableCell>
                                        <TableCell>{row.PresentClass}</TableCell>
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

export default ListAssignmentReport;
