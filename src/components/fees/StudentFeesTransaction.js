"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Button,
  Avatar,
  Card,
  CardContent,
  Grid,
  Dialog,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  TextField,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import axios from "axios"
import PaymentsIcon from "@mui/icons-material/Payments"
import ScheduleIcon from "@mui/icons-material/Schedule"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import TransactionDialog from "./TransactionDialog"
import PaymentDialog from "./PaymentDialog"
import { useParams } from "react-router-dom"

const StudentFeesTransaction = () => {
  const params = useParams()
  const studentId = params?.studentId
  const [studentData, setStudentData] = useState(null)
  const [feesData, setFeesData] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedFee, setSelectedFee] = useState(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [transactionData, setTransactionData] = useState(null)
  const [transactionDialogOpen, setTransactionDialogOpen] = useState(false)
  const [variableFees, setVariableFees] = useState([])
  const [transactionStatus, setTransactionStatus] = useState({})
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editFormData, setEditFormData] = useState(null)

  const firstDueInstallment = feesData.find((fee) => !fee.Paid)

  const fetchStudentAndFees = async () => {
    try {
      setLoading(true)

      const studentRes = await axios.get(
        `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`,
      )
      if (studentRes.data.success && studentRes.data.data) {
        setStudentData(studentRes.data.data)
      }

      const feesRes = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/get_student_fee_structure.php?StudentId=${studentId}`,
      )

      if (feesRes.data.success && feesRes.data.data) {
        const fees = feesRes.data.data
        setFeesData(fees)

        const statusMap = {}
        const transactionPromises = fees
          .filter((fee) => fee.Paid)
          .flatMap((fee) => {
            const transactionIds = fee.Paid.split(",").map((id) => id.trim())
            return transactionIds.map(async (transactionId) => {
              try {
                const res = await axios.get(
                  `https://namami-infotech.com/LIT/src/fees/get_fee_transaction.php?id=${transactionId}`,
                )
                if (res.data.success && res.data.data) {
                  if (!statusMap[fee.id]) {
                    statusMap[fee.id] = {
                      transactions: [],
                      status: "fully_paid",
                    }
                  }
                  statusMap[fee.id].transactions.push(res.data.data)
                }
              } catch (err) {
                console.error("Error fetching transaction:", err)
                if (!statusMap[fee.id]) {
                  statusMap[fee.id] = {
                    transactions: [],
                    status: "fully_paid",
                  }
                }
              }
            })
          })

        await Promise.all(transactionPromises)

        // Calculate proper payment status for each installment
        Object.keys(statusMap).forEach((feeId) => {
          const fee = fees.find((f) => f.id === feeId)
          if (fee) {
            const installmentTotal =
              Number(fee.tution_fees) +
              Number(fee.exam_fees) +
              Number(fee.hostel_fees) +
              Number(fee.admission_fees) +
              Number(fee.prospectus_fees) -
              Number(fee.Scholarship || 0)

            // Add variable fees if this is the first due installment
            const variableTotal =
              fee.id === firstDueInstallment?.id && Array.isArray(variableFees)
                ? variableFees.reduce((sum, vf) => sum + Number(vf.amount), 0)
                : 0

            const totalAmount = installmentTotal + variableTotal

            // Calculate total paid across all transactions
            const totalPaid = statusMap[feeId].transactions.reduce(
              (sum, transaction) => sum + Number(transaction.deposit_amount || 0),
              0,
            )

            // Calculate remaining balance
            const remainingBalance = totalAmount - totalPaid

            // Update status based on payment completion
            if (remainingBalance <= 0) {
              statusMap[feeId].status = "fully_paid"
              statusMap[feeId].remainingBalance = 0
            } else {
              statusMap[feeId].status = "partially_paid"
              statusMap[feeId].remainingBalance = remainingBalance
            }

            statusMap[feeId].totalPaid = totalPaid
            statusMap[feeId].totalAmount = totalAmount
          }
        })

        setTransactionStatus(statusMap)
      }

      const variableRes = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/variable.php?student_id=${studentId}`,
      )
      if (variableRes.data.success) {
        setVariableFees(variableRes.data.data)
      }
    } catch (err) {
      console.error("Error fetching data:", err)
      alert("Failed to fetch student or fee data.")
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactionData = async (transactionId) => {
    try {
      const res = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/get_fee_transaction.php?id=${transactionId}`,
      )
      if (res.data.success && res.data.data) {
        setTransactionData(res.data.data)
        setTransactionDialogOpen(true)
      }
    } catch (err) {
      console.error("Error fetching transaction data:", err)
      alert("Failed to fetch transaction data.")
    }
  }

  useEffect(() => {
    if (studentId) {
      fetchStudentAndFees()
    }
  }, [studentId])

  const handleOpenDialog = (fee) => {
    setSelectedFee(fee)
    setDialogOpen(true)
  }

  const handleEditClick = (fee) => {
    setEditFormData({
      id: fee.id,
      StudentId: studentId,
      installment: fee.installment,
      tution_fees: fee.tution_fees,
      exam_fees: fee.exam_fees,
      hostel_fees: fee.hostel_fees,
      admission_fees: fee.admission_fees,
      prospectus_fees: fee.prospectus_fees,
      Scholarship: fee.Scholarship,
      Paid: 0,
      Total_variable: fee.Total_variable || "0",
      due_date: fee.due_date,
    })
    setEditDialogOpen(true)
  }

  const handleEditSubmit = async () => {
    try {
      setLoading(true)
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/edit_student_fee_structure.php",
        editFormData,
      )

      if (response.data.success) {
        alert("Fee structure updated successfully!")
        fetchStudentAndFees()
        setEditDialogOpen(false)
      } else {
        alert(response.data.message || "Failed to update fee structure")
      }
    } catch (error) {
      console.error("Error updating fee structure:", error)
      alert("An error occurred while updating the fee structure")
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <CircularProgress sx={{ mt: 5 }} />

  if (!studentData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Student not found.
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{ p: 2, backgroundColor: "#fff" }}>
      {/* Student Info */}
      <Paper
        sx={{
          p: 4,
          mb: 3,
          borderRadius: 3,
          boxShadow: 4,
          position: "relative",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: "#f9f9f9",
        }}
      >
        <Button onClick={() => window.history.back()} sx={{ position: "absolute", top: 5, left: -6 }}>
          <ArrowBackIcon />
        </Button>

        <Avatar
          src={studentData.Photo}
          alt={studentData.CandidateName}
          sx={{ width: 120, height: 120, borderRadius: "8px", marginLeft: 3 }}
        />

        <Box sx={{ flex: 1, marginLeft: 3 }}>
          <Typography variant="h5" fontWeight={700} color="#CC7A00" gutterBottom>
            {studentData.CandidateName}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            <strong>Course:</strong> {studentData.Course}
          </Typography>
          <Typography variant="subtitle1" color="textSecondary">
            <strong>Student Id:</strong> {studentId}
          </Typography>
        </Box>
      </Paper>

      {/* Fee Installments */}
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h5" fontWeight={700} color="#CC7A00" gutterBottom>
          Fee Installments
        </Typography>

        <Grid container spacing={2}>
          {feesData
            .filter((fee) => {
              return (
                Number(fee.tution_fees) !== 0 ||
                Number(fee.exam_fees) !== 0 ||
                Number(fee.hostel_fees) !== 0 ||
                Number(fee.admission_fees) !== 0 ||
                Number(fee.prospectus_fees) !== 0 ||
                Number(fee.Scholarship) !== 0
              )
            })
            .map((fee) => {
              const baseTotal =
                Number(fee.tution_fees) +
                Number(fee.exam_fees) +
                Number(fee.hostel_fees) +
                Number(fee.admission_fees) +
                Number(fee.prospectus_fees) -
                Number(fee.Scholarship || 0)

              const variableTotal =
                fee.id === firstDueInstallment?.id && Array.isArray(variableFees)
                  ? variableFees.reduce((sum, vf) => sum + Number(vf.amount), 0)
                  : 0

              const total = baseTotal + variableTotal
              const isPaid = fee.Paid && fee.Paid !== "0"

              // Get payment status from our calculated transaction status
              let paymentStatus = "unpaid"
              let remainingBalance = total

              if (isPaid && transactionStatus[fee.id]) {
                paymentStatus = transactionStatus[fee.id].status
                remainingBalance = transactionStatus[fee.id].remainingBalance || 0
              }

              return (
                <Grid item xs={12} sm={6} md={3} key={fee.id}>
                  <Card
                    sx={{
                      backgroundColor: "#fefefe",
                      height: "100%",
                      display: "flex",
                      flexDirection: "column",
                      border: `2px solid ${
                        paymentStatus === "fully_paid"
                          ? "green"
                          : paymentStatus === "partially_paid"
                            ? "orange"
                            : "#F69320"
                      }`,
                      borderRadius: 2,
                    }}
                  >
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1}>
                        <PaymentsIcon color="primary" />
                        <Typography
                          fontWeight={600}
                          color={
                            paymentStatus === "fully_paid"
                              ? "green"
                              : paymentStatus === "partially_paid"
                                ? "orange"
                                : "#F69320"
                          }
                        >
                          Installment {fee.installment} – ₹{total}{" "}
                          {paymentStatus === "fully_paid"
                            ? "(Paid)"
                            : paymentStatus === "partially_paid"
                              ? "(Partially Paid)"
                              : "(Due)"}
                        </Typography>
                      </Box>

                      <Accordion>
                        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                          <Typography variant="body2">View Details</Typography>
                        </AccordionSummary>
                        <AccordionDetails>
                          {fee.tution_fees != 0 && (
                            <Typography variant="body2">
                              <strong>Tuition:</strong> ₹{fee.tution_fees}
                            </Typography>
                          )}
                          {fee.exam_fees != 0 && (
                            <Typography variant="body2">
                              <strong>Exam:</strong> ₹{fee.exam_fees}
                            </Typography>
                          )}
                          {fee.hostel_fees != 0 && (
                            <Typography variant="body2">
                              <strong>Hostel:</strong> ₹{fee.hostel_fees}
                            </Typography>
                          )}
                          {fee.admission_fees != 0 && (
                            <Typography variant="body2">
                              <strong>Admission:</strong> ₹{fee.admission_fees}
                            </Typography>
                          )}
                          {fee.prospectus_fees != 0 && (
                            <Typography variant="body2">
                              <strong>Prospectus:</strong> ₹{fee.prospectus_fees}
                            </Typography>
                          )}
                          {fee.Scholarship != 0 && (
                            <Typography variant="body2">
                              <strong>Scholarship:</strong> ₹{fee.Scholarship}
                            </Typography>
                          )}
                          {fee.id === firstDueInstallment?.id && variableFees.length > 0 && (
                            <Box mt={1}>
                              <Typography>
                                <strong>Additional Variable Charges:</strong>
                              </Typography>
                              {variableFees.map((vf, i) => (
                                <Typography key={i} variant="body2">
                                  {vf.particular}: ₹{vf.amount}
                                </Typography>
                              ))}
                            </Box>
                          )}
                          <Box display="flex" alignItems="center" gap={1} mt={1}>
                            <ScheduleIcon fontSize="small" color="action" />
                            <Typography variant="body2">
                              <strong>Due Date:</strong> {fee.due_date}
                            </Typography>
                          </Box>

                          {/* Show payment summary for paid/partially paid installments */}
                          
                        </AccordionDetails>
                      </Accordion>
                    </CardContent>

                    <Box p={2}>
                      {/* Show transaction receipts if paid or partially paid */}
                      {paymentStatus !== "unpaid" && transactionStatus[fee.id]?.transactions?.length > 0 && (
                        <>
                          {transactionStatus[fee.id].transactions.map((transaction, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              fullWidth
                              sx={{
                                color: "green",
                                borderColor: "green",
                                mb: index < transactionStatus[fee.id].transactions.length - 1 ? 1 : 0,
                              }}
                              onClick={() => {
                                setTransactionData({
                                  ...transaction,
                                  receiptIndex: index + 1,
                                  totalReceipts: transactionStatus[fee.id].transactions.length,
                                })
                                setTransactionDialogOpen(true)
                              }}
                            >
                              Receipt {index + 1} (₹{transaction.deposit_amount})
                            </Button>
                          ))}
                        </>
                      )}

                      {/* Show Pay Now or Pay Balance button only if not fully paid */}
                      {paymentStatus !== "fully_paid" && (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            color: "white",
                            backgroundColor: "#F69320",
                            mt: paymentStatus !== "unpaid" ? 1 : 0,
                          }}
                          onClick={() => {
                            if (paymentStatus === "partially_paid") {
                              setSelectedFee({
                                ...fee,
                                balance_amount: remainingBalance,
                              })
                            } else {
                              setSelectedFee(fee)
                            }
                            setDialogOpen(true)
                          }}
                        >
                          {paymentStatus === "partially_paid" ? `Pay Balance (₹${remainingBalance})` : "Pay Now"}
                        </Button>
                      )}

                      {/* Always show Edit button */}
                      <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => handleEditClick(fee)}>
                        Edit Structure
                      </Button>
                    </Box>
                  </Card>
                </Grid>
              )
            })}
        </Grid>
      </Paper>

      {/* Transaction Dialog */}
      {transactionData && (
        <TransactionDialog
          student={studentData}
          open={transactionDialogOpen}
          transactionData={transactionData}
          onClose={() => {
            setTransactionDialogOpen(false)
            setTransactionData(null)
          }}
        />
      )}

      {/* Payment Dialog */}
      {selectedFee && (
        <PaymentDialog
          open={dialogOpen}
          feeData={selectedFee}
          variableFees={variableFees}
          firstDueInstallment={firstDueInstallment}
          onClose={(shouldRefresh) => {
            setDialogOpen(false)
            setSelectedFee(null)
            if (shouldRefresh) fetchStudentAndFees()
          }}
          student={studentData}
        />
      )}

      {/* Edit Dialog */}
      {editDialogOpen && (
        <Dialog open={editDialogOpen} onClose={() => setEditDialogOpen(false)} maxWidth="sm" fullWidth>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Edit Fee Structure
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Tuition Fees"
                  value={editFormData.tution_fees}
                  onChange={(e) => setEditFormData({ ...editFormData, tution_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exam Fees"
                  value={editFormData.exam_fees}
                  onChange={(e) => setEditFormData({ ...editFormData, exam_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hostel Fees"
                  value={editFormData.hostel_fees}
                  onChange={(e) => setEditFormData({ ...editFormData, hostel_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admission Fees"
                  value={editFormData.admission_fees}
                  onChange={(e) => setEditFormData({ ...editFormData, admission_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prospectus Fees"
                  value={editFormData.prospectus_fees}
                  onChange={(e) => setEditFormData({ ...editFormData, prospectus_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scholarship"
                  value={editFormData.Scholarship}
                  onChange={(e) => setEditFormData({ ...editFormData, Scholarship: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={editFormData.due_date}
                  onChange={(e) => setEditFormData({ ...editFormData, due_date: e.target.value })}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end", gap: 2 }}>
              <Button onClick={() => setEditDialogOpen(false)} variant="outlined">
                Cancel
              </Button>
              <Button onClick={handleEditSubmit} variant="contained" color="primary" disabled={loading}>
                {loading ? <CircularProgress size={24} /> : "Save Changes"}
              </Button>
            </Box>
          </Box>
        </Dialog>
      )}
    </Box>
  )
}

export default StudentFeesTransaction
