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
  TextField,
  Chip,
  Collapse,
} from "@mui/material"
import ArrowBackIcon from "@mui/icons-material/ArrowBack"
import { useParams } from "react-router-dom"
import axios from "axios"
import PaymentsIcon from "@mui/icons-material/Payments"
import ScheduleIcon from "@mui/icons-material/Schedule"
import ExpandMoreIcon from "@mui/icons-material/ExpandMore"
import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandLessIcon from "./ExpandLessIcon"
import PaymentDialog from "./PaymentDialog"
import TransactionDialog from "./TransactionDialog"
import { useAuth } from "../auth/AuthContext"

const StudentFeesTransaction = () => {
  const { user } = useAuth()
  const { studentId } = useParams()
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
  const [expandedCard, setExpandedCard] = useState(null)

  // Find first unpaid installment for variable fees
  const firstDueInstallment = feesData.find((fee) => !fee.Paid || fee.Paid === "0" || fee.Paid === "")

  // Get next payable installment (sequential payment logic)
  const getNextPayableInstallment = () => {
    const sortedFees = feesData
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
      .sort((a, b) => Number(a.installment) - Number(b.installment))

    // Find first unpaid or partially paid installment
    for (const fee of sortedFees) {
      const isPaid = fee.Paid && fee.Paid !== "0" && fee.Paid !== ""
      const feeStatus = transactionStatus[fee.id]

      if (!isPaid || (feeStatus && feeStatus.status === "partially_paid")) {
        return fee
      }
    }
    return null
  }

  const fetchStudentAndFees = async () => {
    try {
      setLoading(true)

      // Fetch student data
      const studentRes = await axios.get(
        `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`,
      )
      if (studentRes.data.success && studentRes.data.data) {
        setStudentData(studentRes.data.data)
      }

      // Fetch fees data
      const feesRes = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/get_student_fee_structure.php?StudentId=${studentId}`,
      )
      if (feesRes.data.success && feesRes.data.data) {
        const fees = feesRes.data.data
        setFeesData(fees)

        const statusMap = {}
        const transactionPromises = fees
          .filter((fee) => fee.Paid && fee.Paid !== "0" && fee.Paid !== "")
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

        // Sort transactions by date and determine final status
        Object.keys(statusMap).forEach((feeId) => {
          if (statusMap[feeId].transactions.length > 0) {
            statusMap[feeId].transactions.sort((a, b) => new Date(b.payment_date) - new Date(a.payment_date))
            const latestTransaction = statusMap[feeId].transactions[0]
            statusMap[feeId].status = latestTransaction.balance_amount > 0 ? "partially_paid" : "fully_paid"
            statusMap[feeId].currentBalance = latestTransaction.balance_amount
          }
        })

        setTransactionStatus(statusMap)
      }

      // Fetch variable fees
      const variableRes = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/variable.php?student_id=${studentId}`,
      )
      if (variableRes.data.success && variableRes.data.data) {
        const unpaidVariableFees = variableRes.data.data.filter((vf) => !vf.Paid || vf.Paid === "0" || vf.Paid === "")
        setVariableFees(unpaidVariableFees)
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
    fetchStudentAndFees()
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

  const handleCardExpand = (feeId) => {
    setExpandedCard(expandedCard === feeId ? null : feeId)
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

  const nextPayableInstallment = getNextPayableInstallment()
  const sortedFees = feesData
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
    .sort((a, b) => Number(a.installment) - Number(b.installment))

  return (
    <Box sx={{ p: 2, backgroundColor: "#fff" }}>
      {/* Student Info - Original Design */}
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

      {/* Fee Installments - Compact Design */}
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h5" fontWeight={700} color="#CC7A00" gutterBottom>
          Fee Installments
        </Typography>
        <Grid container spacing={2}>
          {sortedFees.map((fee) => {
            const baseTotal =
              Number(fee.tution_fees) +
              Number(fee.exam_fees) +
              Number(fee.hostel_fees) +
              Number(fee.admission_fees) +
              Number(fee.prospectus_fees) -
              Number(fee.Scholarship || 0)

            const isFirstUnpaidWithVariables = firstDueInstallment && fee.id === firstDueInstallment.id
            const variableTotal =
              isFirstUnpaidWithVariables && Array.isArray(variableFees)
                ? variableFees.reduce((sum, vf) => sum + Number(vf.amount), 0)
                : 0

            const total = baseTotal + variableTotal
            const isPaid = fee.Paid && fee.Paid !== "0" && fee.Paid !== ""

            let paymentStatus = "unpaid"
            let currentBalance = 0

            if (isPaid && transactionStatus[fee.id]) {
              const feeStatus = transactionStatus[fee.id]
              paymentStatus = feeStatus.status
              currentBalance = feeStatus.currentBalance || 0
            }

            // Check if this installment can be paid (sequential logic)
            const canPay = nextPayableInstallment && fee.id === nextPayableInstallment.id
            const isExpanded = expandedCard === fee.id

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
                          : canPay
                            ? "#F69320"
                            : "#e0e0e0"
                    }`,
                    borderRadius: 2,
                    opacity: canPay || paymentStatus !== "unpaid" ? 1 : 0.6,
                  }}
                >
                  <CardContent sx={{ flexGrow: 1, p: 2 }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <PaymentsIcon color="primary" />
                      <Typography
                        fontWeight={600}
                        color={
                          paymentStatus === "fully_paid"
                            ? "green"
                            : paymentStatus === "partially_paid"
                              ? "orange"
                              : canPay
                                ? "#F69320"
                                : "#9e9e9e"
                        }
                      >
                        Installment {fee.installment} – ₹{total}{" "}
                        {paymentStatus === "fully_paid"
                          ? "(Paid)"
                          : paymentStatus === "partially_paid"
                            ? "(Partially Paid)"
                            : canPay
                              ? "(Due)"
                              : "(Pending)"}
                      </Typography>
                    </Box>

                    <Button
                      size="small"
                      onClick={() => handleCardExpand(fee.id)}
                      endIcon={isExpanded ? <ExpandLess /> : <ExpandMoreIcon />}
                      sx={{ mb: 1, p: 0.5 }}
                    >
                      <Typography variant="body2">{isExpanded ? "Hide Details" : "View Details"}</Typography>
                    </Button>

                    <Collapse in={isExpanded}>
                      <Box sx={{ mt: 1 }}>
                        {fee.tution_fees != 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Tuition:</strong> ₹{Number(fee.tution_fees) - Number(fee.Scholarship || 0)}
                            {fee.Scholarship > 0 && (
                              <span style={{ color: "green" }}> (₹{fee.Scholarship} scholarship applied)</span>
                            )}
                          </Typography>
                        )}
                        {fee.exam_fees != 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Exam:</strong> ₹{fee.exam_fees}
                          </Typography>
                        )}
                        {fee.hostel_fees != 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Hostel:</strong> ₹{fee.hostel_fees}
                          </Typography>
                        )}
                        {fee.admission_fees != 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Admission:</strong> ₹{fee.admission_fees}
                          </Typography>
                        )}
                        {fee.prospectus_fees != 0 && (
                          <Typography variant="body2" sx={{ mb: 0.5 }}>
                            <strong>Prospectus:</strong> ₹{fee.prospectus_fees}
                          </Typography>
                        )}

                        {/* Variable Fees */}
                        {isFirstUnpaidWithVariables && variableFees.length > 0 && (
                          <Box mt={1}>
                            <Typography variant="body2" sx={{ mb: 0.5 }}>
                              <strong>Variable Fees:</strong> ₹{variableTotal}
                              <Chip label="Additional" size="small" color="warning" sx={{ ml: 1, height: 16 }} />
                            </Typography>
                            <Box sx={{ ml: 1, bgcolor: "#fff3cd", p: 1, borderRadius: 1, mt: 0.5 }}>
                              {variableFees.map((vf, i) => (
                                <Typography key={i} variant="caption" display="block">
                                  • {vf.particular}: ₹{vf.amount}
                                </Typography>
                              ))}
                            </Box>
                          </Box>
                        )}

                        <Box display="flex" alignItems="center" gap={1} mt={1}>
                          <ScheduleIcon fontSize="small" color="action" />
                          <Typography variant="body2">
                            <strong>Due Date:</strong> {fee.due_date}
                          </Typography>
                        </Box>
                      </Box>
                    </Collapse>
                  </CardContent>

                  {user && (user.role === "Accounts" || user.role === "Admin" || user.role === "Front Desk") && (
                    <Box p={2} pt={0}>
                      {/* Show transaction receipts if paid or partially paid */}
                      {paymentStatus !== "unpaid" && transactionStatus[fee.id]?.transactions?.length > 0 && (
                        <>
                          {transactionStatus[fee.id].transactions.map((transaction, index) => (
                            <Button
                              key={index}
                              variant="outlined"
                              fullWidth
                              size="small"
                              sx={{
                                color: transaction.balance_amount > 0 ? "orange" : "green",
                                borderColor: transaction.balance_amount > 0 ? "orange" : "green",
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
                              Receipt {index + 1} {transaction.balance_amount > 0 ? "(Partial)" : "(Full)"}
                            </Button>
                          ))}
                        </>
                      )}

                      {/* Pay Button - Only for next payable installment */}
                      {canPay && (
                        <Button
                          variant="contained"
                          fullWidth
                          sx={{
                            color: "white",
                            backgroundColor: "#F69320",
                            mt: paymentStatus !== "unpaid" ? 1 : 0,
                          }}
                          onClick={() => {
                            if (paymentStatus === "partially_paid" && currentBalance > 0) {
                              setSelectedFee({
                                ...fee,
                                balance_amount: currentBalance,
                              })
                            } else {
                              setSelectedFee(fee)
                            }
                            setDialogOpen(true)
                          }}
                        >
                          {paymentStatus === "partially_paid" && currentBalance > 0
                            ? `Pay Balance (₹${currentBalance})`
                            : "Pay Now"}
                        </Button>
                      )}

                      {/* Disabled Pay Button for Future Installments */}
                      {!canPay && paymentStatus === "unpaid" && (
                        <Button variant="outlined" fullWidth disabled sx={{ mt: 1 }}>
                          Pay Previous First
                        </Button>
                      )}

                      {/* Always show Edit button */}
                      {user && user.role === "Admin" && (
                        <Button variant="outlined" fullWidth sx={{ mt: 1 }} onClick={() => handleEditClick(fee)}>
                          Edit Structure
                        </Button>
                      )}
                    </Box>
                  )}
                </Card>
              </Grid>
            )
          })}
        </Grid>
      </Paper>

      {/* Dialogs remain the same */}
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
                  value={editFormData?.tution_fees || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, tution_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Exam Fees"
                  value={editFormData?.exam_fees || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, exam_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Hostel Fees"
                  value={editFormData?.hostel_fees || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, hostel_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admission Fees"
                  value={editFormData?.admission_fees || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, admission_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Prospectus Fees"
                  value={editFormData?.prospectus_fees || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, prospectus_fees: e.target.value })}
                  type="number"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Scholarship"
                  value={editFormData?.Scholarship || ""}
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
                  value={editFormData?.due_date || ""}
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
