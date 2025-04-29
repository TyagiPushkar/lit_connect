import React, { useState, useEffect } from 'react';
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
        const date = new Date(dateString);
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    };

    useEffect(() => {
    const fetchEmployees = async () => {
        try {
            const response = await axios.get('https://namami-infotech.com/LIT/src/employee/list_employee.php', {
                params: { Tenent_Id: user.tenent_id }
            });

            if (response.data.success) {
                setEmployees(response.data.data);
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError('Error fetching employee data');
            console.error('Error:', error);
        }
    };

    fetchEmployees();
}, [user.tenent_id]); // Only runs when `user.tenent_id` changes


     useEffect(() => {
      if (employees.length > 0) {
        fetchLeaves();
      }
    }, [user.emp_id]); 

 const fetchLeaves = async () => {
            if (!user || !user.emp_id) {
                setError('User is not authenticated');
                setLoading(false);
                return;
            }

            try {
                const params = user.role === 'Teacher' ? { role: "Teacher" } : { empId: user.emp_id };
                const response = await axios.get('https://namami-infotech.com/LIT/src/leave/get_leave.php', { params });

                if (response.data.success) {
                    const filteredLeaves = response.data.data.filter(leave => 
                        employees.some(emp => emp.EmpId === leave.EmpId)
                    );
                    setLeaves(filteredLeaves);
                } else {
                    setError(response.data.message);
                }
            } catch (error) {
                setError('Error fetching leave data');
                console.error('Error:', error);
            } finally {
                setLoading(false);
            }
        };

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
                fetchLeaves()
            } else {
                setError(response.data.message);
            }
        } catch (error) {
            setError('Error updating leave status');
            console.error('Error:', error);
        }
    };

    const exportToCsv = () => {
        const csvRows = [
            ['Employee Name', 'Start Date', 'End Date', 'Reason', 'Status']
        ];

        leaves.forEach(({ EmpId, StartDate, EndDate, Reason, Status }) => {
            const employee = employees.find(emp => emp.EmpId === EmpId);
            const employeeName = employee ? employee.Name : 'Unknown';
            csvRows.push([
                employeeName,
                formatDate(StartDate),
                formatDate(EndDate),
                Reason,
                Status
            ]);
        });

        const csvContent = csvRows.map(row => row.join(',')).join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.href = url;
        link.setAttribute('download', 'leaves.csv');
        link.click();
        URL.revokeObjectURL(url);
    };

    if (loading) return <CircularProgress />;
    if (error) return <Typography color="error">{error}</Typography>;

    return (
        <Box>
            <Button
                variant="contained"
                color="primary"
                onClick={exportToCsv}
                style={{ marginBottom: '16px', backgroundColor: "#CC7A00", float: "right" }}
            >
                Export CSV
            </Button>
            <TableContainer component={Paper} style={{ overflowX: 'auto' }}>
                <Table>
                    <TableHead style={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell style={{ color: "white" }}>Employee Name</TableCell>
                            <TableCell style={{ color: "white" }}>Date</TableCell>
                            <TableCell style={{ color: "white" }}>Category</TableCell>
                            <TableCell style={{ color: "white" }}>Reason</TableCell>
                            <TableCell style={{ color: "white" }}>Status</TableCell>
                            <TableCell style={{ color: "white" }}>Applied on</TableCell>
                            {user.role === 'HR' && <TableCell style={{ color: "white" }}>Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {leaves
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((leave) => {
                                const employee = employees.find(emp => emp.EmpId === leave.EmpId);
                                const employeeName = employee ? employee.Name : 'Unknown';

                                return (
                                    <TableRow key={leave.Id}>
                                        <TableCell>{employeeName}</TableCell>
                                        <TableCell>{formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}</TableCell>
                                        <TableCell>{leave.Category}</TableCell>
                                        <TableCell>{leave.Reason}</TableCell>
                                        <TableCell>{leave.Status}</TableCell>
                                         <TableCell>{leave.CreatedAt}</TableCell>
                                        {user.role === 'HR' && (
                                            <TableCell>
                                                <IconButton
                                                    color="primary"
                                                    onClick={() => handleStatusChange(leave.Id, 'Approved')}
                                                    disabled={leave.Status === 'Approved' || leave.Status === 'Rejected'}
                                                >
                                                    <CheckIcon />
                                                </IconButton>
                                                <IconButton
                                                    color="secondary"
                                                    onClick={() => handleStatusChange(leave.Id, 'Rejected')}
                                                    disabled={leave.Status === 'Approved' || leave.Status === 'Rejected'}
                                                >
                                                    <CancelIcon />
                                                </IconButton>
                                            </TableCell>
                                        )}
                                    </TableRow>
                                );
                            })}
                    </TableBody>
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
                </Table>
            </TableContainer>
        </Box>
    );
}

export default ViewLeave;
