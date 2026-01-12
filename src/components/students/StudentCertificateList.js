import React, { useState, useEffect } from 'react';
import {
    Button, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Paper, Snackbar, TablePagination,
    TableFooter, TextField, Tooltip, IconButton, Box,
    Chip, Stack, Switch, FormControlLabel
} from '@mui/material';
import {
    Dialog, DialogTitle, DialogContent, DialogActions,
    InputLabel, MenuItem, Select, FormControl
} from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VariableFeeManager from './VariableFeeManager';
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const StudentsCertificateList = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [transactions, setTransactions] = useState([]);
    const [employeeStatus, setEmployeeStatus] = useState({}); // Store employee IsActive status
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
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    
    // Filter states
    const [courseFilter, setCourseFilter] = useState('');
    const [batchFilter, setBatchFilter] = useState('');
    const [semesterFilter, setSemesterFilter] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [isActiveFilter, setIsActiveFilter] = useState('all'); // 'all', 'active', 'inactive'
    
    // Extract unique values for filters
    const uniqueCourses = [...new Set(transactions.map(tx => tx.Course).filter(Boolean))].sort();
    const uniqueBatches = [...new Set(transactions.map(tx => tx.Session).filter(Boolean))].sort((a, b) => b.localeCompare(a));
    const uniqueSemesters = [...new Set(transactions.map(tx => tx.Sem).filter(Boolean))].sort();

    useEffect(() => {
        fetchLibraryTransactions();
        fetchEmployeeStatus();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [transactions, employeeStatus, searchQuery, courseFilter, batchFilter, semesterFilter, isActiveFilter]);

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

    const fetchEmployeeStatus = async () => {
        try {
            const response = await axios.get('https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=1');
            if (response.data.success) {
                // Create a map of employee/student IDs to their IsActive status
                const statusMap = {};
                response.data.data.forEach(emp => {
                    statusMap[emp.EmpId] = emp.IsActive === 1; // Convert 1/0 to true/false
                });
                setEmployeeStatus(statusMap);
            } else {
                console.error('Error fetching employee status:', response.data.message);
            }
        } catch (error) {
            console.error('Error fetching employee status:', error);
        }
    };

    const getStudentStatus = (studentId) => {
        // Check if student ID exists in employee status
        if (employeeStatus[studentId] !== undefined) {
            return employeeStatus[studentId];
        }
        // If not found in employee list, assume active
        return true;
    };

    const applyFilters = () => {
        let filtered = transactions;
        
        // Apply text search filter
        if (searchQuery) {
            const lower = searchQuery.toLowerCase();
            filtered = filtered.filter(tx =>
                (tx.StudentID && tx.StudentID.toLowerCase().includes(lower)) ||
                (tx.CandidateName && tx.CandidateName.toLowerCase().includes(lower))
            );
        }
        
        // Apply course filter
        if (courseFilter) {
            filtered = filtered.filter(tx => tx.Course === courseFilter);
        }
        
        // Apply batch filter
        if (batchFilter) {
            filtered = filtered.filter(tx => tx.Session === batchFilter);
        }
        
        // Apply semester filter
        if (semesterFilter) {
            filtered = filtered.filter(tx => tx.Sem === semesterFilter);
        }
        
        // Apply active status filter
        if (isActiveFilter !== 'all') {
            const isActive = isActiveFilter === 'active';
            filtered = filtered.filter(tx => {
                const studentActiveStatus = getStudentStatus(tx.StudentID);
                return studentActiveStatus === isActive;
            });
        }
        
        setFilteredTransactions(filtered);
        setPage(0); // Reset to first page
    };

    const handleSearch = (query) => {
        setSearchQuery(query);
    };

    const handleClearFilters = () => {
        setSearchQuery('');
        setCourseFilter('');
        setBatchFilter('');
        setSemesterFilter('');
        setIsActiveFilter('all');
    };

    const hasActiveFilters = () => {
        return searchQuery || courseFilter || batchFilter || semesterFilter || isActiveFilter !== 'all';
    };

    const getActiveFilterCount = () => {
        let count = 0;
        if (searchQuery) count++;
        if (courseFilter) count++;
        if (batchFilter) count++;
        if (semesterFilter) count++;
        if (isActiveFilter !== 'all') count++;
        return count;
    };

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleViewClick = (studentId) => {
        navigate(`/student-certificate/${studentId}`);
    };

    const handleToggleActive = async (student) => {
        setLoading(true);
        try {
            const currentStatus = getStudentStatus(student.StudentID);
            const action = currentStatus ? "disable" : "enable";
            
            const response = await axios.post(
                "https://namami-infotech.com/LIT/src/employee/disable_employee.php",
                {
                    EmpId: student.StudentID,
                    action: action,
                },
            );

            if (response.data.success) {
                setSnackbarMessage(`Student ${action === 'enable' ? 'enabled' : 'disabled'} successfully`);
                setOpenSnackbar(true);
                
                // Update the employee status map
                setEmployeeStatus(prev => ({
                    ...prev,
                    [student.StudentID]: action === 'enable'
                }));
                
                // Also update the transactions if they have IsActive field
                setTransactions(prevTransactions => 
                    prevTransactions.map(tx => 
                        tx.StudentID === student.StudentID 
                            ? { ...tx, IsActive: action === 'enable' } 
                            : tx
                    )
                );
            } else {
                setSnackbarMessage(response.data.message || `Failed to ${action} student`);
                setOpenSnackbar(true);
            }
        } catch (error) {
            setSnackbarMessage('Error updating student status');
            setOpenSnackbar(true);
            console.error("Error:", error);
        } finally {
            setLoading(false);
        }
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
        const dataForExport = transactions.map(student => {
            const isActive = getStudentStatus(student.StudentID);
            return {
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
                'Reference By': student.RefrenceBy,
                'Status': isActive ? 'Active' : 'Inactive'
            };
        });

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

    const handleRemoveMobileID = async (StudentID) => {
        try {
            const response = await fetch(
                "https://namami-infotech.com/LIT/src/auth/remove_device.php",
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ employee_id: StudentID }),
                }
            );
            const data = await response.json();
            if (data.success) {
                alert("Mobile ID removed successfully.");
                fetchLibraryTransactions();
            } else {
                alert("Mobile ID already removed");
            }
        } catch (err) {
            setError("Error removing Mobile ID.");
        }
    };

    // Calculate counts for summary
    const activeCount = transactions.filter(tx => getStudentStatus(tx.StudentID)).length;
    const inactiveCount = transactions.length - activeCount;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <h2>Students</h2>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <Tooltip title="Export to Excel">
                        <IconButton 
                            onClick={exportToExcel} 
                            disabled={isExporting}
                            color="primary"
                        >
                            <FileDownloadIcon />
                        </IconButton>
                    </Tooltip>
                    
                    <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
                        <IconButton 
                            onClick={() => setShowFilters(!showFilters)}
                            color={hasActiveFilters() ? "primary" : "default"}
                            sx={{ 
                                border: hasActiveFilters() ? '2px solid #1976d2' : 'none',
                                borderRadius: 1
                            }}
                        >
                            <FilterListIcon />
                            {hasActiveFilters() && (
                                <Chip 
                                    label={getActiveFilterCount()}
                                    size="small"
                                    sx={{ 
                                        position: 'absolute', 
                                        top: -8, 
                                        right: -8,
                                        height: 20,
                                        minWidth: 20,
                                        fontSize: '0.75rem'
                                    }}
                                />
                            )}
                        </IconButton>
                    </Tooltip>
                    
                    <TextField
                        label="Search by Student ID or Name"
                        variant="outlined"
                        size="small"
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        sx={{ width: 300 }}
                    />
                </div>
            </div>

            {/* Filter Section */}
            {showFilters && (
                <Paper sx={{ p: 2, mb: 2, backgroundColor: '#f5f5f5' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                        <h4 style={{ margin: 0 }}>Filters</h4>
                        <Button
                            startIcon={<ClearIcon />}
                            onClick={handleClearFilters}
                            size="small"
                            disabled={!hasActiveFilters()}
                        >
                            Clear All
                        </Button>
                    </Box>
                    
                    <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Course</InputLabel>
                            <Select
                                value={courseFilter}
                                onChange={(e) => setCourseFilter(e.target.value)}
                                label="Course"
                            >
                                <MenuItem value="">All Courses</MenuItem>
                                {uniqueCourses.map(course => (
                                    <MenuItem key={course} value={course}>{course}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Batch</InputLabel>
                            <Select
                                value={batchFilter}
                                onChange={(e) => setBatchFilter(e.target.value)}
                                label="Batch"
                            >
                                <MenuItem value="">All Batches</MenuItem>
                                {uniqueBatches.map(batch => (
                                    <MenuItem key={batch} value={batch}>{batch}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Semester</InputLabel>
                            <Select
                                value={semesterFilter}
                                onChange={(e) => setSemesterFilter(e.target.value)}
                                label="Semester"
                            >
                                <MenuItem value="">All Semesters</MenuItem>
                                {uniqueSemesters.map(sem => (
                                    <MenuItem key={sem} value={sem}>{sem}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                        
                        <FormControl size="small" sx={{ minWidth: 150 }}>
                            <InputLabel>Status</InputLabel>
                            <Select
                                value={isActiveFilter}
                                onChange={(e) => setIsActiveFilter(e.target.value)}
                                label="Status"
                            >
                                <MenuItem value="all">All Status</MenuItem>
                                <MenuItem value="active">Active Only</MenuItem>
                                <MenuItem value="inactive">Inactive Only</MenuItem>
                            </Select>
                        </FormControl>
                    </Stack>
                    
                    {/* Active Filters Display */}
                    {hasActiveFilters() && (
                        <Box sx={{ mt: 2 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                                {searchQuery && (
                                    <Chip
                                        label={`Search: "${searchQuery}"`}
                                        onDelete={() => setSearchQuery('')}
                                        size="small"
                                    />
                                )}
                                {courseFilter && (
                                    <Chip
                                        label={`Course: ${courseFilter}`}
                                        onDelete={() => setCourseFilter('')}
                                        size="small"
                                    />
                                )}
                                {batchFilter && (
                                    <Chip
                                        label={`Batch: ${batchFilter}`}
                                        onDelete={() => setBatchFilter('')}
                                        size="small"
                                    />
                                )}
                                {semesterFilter && (
                                    <Chip
                                        label={`Semester: ${semesterFilter}`}
                                        onDelete={() => setSemesterFilter('')}
                                        size="small"
                                    />
                                )}
                                {isActiveFilter !== 'all' && (
                                    <Chip
                                        label={`Status: ${isActiveFilter === 'active' ? 'Active' : 'Inactive'}`}
                                        onDelete={() => setIsActiveFilter('all')}
                                        size="small"
                                    />
                                )}
                            </Stack>
                        </Box>
                    )}
                </Paper>
            )}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead style={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell style={{ color: "white" }}>Student ID</TableCell>
                            <TableCell style={{ color: "white" }}>Student Name</TableCell>
                            <TableCell style={{ color: "white" }}>Course</TableCell>
                            <TableCell style={{ color: "white" }}>Batch</TableCell>
                            <TableCell style={{ color: "white" }}>Semester</TableCell>
                            <TableCell style={{ color: "white" }}>Status</TableCell>
                            <TableCell style={{ color: "white" }}>View</TableCell>
                            {user && user.role === 'HR' && (
                                <>
                                    <TableCell style={{ color: "white" }}>Reset Mobile ID</TableCell>
                                    <TableCell style={{ color: "white" }}>Disable/Enable</TableCell>
                                </>
                            )}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredTransactions.length > 0 ? (
                            filteredTransactions
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((tx) => {
                                    const isActive = getStudentStatus(tx.StudentID);
                                    return (
                                        <TableRow 
                                            key={tx.TransactionId || tx.StudentID}
                                            sx={{ 
                                                backgroundColor: !isActive ? '#f5f5f5' : 'inherit',
                                                opacity: !isActive ? 0.7 : 1
                                            }}
                                        >
                                            <TableCell>{tx.StudentID}</TableCell>
                                            <TableCell>{tx.CandidateName}</TableCell>
                                            <TableCell>{tx.Course}</TableCell>
                                            <TableCell>{tx.Session}</TableCell>
                                            <TableCell>{tx.Sem}</TableCell>
                                            <TableCell>
                                                <Chip
                                                    label={isActive ? "Active" : "Inactive"}
                                                    color={isActive ? "success" : "error"}
                                                    size="small"
                                                    icon={isActive ? <CheckCircleIcon /> : <BlockIcon />}
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Tooltip title="View Student Details">
                                                    <VisibilityIcon
                                                        color="primary"
                                                        sx={{ cursor: 'pointer' }}
                                                        onClick={() => handleViewClick(tx.StudentID)}
                                                    />
                                                </Tooltip>
                                            </TableCell>
                                            {user && user.role === 'HR' && (
                                                <>
                                                    <TableCell>
                                                        <Tooltip title="Reset Mobile ID">
                                                            <IconButton
                                                                sx={{ 
                                                                    backgroundColor: "red", 
                                                                    color: "white", 
                                                                    ":hover": { backgroundColor: "darkred" }
                                                                }}
                                                                onClick={() => handleRemoveMobileID(tx.StudentID)}
                                                            >
                                                                <RestartAltIcon />
                                                            </IconButton>
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip title={isActive ? "Disable Student" : "Enable Student"}>
                                                            <FormControlLabel
                                                                control={
                                                                    <Switch
                                                                        checked={isActive}
                                                                        onChange={() => handleToggleActive(tx)}
                                                                        disabled={loading}
                                                                        color={isActive ? "primary" : "secondary"}
                                                                    />
                                                                }
                                                                label=""
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                </>
                                            )}
                                        </TableRow>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={user && user.role === 'HR' ? 9 : 7} align="center">
                                    No students found
                                </TableCell>
                            </TableRow>
                        )}
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
                                labelRowsPerPage="Rows per page:"
                            />
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>

            {/* Summary information */}
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box sx={{ display: 'flex', gap: 1 }}>
                    <Chip 
                        label={`Total Students: ${transactions.length}`} 
                        color="primary" 
                        variant="outlined"
                    />
                    <Chip 
                        label={`Active: ${activeCount}`} 
                        color="success" 
                        variant="outlined"
                    />
                    <Chip 
                        label={`Inactive: ${inactiveCount}`} 
                        color="error" 
                        variant="outlined"
                    />
                </Box>
                {hasActiveFilters() && (
                    <Chip 
                        label={`Filtered: ${filteredTransactions.length}`} 
                        color="secondary" 
                        variant="outlined"
                    />
                )}
            </Box>

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

export default StudentsCertificateList;