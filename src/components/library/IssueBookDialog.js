import React, { useEffect, useState } from 'react';
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    TextField, Snackbar, Autocomplete, CircularProgress
} from '@mui/material';
import axios from 'axios';

const IssueBookDialog = ({ open, onClose, onSuccess }) => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [selectedBook, setSelectedBook] = useState(null);
    const [studentId, setStudentId] = useState('');
    const [issueDate, setIssueDate] = useState('');
    const [returnDate, setReturnDate] = useState('');
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open) fetchBooks();
    }, [open]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await axios.get('https://namami-infotech.com/LIT/src/library/list_book.php');
            if (res.data.success) {
                const availableBooks = res.data.data.filter(book => book.Status === 'Available');
                setBooks(availableBooks);
                setFilteredBooks([]);
            } else {
                setSnackbar({ open: true, message: 'No matching books found.' });
                setBooks([]);
                setFilteredBooks([]);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Error fetching books.' });
        }
        setLoading(false);
    };

    const handleInputChange = (event, value) => {
        if (value.length >= 3) {
            const filtered = books.filter(book =>
                book.Title.toLowerCase().includes(value.toLowerCase()) ||
                book.Author.toLowerCase().includes(value.toLowerCase()) ||
                book.Publisher.toLowerCase().includes(value.toLowerCase())
            );
            setFilteredBooks(filtered);
        } else {
            setFilteredBooks([]);
        }
    };

    const handleIssue = async () => {
        if (!studentId || !selectedBook || !issueDate || !returnDate) {
            setSnackbar({ open: true, message: 'Please fill all fields.' });
            return;
        }

        try {
            const payload = {
                StudentId: studentId,
                BookId: selectedBook.BookId,
                IssueDate: issueDate,
                ReturnDate: returnDate,
            };
            const res = await axios.post('https://namami-infotech.com/LIT/src/library/issue_book.php', payload);
            if (res.data.success) {
                setSnackbar({ open: true, message: 'Book issued successfully!' });
                onSuccess();
                onClose();
            } else {
                setSnackbar({ open: true, message: res.data.message });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Error issuing book.' });
        }
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth>
                <DialogTitle>Issue Book</DialogTitle>
                <DialogContent>
                    <TextField
                        label="Student ID"
                        value={studentId}
                        onChange={(e) => setStudentId(e.target.value)}
                        fullWidth
                        margin="normal"
                    />
                    <Autocomplete
                        options={filteredBooks}
                        getOptionLabel={(option) => `${option.Title} by ${option.Author}`}
                        onInputChange={handleInputChange}
                        onChange={(event, newValue) => setSelectedBook(newValue)}
                        filterOptions={(x) => x}
                        loading={loading}
                        renderInput={(params) => (
                            <TextField
                                {...params}
                                label="Search Book (min 3 chars)"
                                margin="normal"
                                fullWidth
                                InputProps={{
                                    ...params.InputProps,
                                    endAdornment: (
                                        <>
                                            {loading && <CircularProgress color="inherit" size={20} />}
                                            {params.InputProps.endAdornment}
                                        </>
                                    ),
                                }}
                            />
                        )}
                    />
                    <TextField
                        label="Issue Date"
                        type="date"
                        value={issueDate}
                        onChange={(e) => setIssueDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />
                    <TextField
                        label="Return Date"
                        type="date"
                        value={returnDate}
                        onChange={(e) => setReturnDate(e.target.value)}
                        fullWidth
                        margin="normal"
                        InputLabelProps={{ shrink: true }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button onClick={handleIssue} variant="contained" color="primary">Issue</Button>
                </DialogActions>
            </Dialog>

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ open: false, message: '' })}
                message={snackbar.message}
            />
        </>
    );
};

export default IssueBookDialog;
