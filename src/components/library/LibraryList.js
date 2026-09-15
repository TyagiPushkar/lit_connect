import React, { useState, useEffect } from 'react';
import {
    Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, TablePagination,
    TableFooter, TextField, CircularProgress
} from '@mui/material';
import axios from 'axios';
import * as XLSX from 'xlsx';
import SaveAltIcon from "@mui/icons-material/SaveAlt";
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';

const LibraryList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [isDownloading, setIsDownloading] = useState(false);

    useEffect(() => {
        fetchLibraryTransactions();
    }, []);

    useEffect(() => {
        handleSearch(searchQuery);
    }, [transactions, searchQuery]);

    const fetchLibraryTransactions = async () => {
        try {
            const response = await axios.get('https://namami-infotech.com/LIT/src/students/get_student.php');
            if (response.data.success) {
                const sorted = response.data.data.sort((a, b) => b.TransactionId - a.TransactionId);
                setTransactions(sorted);
                setFilteredTransactions(sorted);
            } else {
                setSnackbarMessage(response.data.message);
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage('Error fetching library transactions.');
            setOpenSnackbar(true);
        }
    };

    const handleDownloadExcel = async () => {
        setIsDownloading(true);
        try {
            // Fetch all books using existing library API
            const bookRes = await axios.get('https://namami-infotech.com/LIT/src/library/list_book.php');
            
            // Get student list (from state or fresh API call)
            let studentList = transactions;
            if (!studentList || studentList.length === 0) {
                const sRes = await axios.get('https://namami-infotech.com/LIT/src/students/get_student.php');
                if (sRes.data.success && sRes.data.data) {
                    studentList = sRes.data.data;
                }
            }

            const studentMap = new Map();
            (studentList || []).forEach((s) => {
                if (s && s.StudentID) {
                    studentMap.set(String(s.StudentID), s);
                }
            });

            if (bookRes.data.success && Array.isArray(bookRes.data.data)) {
                // Filter all issued books
                const issuedBooks = bookRes.data.data.filter(
                    (b) => b.Status === 'Issued' && b.StudentId
                );

                const dataForExport = issuedBooks.map((book, idx) => {
                    const student = studentMap.get(String(book.StudentId)) || {};
                    return {
                        "Sl No": idx + 1,
                        "Student ID": book.StudentId || '',
                        "Student Name": student.CandidateName || book.StudentName || '',
                        "Course": student.Course || '',
                        "Semester": student.Sem || '',
                        "Contact No": student.StudentContactNo || '',
                        "Book ID": book.BookId || '',
                        "Book Title": book.Title || '',
                        "Author": book.Author || '',
                        "Publisher": book.Publisher || '',
                        "Price": book.Price || '',
                        "Issue Date": book.UpdatedDatetime || book.DateTime || '',
                        "Status": book.Status || 'Issued',
                    };
                });

                // Summary of all students with their issued count
                const summaryData = (studentList || []).map((s, idx) => ({
                    "Sl No": idx + 1,
                    "Student ID": s.StudentID,
                    "Student Name": s.CandidateName,
                    "Course": s.Course,
                    "Semester": s.Sem,
                    "Contact No": s.StudentContactNo || '',
                    "Total Books Issued": s.BookIssue || 0,
                }));

                const wb = XLSX.utils.book_new();
                const wsIssued = XLSX.utils.json_to_sheet(dataForExport);
                const wsSummary = XLSX.utils.json_to_sheet(summaryData);

                XLSX.utils.book_append_sheet(wb, wsIssued, "Issued Books");
                XLSX.utils.book_append_sheet(wb, wsSummary, "All Students Summary");

                const fileName = `All_Students_Book_Issues_${new Date().toISOString().slice(0, 10)}.xlsx`;
                XLSX.writeFile(wb, fileName);

                setSnackbarMessage('Excel sheet downloaded successfully!');
                setOpenSnackbar(true);
            } else {
                setSnackbarMessage('Failed to fetch book records.');
                setOpenSnackbar(true);
            }
        } catch (error) {
            console.error('Error downloading excel:', error);
            setSnackbarMessage('Error generating Excel file.');
            setOpenSnackbar(true);
        } finally {
            setIsDownloading(false);
        }
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
        const lower = query.toLowerCase();
        const filtered = transactions.filter(tx =>
            (tx.StudentID && tx.StudentID.toLowerCase().includes(lower)) ||
            (tx.CandidateName && tx.CandidateName.toLowerCase().includes(lower))
        );
        setFilteredTransactions(filtered);
        setPage(0); // Reset to first page
    };

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewClick = (studentId) => {
        navigate(`/student/library/${studentId}`);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <h2>Library</h2>
                <TextField
                    label="Search by Student ID or Name"
                    variant="outlined"
                    size="small"
                    value={searchQuery}
                    onChange={(e) => handleSearch(e.target.value)}
                />
                <Button
                    variant="contained"
                    disabled={isDownloading}
                    startIcon={isDownloading ? <CircularProgress size={20} color="inherit" /> : <SaveAltIcon />}
                    onClick={handleDownloadExcel}
                    sx={{ backgroundColor: "#28a745", "&:hover": { backgroundColor: "#218838" } }}
                >
                    {isDownloading ? "Generating Excel..." : "Download Excel"}
                </Button>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead style={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell style={{ color: "white" }}>Student ID</TableCell>
                            <TableCell style={{ color: "white" }}>Student Name</TableCell>
                            <TableCell style={{ color: "white" }}>Course</TableCell>
                            <TableCell style={{ color: "white" }}>Sem</TableCell>
                            <TableCell style={{ color: "white" }}>Book Issue</TableCell>
                            {/* <TableCell style={{ color: "white" }}>Book Return</TableCell> */}
                            <TableCell style={{ color: "white" }}>Action</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTransactions
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((tx) => (
                                <TableRow key={tx.TransactionId || tx.StudentID}>
                                    <TableCell>{tx.StudentID}</TableCell>
                                    <TableCell>{tx.CandidateName}</TableCell>
                                    <TableCell>{tx.Course}</TableCell>
                                    <TableCell>{tx.Sem}</TableCell>
                                    <TableCell>{tx.BookIssue}</TableCell>
                                    {/* <TableCell>{tx.BookReturn}</TableCell> */}
                                    <TableCell>

                                        <VisibilityIcon
                                            color="primary"
                                            sx={{ cursor: 'pointer' }}
                                            onClick={() => handleViewClick(tx.StudentID)}
                                        />
                                    </TableCell>
                                </TableRow>
                            ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow>
                            <TablePagination
                                rowsPerPageOptions={[5, 10, 25]}
                                count={filteredTransactions.length}
                                rowsPerPage={rowsPerPage}
                                page={page}
                                onPageChange={handleChangePage}
                                onRowsPerPageChange={handleChangeRowsPerPage}
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            <Snackbar
                open={openSnackbar}
                autoHideDuration={6000}
                onClose={() => setOpenSnackbar(false)}
                message={snackbarMessage}
            />
        </div>
    );
};

export default LibraryList;
