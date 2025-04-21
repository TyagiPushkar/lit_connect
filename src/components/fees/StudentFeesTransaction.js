import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead,
    TableRow, Paper, Typography, CircularProgress, Snackbar, Avatar, Box,
    Card, CardContent, Grid, Dialog, DialogTitle, DialogContent, DialogActions, Button
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';

const StudentFeesTransaction = () => {
    const { studentId } = useParams();
    const [student, setStudent] = useState(null);
    const [feeStructure, setFeeStructure] = useState([]);
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [snackbar, setSnackbar] = useState({ open: false, message: '' });

    const [selectedTransaction, setSelectedTransaction] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);

    useEffect(() => {
        fetchStudentData();
    }, [studentId]);

    const fetchStudentData = async () => {
        try {
            const res = await axios.get(`https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`);
            if (res.data.success) {
                setStudent(res.data.data);
                fetchFeeStructure(res.data.data.Course);
            } else {
                setSnackbar({ open: true, message: res.data.message });
                setLoading(false);
            }
        } catch {
            setSnackbar({ open: true, message: 'Failed to fetch student data.' });
            setLoading(false);
        }
    };

    const fetchFeeStructure = async (course) => {
        try {
            const res = await axios.get(`https://namami-infotech.com/LIT/src/fees/get_student_fee_structure.php?StudentId=${studentId}`);
            if (res.data.success) {
                setFeeStructure(res.data.data);
                fetchTransactions();
            } else {
                setSnackbar({ open: true, message: 'Failed to fetch fee structure.' });
                setLoading(false);
            }
        } catch {
            setSnackbar({ open: true, message: 'Failed to fetch fee structure.' });
            setLoading(false);
        }
    };

    const fetchTransactions = async () => {
        try {
            const res = await axios.get(`https://namami-infotech.com/LIT/src/fees/get_transaction_by_stuid.php?stu_id=${studentId}`);
            if (res.data.success) {
                setTransactions(res.data.data);
            } else {
                setSnackbar({ open: true, message: res.data.message });
            }
        } catch {
            setSnackbar({ open: true, message: 'Failed to fetch transactions.' });
        } finally {
            setLoading(false);
        }
    };

    const handleShowTransaction = (txn) => {
        setSelectedTransaction(txn);
        setDialogOpen(true);
    };

    const handleSubmitTransaction = (fee) => {
        alert(`Submit fee for installment: ${fee.installment}`);
    };

    const handleCloseDialog = () => {
        setDialogOpen(false);
        setSelectedTransaction(null);
    };

    return (
        <div>
            {loading ? (
                <CircularProgress />
            ) : (
                <>
                    {student ? (
                        <>
                            <Card sx={{ mb: 3, p: 2, display: 'flex', alignItems: 'center', boxShadow: 3 }}>
                                <Avatar
                                    src={`https://namami-infotech.com/LIT/uploads/${student.Photo}`}
                                    alt="Student Photo"
                                    sx={{ width: 80, height: 80, mr: 3 }}
                                />
                                <CardContent sx={{ flexGrow: 1 }}>
                                    <Typography variant="h6" gutterBottom color="primary">
                                        {student.CandidateName} ({student.StudentID})
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" fontWeight="bold">Course</Typography>
                                            <Typography variant="body1">{student.Course}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" fontWeight="bold">Session</Typography>
                                            <Typography variant="body1">{student.Session}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" fontWeight="bold">Contact</Typography>
                                            <Typography variant="body1">{student.StudentContactNo}</Typography>
                                        </Grid>
                                        <Grid item xs={12} sm={6} md={3}>
                                            <Typography variant="body2" fontWeight="bold">Email</Typography>
                                            <Typography variant="body1">{student.Email || '-'}</Typography>
                                        </Grid>
                                    </Grid>
                                </CardContent>
                            </Card>

                            <Typography variant="h6" gutterBottom>Fee Structure</Typography>
                            {feeStructure.length > 0 ? (
                                <TableContainer component={Paper} style={{ marginBottom: '1rem' }}>
                                    <Table>
                                        <TableHead style={{ backgroundColor: '#CC7A00' }}>
                                            <TableRow>
                                                <TableCell style={{ color: 'white' }}>Installment</TableCell>
                                                <TableCell style={{ color: 'white' }}>Tuition Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Exam Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Hostel Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Admission Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Prospectus Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Due Date</TableCell>
                                                <TableCell style={{ color: 'white' }}>Action</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {feeStructure.map((fee, index) => {
                                                const matchingTxn = transactions.find(txn => txn.installment === fee.installment);
                                                return (
                                                    <TableRow key={index}>
                                                        <TableCell>{fee.installment}</TableCell>
                                                        <TableCell>{fee.tution_fees}</TableCell>
                                                        <TableCell>{fee.exam_fees}</TableCell>
                                                        <TableCell>{fee.hostel_fees}</TableCell>
                                                        <TableCell>{fee.admission_fees}</TableCell>
                                                        <TableCell>{fee.prospectus_fees}</TableCell>
                                                        <TableCell>{fee.due_date || '-'}</TableCell>
                                                        <TableCell>
                                                            {matchingTxn ? (
                                                                <Button variant="outlined" onClick={() => handleShowTransaction(matchingTxn)}>
                                                                    Show
                                                                </Button>
                                                            ) : (
                                                                <Button variant="contained" color="success" onClick={() => handleSubmitTransaction(fee)}>
                                                                    Submit
                                                                </Button>
                                                            )}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography>No fee structure found for this course.</Typography>
                            )}

                            <Typography variant="h6" gutterBottom>Fee Transactions</Typography>
                            {transactions.length > 0 ? (
                                <TableContainer component={Paper}>
                                    <Table>
                                        <TableHead style={{ backgroundColor: '#CC7A00' }}>
                                            <TableRow>
                                                <TableCell style={{ color: 'white' }}>Installment</TableCell>
                                                <TableCell style={{ color: 'white' }}>Tuition Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Exam Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Hostel Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Admission Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Prospectus Fees</TableCell>
                                                <TableCell style={{ color: 'white' }}>Mode</TableCell>
                                                <TableCell style={{ color: 'white' }}>Mode ID</TableCell>
                                                <TableCell style={{ color: 'white' }}>Total</TableCell>
                                                <TableCell style={{ color: 'white' }}>Paid</TableCell>
                                                <TableCell style={{ color: 'white' }}>Balance</TableCell>
                                                <TableCell style={{ color: 'white' }}>Date</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {transactions.map((txn, idx) => (
                                                <TableRow key={idx}>
                                                    <TableCell>{txn.installment}</TableCell>
                                                    <TableCell>{txn.tuition_fees}</TableCell>
                                                    <TableCell>{txn.exam_fees}</TableCell>
                                                    <TableCell>{txn.hostel_fees}</TableCell>
                                                    <TableCell>{txn.admission_fees}</TableCell>
                                                    <TableCell>{txn.prospectus_fees}</TableCell>
                                                    <TableCell>{txn.mode}</TableCell>
                                                    <TableCell>{txn.mode_id}</TableCell>
                                                    <TableCell>{txn.total_amount}</TableCell>
                                                    <TableCell>{txn.deposit_amount}</TableCell>
                                                    <TableCell>{txn.balance_amount}</TableCell>
                                                    <TableCell>{txn.date_time}</TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            ) : (
                                <Typography>No fee transactions found for this student.</Typography>
                            )}
                        </>
                    ) : (
                        <Typography>No student data found.</Typography>
                    )}
                </>
            )}

            <Snackbar
                open={snackbar.open}
                autoHideDuration={6000}
                onClose={() => setSnackbar({ open: false, message: '' })}
                message={snackbar.message}
            />

            <Dialog open={dialogOpen} onClose={handleCloseDialog}>
                <DialogTitle>Transaction Details</DialogTitle>
                <DialogContent dividers>
                    {selectedTransaction && (
                        <>
                            <Typography>Installment: {selectedTransaction.installment}</Typography>
                            <Typography>Tuition Fees: {selectedTransaction.tuition_fees}</Typography>
                            <Typography>Exam Fees: {selectedTransaction.exam_fees}</Typography>
                            <Typography>Hostel Fees: {selectedTransaction.hostel_fees}</Typography>
                            <Typography>Admission Fees: {selectedTransaction.admission_fees}</Typography>
                            <Typography>Prospectus Fees: {selectedTransaction.prospectus_fees}</Typography>
                            <Typography>Mode: {selectedTransaction.mode}</Typography>
                            <Typography>Mode ID: {selectedTransaction.mode_id}</Typography>
                            <Typography>Total: {selectedTransaction.total_amount}</Typography>
                            <Typography>Paid: {selectedTransaction.deposit_amount}</Typography>
                            <Typography>Balance: {selectedTransaction.balance_amount}</Typography>
                            <Typography>Date: {selectedTransaction.date_time}</Typography>
                        </>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseDialog}>Close</Button>
                </DialogActions>
            </Dialog>
        </div>
    );
};

export default StudentFeesTransaction;
