"use client"

import React, { useState, useEffect } from "react"
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  MenuItem,
  Typography,
  Box,
  Alert,
  Grid,
  Divider,
  CircularProgress,
  Card,
  CardContent,
  Chip,
  Tooltip,
  IconButton,
} from "@mui/material"
import axios from "axios"
import CloseIcon from '@mui/icons-material/Close';
import { useAuth } from "../auth/AuthContext";

const PaymentDialog = ({ open, onClose, feeData, student, variableFees, firstDueInstallment }) => {
  const {user}=useAuth()
  const [mode, setMode] = useState("Cash")
  const [modeId, setModeId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [remarks, setRemarks] = useState("")
  const [existingPayments, setExistingPayments] = useState(null)
  const [writeOffConfirm, setWriteOffConfirm] = useState({
    open: false,
    variableFee: null,
  })

  // Set today's date as default payment date
  const today = new Date().toISOString().split("T")[0]
  const [paymentDate, setPaymentDate] = useState(today)

  // Reset states when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSuccessMsg("")
      setErrorMsg("")
      setExistingPayments(null)
      if (student?.StudentID && feeData?.installment) {
        fetchExistingTransactions()
      }
    }
  }, [open, student?.StudentID, feeData?.installment])

  const fetchExistingTransactions = async () => {
    setLoading(true)
    setErrorMsg("")
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/get_transaction_by_stuid.php?stu_id=${student.StudentID}`,
      )

      console.log("API Response:", response.data)

      if (response.data.success && response.data.data) {
        const currentInstallmentPayments = response.data.data.filter(
          (transaction) => Number(transaction.installment) === Number(feeData.installment),
        )

        console.log("Current installment payments:", currentInstallmentPayments)

        if (currentInstallmentPayments.length > 0) {
          const totalPaid = currentInstallmentPayments.reduce(
            (acc, payment) => ({
              tuition_fees: acc.tuition_fees + Number(payment.tuition_fees || 0),
              exam_fees: acc.exam_fees + Number(payment.exam_fees || 0),
              hostel_fees: acc.hostel_fees + Number(payment.hostel_fees || 0),
              admission_fees: acc.admission_fees + Number(payment.admission_fees || 0),
              prospectus_fees: acc.prospectus_fees + Number(payment.prospectus_fees || 0),
              variable_fees: acc.variable_fees + Number(payment.variable_fees || 0),
            }),
            {
              tuition_fees: 0,
              exam_fees: 0,
              hostel_fees: 0,
              admission_fees: 0,
              prospectus_fees: 0,
              variable_fees: 0,
            },
          )

          console.log("Total paid amounts:", totalPaid)
          setExistingPayments(totalPaid)
        } else {
          setExistingPayments({
            tuition_fees: 0,
            exam_fees: 0,
            hostel_fees: 0,
            admission_fees: 0,
            prospectus_fees: 0,
            variable_fees: 0,
          })
        }
      } else {
        setExistingPayments({
          tuition_fees: 0,
          exam_fees: 0,
          hostel_fees: 0,
          admission_fees: 0,
          prospectus_fees: 0,
          variable_fees: 0,
        })
      }
    } catch (error) {
      console.error("Error fetching existing transactions:", error)
      setErrorMsg("Error loading existing payment data")
      setExistingPayments({
        tuition_fees: 0,
        exam_fees: 0,
        hostel_fees: 0,
        admission_fees: 0,
        prospectus_fees: 0,
        variable_fees: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  // Calculate base totals (original amounts for this installment)
  const baseTotals = React.useMemo(() => {
    return {
      tution_fees: Number(feeData?.tution_fees || 0) - Number(feeData?.Scholarship || 0),
      exam_fees: Number(feeData?.exam_fees || 0),
      hostel_fees: Number(feeData?.hostel_fees || 0),
      admission_fees: Number(feeData?.admission_fees || 0),
      prospectus_fees: Number(feeData?.prospectus_fees || 0),
    }
  }, [feeData])

  // Calculate variable fees totals for this installment
  const variableFeesTotals = React.useMemo(() => {
    const shouldIncludeVariableFees =
      firstDueInstallment &&
      feeData?.id === firstDueInstallment.id &&
      Array.isArray(variableFees) &&
      variableFees.length > 0

    if (!shouldIncludeVariableFees) return {}

    const totals = {}
    variableFees.forEach((vf) => {
      const key = `variable_${vf.id}`
      totals[key] = Number(vf.amount || 0)
    })

    console.log("Variable fees totals:", totals)
    return totals
  }, [feeData, variableFees, firstDueInstallment])

  // Combine all fee totals
  const allFeeTotals = React.useMemo(() => {
    return { ...baseTotals, ...variableFeesTotals }
  }, [baseTotals, variableFeesTotals])

  // Calculate remaining amounts after existing payments
  const remainingAmounts = React.useMemo(() => {
    if (!existingPayments) return allFeeTotals

    const remaining = {
      tution_fees: Math.max(0, baseTotals.tution_fees - existingPayments.tuition_fees),
      exam_fees: Math.max(0, baseTotals.exam_fees - existingPayments.exam_fees),
      hostel_fees: Math.max(0, baseTotals.hostel_fees - existingPayments.hostel_fees),
      admission_fees: Math.max(0, baseTotals.admission_fees - existingPayments.admission_fees),
      prospectus_fees: Math.max(0, baseTotals.prospectus_fees - existingPayments.prospectus_fees),
    }

    // For variable fees, we need to check individual payment status
    const totalVariablePaid = existingPayments.variable_fees || 0
    let remainingVariableAmount = Object.values(variableFeesTotals).reduce((sum, val) => sum + val, 0) - totalVariablePaid

    // Distribute remaining variable amount proportionally
    Object.keys(variableFeesTotals).forEach((key) => {
      const originalAmount = variableFeesTotals[key]
      const totalOriginalVariable = Object.values(variableFeesTotals).reduce((sum, val) => sum + val, 0)
      
      if (totalOriginalVariable > 0 && remainingVariableAmount > 0) {
        remaining[key] = Math.max(0, Math.min(originalAmount, (originalAmount / totalOriginalVariable) * remainingVariableAmount))
      } else {
        remaining[key] = totalVariablePaid >= totalOriginalVariable ? 0 : originalAmount
      }
    })

    console.log("Base totals:", baseTotals)
    console.log("Variable totals:", variableFeesTotals)
    console.log("Existing payments:", existingPayments)
    console.log("Remaining amounts:", remaining)

    return remaining
  }, [baseTotals, variableFeesTotals, existingPayments])

  // Initialize payments state with full remaining amounts as default
  const [payments, setPayments] = useState(() => {
    const initialPayments = {
      tution_fees: 0,
      exam_fees: 0,
      hostel_fees: 0,
      admission_fees: 0,
      prospectus_fees: 0,
    }

    // Add variable fee payment fields
    if (variableFees && Array.isArray(variableFees)) {
      variableFees.forEach((vf) => {
        initialPayments[`variable_${vf.id}`] = 0
      })
    }

    return initialPayments
  })

  // Update payments with full remaining amounts when data is loaded
  useEffect(() => {
    if (existingPayments && remainingAmounts) {
      setPayments(remainingAmounts)
    }
  }, [existingPayments, remainingAmounts])

  // Update payments when variable fees change
  useEffect(() => {
    if (variableFees && Array.isArray(variableFees)) {
      setPayments((prev) => {
        const newPayments = { ...prev }
        variableFees.forEach((vf) => {
          const key = `variable_${vf.id}`
          if (!(key in newPayments)) {
            newPayments[key] = remainingAmounts[key] || 0
          }
        })
        return newPayments
      })
    }
  }, [variableFees, remainingAmounts])

  // Calculate totals
  const totalOriginalAmount = React.useMemo(
    () => Object.values(allFeeTotals).reduce((sum, val) => sum + val, 0),
    [allFeeTotals],
  )

  const totalAlreadyPaid = React.useMemo(
    () => (existingPayments ? Object.values(existingPayments).reduce((sum, val) => sum + val, 0) : 0),
    [existingPayments],
  )

  const totalRemainingAmount = React.useMemo(
    () => Object.values(remainingAmounts).reduce((sum, val) => sum + val, 0),
    [remainingAmounts],
  )

  const totalCurrentPayment = React.useMemo(
    () => Object.values(payments).reduce((sum, val) => sum + val, 0),
    [payments],
  )

  const totalFinalBalance = React.useMemo(
    () => totalRemainingAmount - totalCurrentPayment,
    [totalRemainingAmount, totalCurrentPayment],
  )

  const handlePaymentChange = (feeType, value) => {
    const maxAmount = remainingAmounts[feeType] || 0
    const numValue = Math.min(Number(value) || 0, maxAmount)
    setPayments((prev) => ({
      ...prev,
      [feeType]: Math.max(0, numValue),
    }))
  }

  const handleSubmit = async () => {
    if (totalCurrentPayment <= 0) {
      setErrorMsg("Please enter a payment amount greater than 0")
      return
    }

    if (mode !== "Cash" && !modeId.trim()) {
      setErrorMsg("Please enter a transaction/reference ID")
      return
    }

    setSubmitting(true)
    setSuccessMsg("")
    setErrorMsg("")

    try {
      // Calculate total variable fees payment
      const totalVariableFeesPayment = Object.keys(payments)
        .filter((key) => key.startsWith("variable_"))
        .reduce((sum, key) => sum + (payments[key] || 0), 0)

      const payload = {
        stu_id: student.StudentID,
        course: student.Course,
        installment: feeData.installment,

        // Send the current payment amounts
        tuition_fees: payments.tution_fees || 0,
        exam_fees: payments.exam_fees || 0,
        hostel_fees: payments.hostel_fees || 0,
        admission_fees: payments.admission_fees || 0,
        prospectus_fees: payments.prospectus_fees || 0,
        variable_fees: totalVariableFeesPayment,

        // Payment details
        mode,
        mode_id: modeId,
        total_amount: totalOriginalAmount,
        deposit_amount: totalCurrentPayment,
        balance_amount: totalFinalBalance,
        original_transaction_id: feeData.Paid || null,
        Remark: remarks,
        payment_date: paymentDate,
        added_by: user.emp_id,
      }

      console.log("Submitting payload:", payload)

      const res = await axios.post("https://namami-infotech.com/LIT/src/fees/add_fee_transaction.php", payload)

      if (res.data.success) {
        setSuccessMsg("Payment recorded successfully!")
        if (res.data.variable_fees_updated > 0) {
          setSuccessMsg((prev) => prev + ` Variable fees marked as paid.`)
        }
        setTimeout(() => {
          onClose(true)
        }, 1500)
      } else {
        setErrorMsg(res.data.message || "Payment failed. Please try again.")
      }
    } catch (err) {
      setErrorMsg("Error processing payment. Please try again.")
      console.error(err)
    } finally {
      setSubmitting(false)
    }
  }

  const handleWriteOffConfirm = async () => {
    if (!writeOffConfirm.variableFee) return;
    
    setLoading(true);
    setErrorMsg("");
    
    try {
      const response = await axios.post(
        'https://namami-infotech.com/LIT/src/fees/write_off_variable.php',
        {
          action: 'write_off',
          student_id: student.StudentID,
          id: writeOffConfirm.variableFee.id
        }
      );

      if (response.data.success) {
        // Refresh the variable fees data
        if (typeof onClose === 'function') {
          onClose(true); // Pass true to indicate refresh needed
        }
        setSuccessMsg(`Variable fee "${writeOffConfirm.variableFee.particular}" has been written off successfully`);
      } else {
        setErrorMsg(response.data.message || "Failed to write off variable fee");
      }
    } catch (error) {
      console.error("Error writing off variable fee:", error);
      setErrorMsg("Error writing off variable fee");
    } finally {
      setLoading(false);
      setWriteOffConfirm({ open: false, variableFee: null });
    }
  };

  const renderFeeRow = (feeType, label, originalAmount, alreadyPaid, remaining, isVariable = false, variableFeeData = null) => {
    if (originalAmount <= 0 && !isVariable) return null

    const isFullyPaid = remaining <= 0

    return (
      <Grid item xs={12} key={feeType}>
        <Card variant="outlined" sx={{ mb: 0 }}>
          <CardContent sx={{ py: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={0}>
              <Box display="flex" flexDirection="row" alignItems="center" gap={2}>
                <Typography variant="subtitle1" fontWeight="bold">
                  {label}
                  {isVariable && (
                    <Chip label="Variable" size="small" color="warning" sx={{ ml: 1 }} />
                  )}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Original Amount: ₹{originalAmount.toFixed(2)}
                </Typography>
                {alreadyPaid > 0 && (
                  <Typography variant="body2" color="success.main" fontWeight="medium">
                    ✓ Already Paid: ₹{alreadyPaid.toFixed(2)}
                  </Typography>
                )}
                <Typography variant="body2" color={isFullyPaid ? "success.main" : "primary.main"} fontWeight="medium">
                  {isFullyPaid ? "✓ Fully Paid" : `Remaining: ₹${remaining.toFixed(2)}`}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={1}>
                {isVariable && variableFeeData && (
                  <Tooltip title="Write Off (Set amount to 0)">
                    <IconButton
                      size="small" 
                      color="error"
                      onClick={() => setWriteOffConfirm({
                        open: true,
                        variableFee: variableFeeData
                      })}
                      disabled={loading}
                    >
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
                
                <Box sx={{ width: 150 }}>
                  <TextField
                    size="small"
                    type="number"
                    label="Pay Amount"
                    value={payments[feeType] || 0}
                    onChange={(e) => handlePaymentChange(feeType, e.target.value)}
                    inputProps={{
                      min: 0,
                      max: remaining,
                      step: "0.01",
                    }}
                    fullWidth
                    disabled={isFullyPaid}
                  />
                </Box>
              </Box>
            </Box>
          </CardContent>
        </Card>
      </Grid>
    )
  }

  if (loading) {
    return (
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
        <DialogContent>
          <Box display="flex" justifyContent="center" alignItems="center" p={4}>
            <CircularProgress />
            <Typography ml={2}>Loading payment information...</Typography>
          </Box>
        </DialogContent>
      </Dialog>
    )
  }

  // Confirmation Dialog for Write Off
  const WriteOffConfirmation = (
    <Dialog
      open={writeOffConfirm.open}
      onClose={() => setWriteOffConfirm({ open: false, variableFee: null })}
      maxWidth="xs"
    >
      <DialogTitle>Confirm Write Off</DialogTitle>
      <DialogContent>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to write off this variable fee?
        </Typography>
        {writeOffConfirm.variableFee && (
          <Box mt={2}>
            <Typography variant="subtitle1">
              <strong>Particular:</strong> {writeOffConfirm.variableFee.particular}
            </Typography>
            <Typography variant="subtitle1">
              <strong>Amount:</strong> ₹{variableFeesTotals[`variable_${writeOffConfirm.variableFee.id}`]?.toFixed(2) || '0.00'}
            </Typography>
          </Box>
        )}
        <Typography variant="body2" color="error" mt={2}>
          This action cannot be undone. The fee amount will be set to 0.
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button 
          onClick={() => setWriteOffConfirm({ open: false, variableFee: null })}
          color="primary"
        >
          Cancel
        </Button>
        <Button 
          onClick={handleWriteOffConfirm}
          color="error"
          variant="contained"
          disabled={loading}
        >
          {loading ? <CircularProgress size={24} /> : 'Confirm Write Off'}
        </Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      {WriteOffConfirmation}
      <Dialog open={open} onClose={() => onClose(false)} maxWidth="md" fullWidth maxHeight="90vh">
        <DialogTitle>
          <Box>
            <Typography variant="h6">Payment for Installment {feeData?.installment}</Typography>
            {totalAlreadyPaid > 0 && (
              <Typography variant="subtitle2" color="success.main">
                Previous payments: ₹{totalAlreadyPaid.toFixed(2)}
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent sx={{ maxHeight: "70vh", overflowY: "auto" }}>
          {successMsg && (
            <Alert severity="success" sx={{ mb: 2 }}>
              {successMsg}
            </Alert>
          )}
          {errorMsg && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {errorMsg}
            </Alert>
          )}

          <Box mb={3}>
            <TextField
              type="date"
              fullWidth
              margin="normal"
              label="Payment Date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            {/* Summary Card */}
            <Card sx={{ mt: 2, mb: 2, bgcolor: "grey.50" }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Payment Summary
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Typography variant="body2">
                      <strong>Total Original Amount:</strong> ₹{totalOriginalAmount.toFixed(2)}
                    </Typography>
                    {totalAlreadyPaid > 0 && (
                      <Typography variant="body2" color="success.main">
                        <strong>Already Paid:</strong> ₹{totalAlreadyPaid.toFixed(2)}
                      </Typography>
                    )}
                    <Typography variant="body2" color="primary.main">
                      <strong>Total Remaining:</strong> ₹{totalRemainingAmount.toFixed(2)}
                    </Typography>
                  </Grid>
                  <Grid item xs={6}>
                    <Typography variant="body2" color="primary">
                      <strong>Current Payment:</strong> ₹{totalCurrentPayment.toFixed(2)}
                    </Typography>
                    <Typography variant="body2" color={totalFinalBalance > 0 ? "error" : "success"}>
                      <strong>Balance After Payment:</strong> ₹{Math.max(totalFinalBalance, 0).toFixed(2)}
                    </Typography>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            <Grid container spacing={1}>
              {/* Regular Fee Rows */}
              {renderFeeRow(
                "tution_fees",
                "Tuition Fees",
                baseTotals.tution_fees,
                existingPayments?.tuition_fees || 0,
                remainingAmounts.tution_fees || 0,
              )}
              {renderFeeRow(
                "exam_fees",
                "Exam Fees",
                baseTotals.exam_fees,
                existingPayments?.exam_fees || 0,
                remainingAmounts.exam_fees || 0,
              )}
              {renderFeeRow(
                "hostel_fees",
                "Hostel Fees",
                baseTotals.hostel_fees,
                existingPayments?.hostel_fees || 0,
                remainingAmounts.hostel_fees || 0,
              )}
              {renderFeeRow(
                "admission_fees",
                "Admission Fees",
                baseTotals.admission_fees,
                existingPayments?.admission_fees || 0,
                remainingAmounts.admission_fees || 0,
              )}
              {renderFeeRow(
                "prospectus_fees",
                "Prospectus Fees",
                baseTotals.prospectus_fees,
                existingPayments?.prospectus_fees || 0,
                remainingAmounts.prospectus_fees || 0,
              )}

              {/* Variable Fee Rows */}
              {variableFees &&
                Array.isArray(variableFees) &&
                variableFees.map((vf) => {
                  const feeKey = `variable_${vf.id}`
                  return renderFeeRow(
                    feeKey,
                    vf.particular,
                    variableFeesTotals[feeKey] || 0,
                    0,
                    remainingAmounts[feeKey] || 0,
                    true,
                    vf,
                  )
                })}
            </Grid>
          </Box>

          <Divider sx={{ my: 2 }} />

          <TextField
            fullWidth
            margin="normal"
            select
            label="Payment Mode"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            {["Cash", "Online", "UPI", "Cheque"].map((option) => (
              <MenuItem key={option} value={option}>
                {option}
              </MenuItem>
            ))}
          </TextField>

          {mode !== "Cash" && (
            <TextField
              fullWidth
              margin="normal"
              label={`${mode} Reference/Transaction ID`}
              value={modeId}
              onChange={(e) => setModeId(e.target.value)}
              required
              error={mode !== "Cash" && !modeId.trim()}
              helperText={mode !== "Cash" && !modeId.trim() ? "This field is required" : ""}
            />
          )}

          <TextField
            fullWidth
            margin="normal"
            label="Remarks (optional)"
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            multiline
            rows={2}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose(false)} disabled={submitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={submitting || totalCurrentPayment <= 0}
            variant="contained"
            color="primary"
          >
            {submitting ? "Processing..." : `Pay ₹${totalCurrentPayment.toFixed(2)}`}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  )
}

export default PaymentDialog