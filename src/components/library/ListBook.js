import React, { useEffect, useState } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, TablePagination, Typography, CircularProgress,
    TextField, FormControl, InputLabel, Select, MenuItem, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert,
    Tooltip, Chip
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import axios from 'axios';
import * as XLSX from 'xlsx';

function ListBook({ setView, defaultStatusFilter = '' }) {
    const [books, setBooks] = useState([]);
    const [students, setStudents] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);
    const [courseFilter, setCourseFilter] = useState('');
    const [courses, setCourses] = useState([]);

    const [openDialog, setOpenDialog] = useState(false);
    const [newBook, setNewBook] = useState({
        BookId: '',
        Title: '',
        Author: '',
        Publisher: '',
        BookCode: '',
        Price: '',
        Status: 'Available'
    });
    const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

    useEffect(() => {
        fetchBooks();
        fetchStudents();
    }, []);

    useEffect(() => {
        if (students.length > 0) {
            // Extract unique courses from students
            const uniqueCourses = [...new Set(students.map(student => student.Course).filter(Boolean))].sort();
            setCourses(uniqueCourses);
        }
    }, [students]);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, courseFilter, books, students]);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('https://namami-infotech.com/LIT/src/library/list_book.php');
            if (response.data.success) {
                setBooks(response.data.data);
                if (defaultStatusFilter) {
                    setStatusFilter(defaultStatusFilter);
                }
            }
        } catch (error) {
            console.error('Error fetching books:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchStudents = async () => {
        try {
            const response = await axios.get('https://namami-infotech.com/LIT/src/students/get_student.php');
            if (response.data.success) {
                setStudents(response.data.data);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
        }
    };

    const getStudentDetails = (studentId) => {
        const student = students.find(s => s.StudentID === studentId);
        return {
            course: student?.Course || 'N/A',
            name: student?.CandidateName || 'Unknown'
        };
    };

    const applyFilters = () => {
        let filtered = books;
        
        // Apply text search filter
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(book =>
                book.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.Author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.Publisher.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.BookId.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        
        // Apply status filter
        if (statusFilter !== '') {
            filtered = filtered.filter(book => book.Status === statusFilter);
        }
        
        // Apply course filter
        if (courseFilter !== '' && students.length > 0) {
            filtered = filtered.filter(book => {
                if (book.Status === 'Issued' && book.StudentId) {
                    const studentDetails = getStudentDetails(book.StudentId);
                    return studentDetails.course === courseFilter;
                }
                return courseFilter === 'Available'; // Include available books if course filter is "Available"
            });
        }
        
        setFilteredBooks(filtered);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleDialogChange = (e) => {
        setNewBook(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleAddBook = async () => {
        try {
            const res = await axios.post(
                'https://namami-infotech.com/LIT/src/library/add_book.php',
                newBook
            );
            if (res.data.success) {
                setSnackbar({ open: true, message: 'Book added successfully', severity: 'success' });
                setOpenDialog(false);
                fetchBooks();
                setNewBook({ BookId: '', Title: '', Author: '', Publisher: '', BookCode: '', Price: '', Status: 'Available' });
            } else {
                setSnackbar({ open: true, message: res.data.message || 'Failed to add book', severity: 'error' });
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'API error while adding book', severity: 'error' });
        }
    };

    const exportToExcel = () => {
        if (filteredBooks.length === 0) {
            setSnackbar({ open: true, message: 'No data to export', severity: 'warning' });
            return;
        }

        try {
            // Prepare data for export with Course information
            const exportData = filteredBooks.map(book => {
                let course = '';
                if (book.Status === 'Issued' && book.StudentId) {
                    const studentDetails = getStudentDetails(book.StudentId);
                    course = studentDetails.course;
                }
                
                return {
                    'Book ID': book.BookId,
                    'Title': book.Title,
                    'Author': book.Author,
                    'Publisher': book.Publisher,
                    'Book Code': book.BookCode || '',
                    'Price': book.Price || '',
                    'Status': book.Status,
                    'Course': course,
                    'Student ID': book.StudentId || '',
                    'Student Name': book.StudentName || ''
                };
            });

            const ws = XLSX.utils.json_to_sheet(exportData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Books');
            
            const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
            const fileName = `Books_List_${timestamp}.xlsx`;
            
            XLSX.writeFile(wb, fileName);
            
            setSnackbar({ open: true, message: 'Data exported successfully', severity: 'success' });
        } catch (error) {
            console.error('Error exporting data:', error);
            setSnackbar({ open: true, message: 'Failed to export data', severity: 'error' });
        }
    };

    return (
        <Box sx={{ padding: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2, flexWrap: 'wrap', gap: 2 }}>
                <Button
                    startIcon={<ArrowBackIcon />}
                    variant="outlined"
                    onClick={() => setView('dashboard')}
                >
                    Back
                </Button>
                <Typography variant="h4" sx={{ flexGrow: 1 }}>Library Book List</Typography>
                
                <TextField
                    label="Search"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    size="small"
                />
                
                <FormControl variant="outlined" sx={{ minWidth: 150 }} size="small">
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                    >
                        <MenuItem value="">All Status</MenuItem>
                        <MenuItem value="Available">Available</MenuItem>
                        <MenuItem value="Issued">Issued</MenuItem>
                    </Select>
                </FormControl>
                
                <FormControl variant="outlined" sx={{ minWidth: 150 }} size="small">
                    <InputLabel>Course</InputLabel>
                    <Select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        label="Course"
                    >
                        <MenuItem value="">All Courses</MenuItem>
                        <MenuItem value="Available">Available Books</MenuItem>
                        {courses.map((course, index) => (
                            <MenuItem key={index} value={course}>{course}</MenuItem>
                        ))}
                    </Select>
                </FormControl>
                
                <Tooltip title="Export to Excel">
                    <Button
                        variant="contained"
                        startIcon={<DownloadIcon />}
                        onClick={exportToExcel}
                        sx={{ backgroundColor: "#2E7D32", '&:hover': { backgroundColor: "#1B5E20" } }}
                        size="small"
                    >
                        Export
                    </Button>
                </Tooltip>

                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{backgroundColor:"#CC7A00"}}
                    size="small"
                >
                    Add Book
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <>
                    <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {filteredBooks.length} books
                            {statusFilter && ` • Status: ${statusFilter}`}
                            {courseFilter && ` • Course: ${courseFilter}`}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                            {(statusFilter || courseFilter) && (
                                <Chip 
                                    label="Clear Filters" 
                                    onClick={() => {
                                        setStatusFilter('');
                                        setCourseFilter('');
                                        setSearchTerm('');
                                    }} 
                                    size="small"
                                    color="default"
                                    variant="outlined"
                                />
                            )}
                        </Box>
                    </Box>
                    
                    <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '16px' }}>
                        <TableContainer>
                            <Table>
                                <TableHead sx={{ backgroundColor: '#CC7A00' }}>
                                    <TableRow>
                                        <TableCell sx={{ color: '#fff' }}>Book ID</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Author</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Publisher</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Course</TableCell>
                                        <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {filteredBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(book => {
                                        let course = '';
                                        if (book.Status === 'Issued' && book.StudentId) {
                                            const studentDetails = getStudentDetails(book.StudentId);
                                            course = studentDetails.course;
                                        }
                                        
                                        return (
                                            <TableRow key={book.Id} hover>
                                                <TableCell>{book.BookId}</TableCell>
                                                <TableCell>{book.Title}</TableCell>
                                                <TableCell>{book.Author}</TableCell>
                                                <TableCell>{book.Publisher}</TableCell>
                                                <TableCell>
                                                    {course || (
                                                        <Typography variant="body2" color="text.secondary" fontStyle="italic">
                                                            N/A
                                                        </Typography>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    {book.Status === "Issued" ? (
                                                        <Box>
                                                            <Typography variant="body2" color="error" fontWeight="bold">
                                                                Issued
                                                            </Typography>
                                                            <Typography variant="caption" color="text.secondary">
                                                                {book.StudentId} ({book.StudentName})
                                                            </Typography>
                                                        </Box>
                                                    ) : (
                                                        <Chip 
                                                            label="Available" 
                                                            color="success" 
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        <TablePagination
                            component="div"
                            count={filteredBooks.length}
                            page={page}
                            onPageChange={handleChangePage}
                            rowsPerPage={rowsPerPage}
                            onRowsPerPageChange={handleChangeRowsPerPage}
                            rowsPerPageOptions={[5, 10, 25, 50]}
                        />
                    </Paper>
                </>
            )}

            {/* Add Book Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth maxWidth="sm">
                <DialogTitle>Add New Book</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField 
                        label="Book ID" 
                        name="BookId" 
                        value={newBook.BookId} 
                        onChange={handleDialogChange} 
                        fullWidth 
                        size="small"
                    />
                    <TextField 
                        label="Title" 
                        name="Title" 
                        value={newBook.Title} 
                        onChange={handleDialogChange} 
                        fullWidth 
                        required 
                        size="small"
                    />
                    <TextField 
                        label="Author" 
                        name="Author" 
                        value={newBook.Author} 
                        onChange={handleDialogChange} 
                        fullWidth 
                        size="small"
                    />
                    <TextField 
                        label="Publisher" 
                        name="Publisher" 
                        value={newBook.Publisher} 
                        onChange={handleDialogChange} 
                        fullWidth 
                        size="small"
                    />
                    <TextField 
                        label="Price" 
                        name="Price" 
                        value={newBook.Price} 
                        onChange={handleDialogChange} 
                        fullWidth 
                        size="small"
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)} size="small">Cancel</Button>
                    <Button onClick={handleAddBook} variant="contained" sx={{backgroundColor:"#CC7A00"}} size="small">
                        Add Book
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Snackbar Feedback */}
            <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
                <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
            </Snackbar>
        </Box>
    );
}

export default ListBook;