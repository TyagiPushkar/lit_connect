import React, { useState, useEffect, useCallback } from 'react';
import {
    Box,
    Typography,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    CircularProgress,
    TableFooter,
    TablePagination,
    IconButton,
    Button
} from '@mui/material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import CheckIcon from '@mui/icons-material/Check';
import CancelIcon from '@mui/icons-material/Cancel';

function ViewLeave() {
    const { user } = useAuth();
    const [leaves, setLeaves] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(5);

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    const fetchLeaves = useCallback(async () => {
        if (!user || !user.emp_id || employees.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        try {
            const params = user.role === 'HR' ? { role: "HR" } : { empId: user.emp_id };
            const response = await axios.get('https://namami-infotech.com/LIT/src/leave/get_leave.php', { params });

            if (response.data.success) {
                const filteredLeaves = response.data.data.filter(leave => 
                    employees.some(emp => emp.EmpId === leave.EmpId)
                );
                setLeaves(filteredLeaves);
            } else {
                setError(response.data.message || 'Failed to fetch leave data');
            }
        } catch (error) {
            setError('Error fetching leave data. Please try again later.');
            console.error('Error:', error);
        } finally {
            setLoading(false);
        }
    }, [user, employees]);

    useEffect(() => {
        const fetchEmployees = async () => {
            try {
                if (!user?.tenent_id) {
                    setError('User information not available');
                    setLoading(false);
                    return;
                }

                const response = await axios.get('https://namami-infotech.com/LIT/src/employee/list_employee.php', {
                    params: { Tenent_Id: user.tenent_id }
                });

                if (response.data.success) {
                    setEmployees(response.data.data);
                } else {
                    setError(response.data.message || 'Failed to fetch employee data');
                    setLoading(false);
                }
            } catch (error) {
                setError('Error fetching employee data. Please try again later.');
                console.error('Error:', error);
                setLoading(false);
            }
        };

        fetchEmployees();
    }, [user?.tenent_id]);

    useEffect(() => {
        if (employees.length > 0) {
            fetchLeaves();
        }
    }, [employees, fetchLeaves]);

    const handleChangePage = (event, newPage) => {
        setPage(newPage);
    };

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    const handleStatusChange = async (id, newStatus) => {
        try {
            const response = await axios.post('https://namami-infotech.com/LIT/src/leave/approve_leave.php', {
                id,
                status: newStatus
            });

            if (response.data.success) {
                setLeaves(leaves.map(leave =>
                    leave.Id === id ? { ...leave, Status: newStatus } : leave
                ));
            } else {
                setError(response.data.message || 'Failed to update leave status');
            }
        } catch (error) {
            setError('Error updating leave status. Please try again later.');
            console.error('Error:', error);
        }
    };

    const exportToCsv = () => {
        if (leaves.length === 0) {
            setError('No data to export');
            return;
        }

        const csvRows = [
            ['Employee Name', 'Start Date', 'End Date', 'Category', 'Reason', 'Status', 'Applied On']
        ];

        leaves.forEach((leave) => {
            const employee = employees.find(emp => emp.EmpId === leave.EmpId);
            const employeeName = employee ? employee.Name : 'Unknown';
            csvRows.push([
                employeeName,
                formatDate(leave.StartDate),
                formatDate(leave.EndDate),
                leave.Category || 'N/A',
                leave.Reason || 'N/A',
                leave.Status || 'Pending',
                formatDate(leave.CreatedAt)
            ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', `leaves_${new Date().toISOString().slice(0, 10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                <Typography color="error" variant="h6">{error}</Typography>
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
            <Button
                variant="contained"
                color="primary"
                onClick={exportToCsv}
                disabled={leaves.length === 0}
                sx={{ 
                    marginBottom: '16px', 
                    backgroundColor: "#CC7A00", 
                    float: "right",
                    '&:hover': { backgroundColor: "#E68A00" }
                }}
            >
                Export CSV
            </Button>

            <TableContainer component={Paper} sx={{ overflowX: 'auto', mt: 2 }}>
                <Table>
                    <TableHead sx={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Employee Name</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Date</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Category</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Reason</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Status</TableCell>
                            <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Applied on</TableCell>
                            {user?.role === 'HR' && <TableCell sx={{ color: "white", fontWeight: 'bold' }}>Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaves.length > 0 ? (
                            leaves
                                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                .map((leave) => {
                                    const employee = employees.find(emp => emp.EmpId === leave.EmpId);
                                    const employeeName = employee ? employee.Name : 'Unknown';

                                    return (
                                        <TableRow key={leave.Id} hover>
                                            <TableCell>{employeeName}</TableCell>
                                            <TableCell>
                                                {formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}
                                            </TableCell>
                                            <TableCell>{leave.Category || 'N/A'}</TableCell>
                                            <TableCell>{leave.Reason || 'N/A'}</TableCell>
                                            <TableCell>{leave.Status || 'Pending'}</TableCell>
                                            <TableCell>{formatDate(leave.CreatedAt)}</TableCell>
                                            {user?.role === 'HR' && (
                                                <TableCell>
                                                    <IconButton
                                                        color="success"
                                                        onClick={() => handleStatusChange(leave.Id, 'Approved')}
                                                        disabled={leave.Status === 'Approved' || leave.Status === 'Rejected'}
                                                        aria-label="approve"
                                                    >
                                                        <CheckIcon />
                                                    </IconButton>
                                                    <IconButton
                                                        color="error"
                                                        onClick={() => handleStatusChange(leave.Id, 'Rejected')}
                                                        disabled={leave.Status === 'Approved' || leave.Status === 'Rejected'}
                                                        aria-label="reject"
                                                    >
                                                        <CancelIcon />
                                                    </IconButton>
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
                                })
                        ) : (
                            <TableRow>
                                <TableCell colSpan={user?.role === 'HR' ? 7 : 6} align="center">
                                    <Typography variant="body1" color="textSecondary">
                                        No leave records found
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                    {leaves.length > 0 && (
                        <TableFooter>
                            <TableRow>
                                <TablePagination
                                    rowsPerPageOptions={[5, 10, 25]}
                                    count={leaves.length}
                                    rowsPerPage={rowsPerPage}
                                    page={page}
                                    onPageChange={handleChangePage}
                                    onRowsPerPageChange={handleChangeRowsPerPage}
                                />
                            </TableRow>
                        </TableFooter>
                    )}
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ViewLeave;