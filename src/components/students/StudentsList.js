import React, { useState, useEffect } from 'react';
import {
    Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, TablePagination,
    TableFooter, TextField, Tooltip, IconButton
} from '@mui/material';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputLabel, MenuItem, Select, FormControl
} from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VariableFeeManager from './VariableFeeManager';

const StudentsList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [filteredTransactions, setFilteredTransactions] = useState([]);
    const [openSnackbar, setOpenSnackbar] = useState(false);
    const [snackbarMessage, setSnackbarMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [openDialog, setOpenDialog] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState('');
    const [particular, setParticular] = useState('');
    const [amount, setAmount] = useState('');
    const [isExporting, setIsExporting] = useState(false);

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
        navigate(`/student/${studentId}`);
    };

    const handleSubmit = async () => {
        if (!selectedStudent || !particular || !amount) {
            setSnackbarMessage("All fields are required.");
            setOpenSnackbar(true);
            return;
        }
    
        try {
            const response = await axios.post('https://namami-infotech.com/LIT/src/fees/variable.php', {
                student_id: selectedStudent,
                particular,
                amount
            });
    
            if (response.data.success) {
                setSnackbarMessage("Fee added successfully.");
                setOpenSnackbar(true);
                setOpenDialog(false);
                setSelectedStudent('');
                setParticular('');
                setAmount('');
            } else {
                setSnackbarMessage(response.data.message || "Failed to add fee.");
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage("API error: " + error.message);
            setOpenSnackbar(true);
        }
    };

    const exportToExcel = () => {
        setIsExporting(true);
        
        // Prepare the data for export
        const dataForExport = transactions.map(student => ({
            'Student ID': student.StudentID,
            'Name': student.CandidateName,
            'Course': student.Course,
            'Semester': student.Sem,
            'Session': student.Session,
            'Gender': student.Gender,
            'DOB': student.DOB,
            'Contact': student.StudentContactNo,
            'Guardian Name': student.GuardianName,
            'Guardian Contact': student.GuardianContactNo,
            'Email': student.EmailId,
            'Address': student.PermanentAddress,
            'Blood Group': student.BloodGroup,
            '10th Board': student.Board10University,
            '10th Passing Year': student.Year10Passing,
            '10th Percentage': student.Percentage10,
            '12th Board': student.Board12University || student.Council12Name,
            '12th Passing Year': student.Year12Passing || student.Year12PassingAlt,
            '12th Percentage': student.Percentage12,
            'Aadhar Number': student.AadharNumber,
            'Category': student.ReligionCategory,
            'Disabled': student.Disabled,
            'Hostel Interest': student.InterestInHostel,
            'Transport Interest': student.InterestInTransport,
            'Submission Date': student.SubmissionDate,
            'Reference By': student.RefrenceBy
        }));

        // Create worksheet
        const ws = XLSX.utils.json_to_sheet(dataForExport);
        
        // Create workbook
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Students");
        
        // Generate file name with current date
        const fileName = `Students_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;
        
        // Export the file
        XLSX.writeFile(wb, fileName);
        setIsExporting(false);
        
        setSnackbarMessage('Excel report downloaded successfully!');
        setOpenSnackbar(true);
    };

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 0 }}>
                <h2>Students</h2>
                <div>
                    <Tooltip title="Export to Excel">
                        <IconButton 
                            onClick={exportToExcel} 
                            disabled={isExporting}
                            color="primary"
                            style={{ marginRight: '10px' }}
                        >
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>
                    <TextField
                        label="Search by Student ID or Name"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                    />
                </div>
            </div>

            <TableContainer component={Paper}>
                <Table>
                    <TableHead style={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell style={{ color: "white" }}>Student ID</TableCell>
                            <TableCell style={{ color: "white" }}>Student Name</TableCell>
                            <TableCell style={{ color: "white" }}>Course</TableCell>
                            <TableCell style={{ color: "white" }}>Semester</TableCell>
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

            <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
                <DialogTitle>Add Variable Fee</DialogTitle>
                <DialogContent>
                    <FormControl fullWidth margin="normal">
                        <InputLabel>Student</InputLabel>
                        <Select
                            value={selectedStudent}
                            onChange={(e) => setSelectedStudent(e.target.value)}
                        >
                            {transactions.map((student) => (
                                <MenuItem key={student.StudentID} value={student.StudentID}>
                                    {student.StudentID} - {student.CandidateName}
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Particular"
                        value={particular}
                        onChange={(e) => setParticular(e.target.value)}
                    />
                    <TextField
                        fullWidth
                        margin="normal"
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
                    <Button onClick={handleSubmit} color="primary">Submit</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default StudentsList;