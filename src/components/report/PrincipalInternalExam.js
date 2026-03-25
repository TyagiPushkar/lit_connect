import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Button, CircularProgress, Paper,
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    TablePagination, FormControl, InputLabel, Select, MenuItem, Grid
} from '@mui/material';
import axios from 'axios';
import DownloadIcon from '@mui/icons-material/Download';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

function PrincipalInternalExam() {
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [loading, setLoading] = useState(false);
    const [studentMap, setStudentMap] = useState({});
    const [subjects, setSubjects] = useState([]);
    const [pivoted, setPivoted] = useState([]);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // Fetch student name map once
    useEffect(() => {
        const fetchStudents = async () => {
            try {
                const res = await axios.get('https://namami-infotech.com/LIT/src/students/get_student.php');
                if (res.data.success) {
                    const map = {};
                    res.data.data.forEach(s => {
                        map[String(s.StudentID).toLowerCase()] = s.CandidateName;
                    });
                    setStudentMap(map);
                }
            } catch (err) {
                console.error('Failed to fetch students', err);
            }
        };
        fetchStudents();
    }, []);

    // Fetch subjects, then fetch records per subject and pivot
    useEffect(() => {
        if (!course || !sem) return;
        const fetchAll = async () => {
            setLoading(true);
            setPivoted([]);
            setSubjects([]);
            try {
                // Step 1: get subject list for this course + sem
                const subjRes = await fetch(
                    `https://namami-infotech.com/LIT/src/menu/subjects.php?Course=${course}&Sem=${sem}`
                );
                const subjData = await subjRes.json();
                if (!subjData.success || !subjData.data?.length) {
                    setLoading(false);
                    return;
                }
                const subjectNames = subjData.data.map(s => s.Subject);

                // Step 2: fetch marks for every subject in parallel
                const results = await Promise.all(
                    subjectNames.map(subj =>
                        axios.get('https://namami-infotech.com/LIT/src/report/list_internal_exam.php', {
                            params: { Course: course, Sem: sem, Subject: subj }
                        })
                    )
                );

                // Step 3: flatten all rows
                const allRows = results.flatMap(res =>
                    res.data.success ? res.data.data : []
                );

                if (!allRows.length) {
                    setLoading(false);
                    setPage(0);
                    return;
                }

                // Step 4: pivot by StudId
                const grouped = {};
                allRows.forEach(r => {
                    if (!grouped[r.StudId]) {
                        grouped[r.StudId] = { StudId: r.StudId, Course: r.Course, Sem: r.Sem };
                    }
                    grouped[r.StudId][r.Subject] = r.ObtainedMarks;
                });

                setSubjects(subjectNames);
                setPivoted(Object.values(grouped));
            } catch (err) {
                console.error('Failed to fetch records', err);
            } finally {
                setLoading(false);
                setPage(0);
            }
        };
        fetchAll();
    }, [course, sem]);

    const handleDownload = () => {
        const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4', compress: true });
        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(14);
        doc.setTextColor('#CC7A00');
        doc.text('Internal Exam Report', pageWidth / 2, 40, { align: 'center' });

        doc.setFontSize(9);
        doc.setTextColor('#444444');
        doc.text(`Course: ${course}   |   Semester: ${sem}`, pageWidth / 2, 56, { align: 'center' });

        const head = [['Student ID', 'Name', 'Course', 'Semester', ...subjects]];
        const body = pivoted.map(row => [
            row.StudId,
            studentMap[String(row.StudId).toLowerCase()] || '-',
            row.Course,
            row.Sem,
            ...subjects.map(s => (row[s] !== undefined ? row[s] : '-')),
        ]);

        autoTable(doc, {
            head,
            body,
            startY: 68,
            theme: 'striped',
            styles: { fontSize: 7, cellPadding: 3, overflow: 'linebreak' },
            headStyles: { fillColor: [204, 122, 0], textColor: 255, fontStyle: 'bold' },
            margin: { left: 20, right: 20 },
            tableWidth: 'auto',
        });

        doc.save(`InternalExam_${course}_Sem${sem}.pdf`);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" color="#CC7A00">Internal Exam Report</Typography>
                {pivoted.length > 0 && (
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<DownloadIcon />}
                        onClick={handleDownload}
                        sx={{ color: '#CC7A00', borderColor: '#CC7A00' }}
                    >
                        Download PDF
                    </Button>
                )}
            </Box>

            <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Course</InputLabel>
                        <Select value={course} onChange={(e) => setCourse(e.target.value)} label="Course">
                            <MenuItem value="BSc. DS">BSc. DS</MenuItem>
                            <MenuItem value="BSc. CS(H)">BSc. CS(H)</MenuItem>
                            <MenuItem value="BSc. ITM(H)">BSc. ITM(H)</MenuItem>
                            <MenuItem value="BCA">BCA</MenuItem>
                        </Select>
                    </FormControl>
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                    <FormControl fullWidth size="small">
                        <InputLabel>Semester</InputLabel>
                        <Select value={sem} onChange={(e) => setSem(e.target.value)} label="Semester">
                            {[1, 2, 3, 4, 5, 6].map(num => (
                                <MenuItem key={num} value={num}>{num}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
            </Grid>

            {loading ? (
                <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
                    <CircularProgress sx={{ color: '#CC7A00' }} />
                </Box>
            ) : pivoted.length > 0 ? (
                <Paper elevation={2} sx={{ borderRadius: 2 }}>
                    <TableContainer>
                        <Table size="small">
                            <TableHead sx={{ backgroundColor: '#CC7A00' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff', whiteSpace: 'nowrap' }}>Student ID</TableCell>
                                    <TableCell sx={{ color: '#fff', whiteSpace: 'nowrap' }}>Name</TableCell>
                                    <TableCell sx={{ color: '#fff', whiteSpace: 'nowrap' }}>Course</TableCell>
                                    <TableCell sx={{ color: '#fff', whiteSpace: 'nowrap' }}>Semester</TableCell>
                                    {subjects.map(s => (
                                        <TableCell key={s} sx={{ color: '#fff', whiteSpace: 'nowrap' }}>{s}</TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {pivoted.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell>{row.StudId}</TableCell>
                                        <TableCell>{studentMap[String(row.StudId).toLowerCase()] || '—'}</TableCell>
                                        <TableCell>{row.Course}</TableCell>
                                        <TableCell>{row.Sem}</TableCell>
                                        {subjects.map(s => (
                                            <TableCell key={s}>{row[s] !== undefined ? row[s] : '—'}</TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                    <TablePagination
                        component="div"
                        count={pivoted.length}
                        page={page}
                        onPageChange={(_, newPage) => setPage(newPage)}
                        rowsPerPage={rowsPerPage}
                        onRowsPerPageChange={(e) => {
                            setRowsPerPage(parseInt(e.target.value, 10));
                            setPage(0);
                        }}
                        rowsPerPageOptions={[5, 10, 25, 50]}
                    />
                </Paper>
            ) : (course && sem) ? (
                <Typography color="text.secondary" align="center" sx={{ mt: 4 }}>
                    No records found for the selected filters.
                </Typography>
            ) : null}
        </Box>
    );
}

export default PrincipalInternalExam;
