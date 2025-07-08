import React, { useEffect, useState } from 'react';
import {
    Box, Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, TablePagination, Typography, CircularProgress,
    TextField, FormControl, InputLabel, Select, MenuItem, Button,
    Dialog, DialogTitle, DialogContent, DialogActions, Snackbar, Alert
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AddIcon from '@mui/icons-material/Add';
import axios from 'axios';

function ListBook({ setView, defaultStatusFilter = '' }) {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState(defaultStatusFilter);

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
    }, []);

    useEffect(() => {
        applyFilters();
    }, [searchTerm, statusFilter, books]);

    const fetchBooks = async () => {
        try {
            const response = await axios.get('http://139.5.190.143/LIT/src/library/list_book.php');
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

    const applyFilters = () => {
        let filtered = books;
        if (searchTerm.trim() !== '') {
            filtered = filtered.filter(book =>
                book.Title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.Author.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.Publisher.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (statusFilter !== '') {
            filtered = filtered.filter(book => book.Status === statusFilter);
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
                'http://139.5.190.143/LIT/src/library/add_book.php',
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
                    label="Search by Title/Author/Publisher"
                    variant="outlined"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
                <FormControl variant="outlined" sx={{ minWidth: 150 }}>
                    <InputLabel>Status</InputLabel>
                    <Select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        label="Status"
                    >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Available">Available</MenuItem>
                        <MenuItem value="Issued">Issued</MenuItem>
                    </Select>
                </FormControl>
                <Button
                    variant="contained"
                    startIcon={<AddIcon />}
                    onClick={() => setOpenDialog(true)}
                    sx={{backgroundColor:"#CC7A00"}}
                >
                    Add Book
                </Button>
            </Box>

            {loading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', height: '60vh', alignItems: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: '16px' }}>
                    <TableContainer>
                        <Table>
                            <TableHead sx={{ backgroundColor: '#CC7A00' }}>
                                <TableRow>
                                    <TableCell sx={{ color: '#fff' }}>Book ID</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Title</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Author</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Publisher</TableCell>
                                    <TableCell sx={{ color: '#fff' }}>Status</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredBooks.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map(book => (
                                    <TableRow key={book.Id} hover>
                                        <TableCell>{book.BookId}</TableCell>
                                        <TableCell>{book.Title}</TableCell>
                                        <TableCell>{book.Author}</TableCell>
                                        <TableCell>{book.Publisher}</TableCell>
                                        <TableCell>
  {book.Status === "Issued" ? `Issued (${book.StudentId}(${book.StudentName}))` : "Available"}
</TableCell>

                                    </TableRow>
                                ))}
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
            )}

            {/* Add Book Dialog */}
            <Dialog open={openDialog} onClose={() => setOpenDialog(false)} fullWidth>
                <DialogTitle>Add New Book</DialogTitle>
                <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                    <TextField label="Book ID" name="BookId" value={newBook.BookId} onChange={handleDialogChange} fullWidth />
                    <TextField label="Title" name="Title" value={newBook.Title} onChange={handleDialogChange} fullWidth required />
                    <TextField label="Author" name="Author" value={newBook.Author} onChange={handleDialogChange} fullWidth />
                    <TextField label="Publisher" name="Publisher" value={newBook.Publisher} onChange={handleDialogChange} fullWidth />
                    {/* <TextField label="Book Code" name="BookCode" value={newBook.BookCode} onChange={handleDialogChange} fullWidth /> */}
                    <TextField label="Price" name="Price" value={newBook.Price} onChange={handleDialogChange} fullWidth />
                   
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleAddBook} variant="contained" sx={{backgroundColor:"#CC7A00"}}>Add Book</Button>
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
