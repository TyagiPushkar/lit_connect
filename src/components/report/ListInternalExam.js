import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, TextField, CircularProgress, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import axios from 'axios';
import EditIcon from '@mui/icons-material/Edit';
import IconButton from '@mui/material/IconButton';

function ListInternalExam({ setView }) {
    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [subject, setSubject] = useState('');
    const [subjectsList, setSubjectsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [editId, setEditId] = useState(null);
    const [editValue, setEditValue] = useState('');
    
    // Fetch subjects based on Course & Sem
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!course || !sem) return;
            try {
                const res = await fetch(`https://namami-infotech.com/LIT/src/menu/subjects.php?Course=${course}&Sem=${sem}`);
                const result = await res.json();
                if (result.success) {
                    setSubjectsList(result.data || []);
                } else {
                    setSubjectsList([]);
                }
            } catch (err) {
                console.error("Failed to fetch subjects", err);
                setSubjectsList([]);
            }
        };
        fetchSubjects();
    }, [course, sem]);

    // Fetch exam records
    useEffect(() => {
        if (course && sem && subject) fetchRecords();
    }, [course, sem, subject]);

    // Search filter
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

    const handleSaveMarks = async (id) => {
        try {
            const response = await axios.post('https://namami-infotech.com/LIT/src/report/edit_internal.php', {
                Id: id,
                ObtainedMarks: editValue
            });
    
            if (response.data.success) {
                const updated = records.map(record =>
                    record.Id === id ? { ...record, ObtainedMarks: editValue } : record
                );
                setRecords(updated);
                setEditId(null);
            } else {
                alert(response.data.message || 'Failed to update marks.');
            }
        } catch (error) {
            console.error("Error updating marks:", error);
            alert('Error updating marks.');
        }
    };
    
    return (
        <Box sx={{ p: 0 }}>
            <Box elevation={1} sx={{ p: 0, borderRadius: 2, mb: 1 }}>
                <Typography variant="h6" color="#CC7A00" gutterBottom>
                    Internal Exam Report
                </Typography>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Course</InputLabel>
                            <Select value={course} onChange={(e) => setCourse(e.target.value)} label="Course">
                                <MenuItem value="BCA">BCA</MenuItem>
                                <MenuItem value="BSC.DS">BSC.DS</MenuItem>
                                <MenuItem value="BSC.CS(H)">BSC.CS(H)</MenuItem>
                                <MenuItem value="BSC.ITM(H)">BSC.ITM(H)</MenuItem>
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Semester</InputLabel>
                            <Select value={sem} onChange={(e) => setSem(e.target.value)} label="Semester">
                                {[1, 2, 3, 4, 5, 6].map((num) => (
                                    <MenuItem key={num} value={num}>{num}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                label="Subject"
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
                    <Grid item xs={12} sm={6} md={3}>
                        <TextField
                            label="Search by Student ID"
                            variant="outlined"
                            fullWidth
                            size="small"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Grid>
                </Grid>
            </Box>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress />
                </Box>
            ) : (
                <Paper elevation={2} sx={{ borderRadius: 2, p: 0 }}>
                    <TableContainer>
                        <Table>
                        <TableHead sx={{ backgroundColor: '#CC7A00' }}>
    <TableRow>
        <TableCell sx={{ color: '#fff' }}>Actions</TableCell>
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
            <TableCell>
                <IconButton onClick={() => {
                    setEditId(row.Id);
                    setEditValue(row.ObtainedMarks);
                }}>
                    <EditIcon />
                </IconButton>
            </TableCell>
            <TableCell>{row.StudId}</TableCell>
            <TableCell>{row.Course}</TableCell>
            <TableCell>{row.Sem}</TableCell>
            <TableCell>{row.Subject}</TableCell>
            <TableCell>{row.MaxMarks}</TableCell>
            <TableCell>
                {editId === row.Id ? (
                    <TextField
                        value={editValue}
                        size="small"
                        type="number"
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => handleSaveMarks(row.Id)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveMarks(row.Id);
                        }}
                    />
                ) : (
                    row.ObtainedMarks
                )}
            </TableCell>
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
