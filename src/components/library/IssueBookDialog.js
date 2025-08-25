import React, { useEffect, useState } from 'react';
import {
    Button, Dialog, DialogTitle, DialogContent, DialogActions,
    Snackbar, Checkbox, FormControlLabel, CircularProgress,
    TextField, MenuItem, Select, InputLabel, FormControl,
    Autocomplete
} from '@mui/material';
import { LibraryBooks } from '@mui/icons-material';
import axios from 'axios';

const IssueBookDialog = ({ open, onClose, onSuccess, course, StudentId }) => {
    const [books, setBooks] = useState([]);
    const [filteredBooks, setFilteredBooks] = useState([]);
    const [selectedBooks, setSelectedBooks] = useState([]);
    const [issueDate, setIssueDate] = useState(new Date().toISOString().split('T')[0]);
    const [returnDate, setReturnDate] = useState(new Date().toISOString().split('T')[0]);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });
    const [loading, setLoading] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortSemester, setSortSemester] = useState('');
    const [availableBooksMap, setAvailableBooksMap] = useState({});

    useEffect(() => {
        if (open) fetchBooks();
    }, [open, course]);

    useEffect(() => {
        let updatedBooks = [...books];
        if (searchQuery) {
            updatedBooks = updatedBooks.filter((book) =>
                book.book_title.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        if (sortSemester) {
            updatedBooks = updatedBooks.filter((book) => book.semester === sortSemester);
        }
        setFilteredBooks(updatedBooks);
    }, [searchQuery, sortSemester, books]);

    const fetchBooks = async () => {
        setLoading(true);
        try {
            const res = await axios.get(`https://namami-infotech.com/LIT/src/library/get_sem_books.php?course=${course}`);
            if (res.data.success) {
                setBooks(res.data.data);
            } else {
                setSnackbar({ open: true, message: 'No books found for this course.' });
                setBooks([]);
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Error fetching books.' });
        }
        setLoading(false);
    };

    const fetchAvailableBooks = async (bookTitle) => {
        const encodedTitle = encodeURIComponent(bookTitle);
        try {
            const res = await axios.get(`https://namami-infotech.com/LIT/src/library/get_available_books.php?title=${encodedTitle}`);
            if (res.data.success && res.data.data.length > 0) {
                setAvailableBooksMap(prev => ({
                    ...prev,
                    [bookTitle]: res.data.data
                }));
                return res.data.data;
            } else {
                setSnackbar({ open: true, message: `No available copies found for ${bookTitle}.` });
                return [];
            }
        } catch (err) {
            setSnackbar({ open: true, message: 'Error fetching available books.' });
            return [];
        }
    };

    const handleCheckboxChange = async (event, book) => {
        if (event.target.checked) {
            const availableBooks = await fetchAvailableBooks(book.book_title);
            if (availableBooks.length > 0) {
                // Auto-select the first available book
                setSelectedBooks((prevSelectedBooks) => {
                    const updatedSelectedBooks = [...prevSelectedBooks, {
                        ...availableBooks[0],
                        book_title: book.book_title,
                        semester: book.semester
                    }];
                    return updatedSelectedBooks;
                });
            } else {
                event.target.checked = false;
            }
        } else {
            setSelectedBooks((prevSelectedBooks) =>
                prevSelectedBooks.filter((selectedBook) => selectedBook.book_title !== book.book_title)
            );
            // Remove from available books map
            setAvailableBooksMap(prev => {
                const newMap = {...prev};
                delete newMap[book.book_title];
                return newMap;
            });
        }
    };

    const handleBookIdChange = (bookTitle, selectedBookId) => {
        if (!selectedBookId) return;
        
        const selectedBook = availableBooksMap[bookTitle].find(book => book.BookId === selectedBookId);
        
        if (selectedBook) {
            setSelectedBooks(prev => {
                // Remove any existing entry for this book title
                const filtered = prev.filter(book => book.book_title !== bookTitle);
                // Add the new selection
                return [...filtered, { 
                    ...selectedBook, 
                    book_title: bookTitle,
                    semester: books.find(b => b.book_title === bookTitle)?.semester || ''
                }];
            });
        }
    };

    const handleIssue = async () => {
        if (!StudentId || selectedBooks.length === 0) {
            setSnackbar({ open: true, message: 'Please select books and ensure Student ID is available.' });
            return;
        }

        const payload = {
            StudentId: StudentId,
            IssueDate: issueDate,
            ReturnDate: returnDate || issueDate,
            BookIds: selectedBooks.map((book) => book.BookId)
        };

        try {
            setLoading(true);
            const res = await axios.post('https://namami-infotech.com/LIT/src/library/issue_book.php', payload);
            
            if (res.data.success) {
                setSnackbar({ open: true, message: 'Books issued successfully!' });
                onSuccess();
                onClose();
                // Reset selections
                setSelectedBooks([]);
                setAvailableBooksMap({});
            } else {
                setSnackbar({ open: true, message: res.data.message });
            }
        } catch (error) {
            setSnackbar({ open: true, message: 'Error issuing books.' });
        }
        setLoading(false);
    };

    return (
        <>
            <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
                <DialogTitle>Issue Book</DialogTitle>
                <DialogContent>
                    {/* Search and Sort Controls */}
                    <div style={{ marginBottom: '16px', marginTop: '16px' }}>
                        <TextField
                            label="Search Books"
                            variant="outlined"
                            fullWidth
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            style={{ marginBottom: '16px' }}
                        />
                        <FormControl fullWidth variant="outlined">
                            <InputLabel>Sort by Semester</InputLabel>
                            <Select
                                value={sortSemester}
                                onChange={(e) => setSortSemester(e.target.value)}
                                label="Sort by Semester"
                            >
                                <MenuItem value=""><em>All</em></MenuItem>
                                <MenuItem value="1st SEM">1st SEM</MenuItem>
                                <MenuItem value="2nd SEM">2nd SEM</MenuItem>
                                <MenuItem value="3rd SEM">3rd SEM</MenuItem>
                                <MenuItem value="4th SEM">4th SEM</MenuItem>
                                <MenuItem value="5th SEM">5th SEM</MenuItem>
                                <MenuItem value="6th SEM">6th SEM</MenuItem>
                            </Select>
                        </FormControl>
                    </div>

                    {/* Date Selection */}
                    <div style={{ display: 'flex', gap: '16px', marginBottom: '16px' }}>
                        <TextField
                            label="Issue Date"
                            type="date"
                            value={issueDate}
                            onChange={(e) => setIssueDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="Return Date"
                            type="date"
                            value={returnDate}
                            onChange={(e) => setReturnDate(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </div>

                    {/* Books list */}
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <CircularProgress />
                        </div>
                    ) : (
                        filteredBooks.map((book, index) => (
                            <div key={index} style={{ marginBottom: '16px', padding: '8px', border: '1px solid #eee', borderRadius: '4px', display:"flex", }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={selectedBooks.some(b => b.book_title === book.book_title)}
                                            onChange={(event) => handleCheckboxChange(event, book)}
                                        />
                                    }
                                    label={
                                        <>
                                            <LibraryBooks style={{ marginRight: 8 }} />
                                            {book.book_title} (Semester: {book.semester})
                                        </>
                                    }
                                />
                                
                                {selectedBooks.some(b => b.book_title === book.book_title) && availableBooksMap[book.book_title] && (
  <FormControl fullWidth style={{ marginTop: '8px', marginLeft: '0px' }}>
    <Autocomplete
      options={availableBooksMap[book.book_title]}
      getOptionLabel={(option) =>
        `Book ID: ${option.BookId}${option.BookCode !== option.BookId ? ` (Code: ${option.BookCode})` : ''}`
      }
      value={
        availableBooksMap[book.book_title].find(
          (b) => b.BookId === selectedBooks.find(sb => sb.book_title === book.book_title)?.BookId
        ) || null
      }
      onChange={(event, newValue) => {
        handleBookIdChange(book.book_title, newValue ? newValue.BookId : '');
      }}
      renderInput={(params) => (
        <TextField {...params} label="Select Book ID" variant="outlined" />
      )}
    />
  </FormControl>
)}

                            </div>
                        ))
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={onClose}>Cancel</Button>
                    <Button 
                        onClick={handleIssue} 
                        variant="contained" 
                        color="primary"
                        disabled={loading || selectedBooks.length === 0}
                    >
                        {loading ? <CircularProgress size={24} /> : "Issue"}
                    </Button>
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