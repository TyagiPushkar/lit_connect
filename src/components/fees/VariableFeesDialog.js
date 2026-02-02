"use client"

import React, { useState } from "react"
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from "@mui/material"
import axios from "axios"
import CloseIcon from "@mui/icons-material/Close"
import { useAuth } from "../auth/AuthContext"

const VariableFeesDialog = ({ open, onClose, student, variableFees }) => {
  const { user } = useAuth()
  const [mode, setMode] = useState("Cash")
  const [modeId, setModeId] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState("")
  const [errorMsg, setErrorMsg] = useState("")
  const [remarks, setRemarks] = useState("")
  const [writeOffConfirm, setWriteOffConfirm] = useState({
    open: false,
    variableFee: null,
  })
  const [payments, setPayments] = useState({})
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0])

  // Initialize payments with variable fees
  React.useEffect(() => {
    if (variableFees && Array.isArray(variableFees)) {
      const initialPayments = {}
      variableFees.forEach((vf) => {
        if (!vf.Paid || vf.Paid === "0" || vf.Paid === "") {
          initialPayments[`variable_${vf.id}`] = Number(vf.amount) || 0
        }
      })
      setPayments(initialPayments)
    }
  }, [variableFees])

  const handlePaymentChange = (feeId, value) => {
    const numValue = Math.max(0, Number(value) || 0)
    setPayments((prev) => ({
      ...prev,
      [feeId]: numValue,
    }))
  }

  const handleWriteOffConfirm = async () => {
    if (!writeOffConfirm.variableFee) return

    setSubmitting(true)
    setErrorMsg("")

    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/write_off_variable.php",
        {
          action: "write_off",
          student_id: student.StudentID,
          id: writeOffConfirm.variableFee.id,
        }
      )

      if (response.data.success) {
        setSuccessMsg(`Variable fee "${writeOffConfirm.variableFee.particular}" has been written off successfully`)
        setTimeout(() => {
          onClose(true)
        }, 1500)
      } else {
        setErrorMsg(response.data.message || "Failed to write off variable fee")
      }
    } catch (error) {
      console.error("Error writing off variable fee:", error)
      setErrorMsg("Error writing off variable fee")
    } finally {
      setSubmitting(false)
      setWriteOffConfirm({ open: false, variableFee: null })
    }
  }

  const handleSubmit = async () => {
    const totalPayment = Object.values(payments).reduce((sum, val) => sum + val, 0)
    if (totalPayment <= 0) {
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
      // Prepare variable fee details
      const variableFeeDetails = Object.keys(payments)
        .filter((key) => payments[key] > 0)
        .map((key) => ({
          id: key.replace("variable_", ""),
          amount: payments[key],
        }))

      const payload = {
        stu_id: student.StudentID,
        course: student.Course,
        mode,
        mode_id: modeId,
        total_amount: variableFeeDetails.reduce((sum, vf) => sum + Number(vf.amount), 0),
        deposit_amount: variableFeeDetails.reduce((sum, vf) => sum + Number(vf.amount), 0),
        balance_amount: 0, // Always fully pay variable fees
        Remark: remarks,
        payment_date: paymentDate,
        added_by: user.emp_id,
        variable_fee_details: JSON.stringify(variableFeeDetails),
      }

      const res = await axios.post("https://namami-infotech.com/LIT/src/fees/pay_variable_fees.php", payload)

      if (res.data.success) {
        setSuccessMsg("Variable fees payment recorded successfully!")
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

  const unpaidVariableFees = variableFees.filter((vf) => !vf.Paid || vf.Paid === "0" || vf.Paid === "")
  const totalAmount = unpaidVariableFees.reduce((sum, vf) => sum + Number(vf.amount || 0), 0)
  const totalPayment = Object.values(payments).reduce((sum, val) => sum + val, 0)

  return (
    <>
      {/* Write Off Confirmation Dialog */}
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
                <strong>Particular:</strong>{" "}
                {writeOffConfirm.variableFee.particular}
              </Typography>
              <Typography variant="subtitle1">
                <strong>Amount:</strong> ₹
                {writeOffConfirm.variableFee.amount || "0.00"}
              </Typography>
            </Box>
          )}
          <Typography variant="body2" color="error" mt={2}>
            This action cannot be undone. The fee amount will be set to 0.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() =>
              setWriteOffConfirm({ open: false, variableFee: null })
            }
            color="primary"
          >
            Cancel
          </Button>
          <Button
            onClick={handleWriteOffConfirm}
            color="error"
            variant="contained"
            disabled={submitting}
          >
            {submitting ? <CircularProgress size={24} /> : "Confirm Write Off"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Main Variable Fees Dialog */}
      <Dialog
        open={open}
        onClose={() => onClose(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Typography variant="h6">
            Variable Fees for {student?.CandidateName}
          </Typography>
          <Typography variant="subtitle2">
            Student ID: {student?.StudentID}
          </Typography>
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

          {unpaidVariableFees.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: "center", my: 4 }}>
              No unpaid variable fees found.
            </Typography>
          ) : (
            <>
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

                {/* Variable Fees Table */}
                <TableContainer component={Paper} sx={{ mt: 2, mb: 3 }}>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>Particular</TableCell>
                        <TableCell align="right">Amount (₹)</TableCell>
                        <TableCell align="right">Pay Amount (₹)</TableCell>
                        <TableCell>Actions</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {unpaidVariableFees.map((vf) => (
                        <TableRow key={vf.id}>
                          <TableCell>{vf.particular}</TableCell>
                          <TableCell align="right">
                            {Number(vf.amount).toFixed(2)}
                          </TableCell>
                          <TableCell align="right">
                            <TextField
                              size="small"
                              type="number"
                              value={payments[`variable_${vf.id}`] || 0}
                              onChange={(e) =>
                                handlePaymentChange(
                                  `variable_${vf.id}`,
                                  e.target.value,
                                )
                              }
                              inputProps={{
                                min: 0,
                                max: Number(vf.amount),
                                step: "0.01",
                              }}
                              sx={{ width: 120 }}
                            />
                          </TableCell>
                          {user.role === "Accounts" && (
                            <TableCell>
                              <Tooltip title="Write Off (Set amount to 0)">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() =>
                                    setWriteOffConfirm({
                                      open: true,
                                      variableFee: vf,
                                    })
                                  }
                                  disabled={submitting}
                                >
                                  <CloseIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          )}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>

                <Card sx={{ mb: 2, bgcolor: "grey.50" }}>
                  <CardContent>
                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <Typography variant="body1">
                          <strong>Total Variable Fees:</strong> ₹
                          {totalAmount.toFixed(2)}
                        </Typography>
                      </Grid>
                      <Grid item xs={6}>
                        <Typography variant="body1" color="primary">
                          <strong>Total Payment:</strong> ₹
                          {totalPayment.toFixed(2)}
                        </Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
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
                {["Cash", "Online", "Cheque"].map((option) => (
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
                  helperText={
                    mode !== "Cash" && !modeId.trim()
                      ? "This field is required"
                      : ""
                  }
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
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => onClose(false)} disabled={submitting}>
            Cancel
          </Button>
          {unpaidVariableFees.length > 0 && user.role != "HR" && (
            <Button
              onClick={handleSubmit}
              disabled={submitting || totalPayment <= 0}
              variant="contained"
              color="primary"
            >
              {submitting ? "Processing..." : `Pay ₹${totalPayment.toFixed(2)}`}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
}

export default VariableFeesDialog