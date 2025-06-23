import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import axios from "axios";

const PaymentDialog = ({ open, onClose, feeData, student, variableFees }) => {
  const [mode, setMode] = useState("Cash");
  const [modeId, setModeId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [remainingBalance, setRemainingBalance] = useState(0);

  useEffect(() => {
    if (feeData?.balance_amount) {
      // If paying a balance, set deposit amount to the remaining balance by default
      setDepositAmount(feeData.balance_amount.toString());
    } else {
      setDepositAmount("");
    }
  }, [feeData]);

  if (!feeData) return null;

  // Calculate base total from fee structure
  const baseTotal =
    Number(feeData.tution_fees || 0) +
    Number(feeData.exam_fees || 0) +
    Number(feeData.hostel_fees || 0) +
    Number(feeData.admission_fees || 0) +
    Number(feeData.prospectus_fees || 0) -
    Number(feeData.Scholarship || 0);

  // Calculate variable fees total
  const variableTotal = Array.isArray(variableFees)
    ? variableFees.reduce((sum, vf) => sum + Number(vf.amount || 0), 0)
    : 0;

  // Determine the total amount to pay
  const totalAmount = feeData.balance_amount 
    ? Number(feeData.balance_amount) + variableTotal
    : baseTotal + variableTotal;

  // Calculate balance after deposit
  const balance = totalAmount - Number(depositAmount || 0);

  const handleSubmit = async () => {
    setSubmitting(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const payload = {
        stu_id: student.StudentID,
        course: student.Course,
        installment: feeData.installment,
        tuition_fees: feeData.tution_fees,
        exam_fees: feeData.exam_fees,
        hostel_fees: feeData.hostel_fees,
        admission_fees: feeData.admission_fees,
        prospectus_fees: feeData.prospectus_fees,
        mode,
        mode_id: modeId,
        total_amount: totalAmount,
        deposit_amount: depositAmount,
        balance_amount: balance,
        // Include original transaction ID if this is a partial payment
        original_transaction_id: feeData.Paid || null
      };

      const res = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/add_fee_transaction.php",
        payload
      );

      if (res.data.success) {
        setSuccessMsg("Payment recorded successfully!");
        setTimeout(() => {
          onClose(true); // Notify parent to refresh
        }, 1500);
      } else {
        setErrorMsg(res.data.message || "Payment failed. Please try again.");
      }
    } catch (err) {
      setErrorMsg("Error processing payment. Please try again.");
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onClose={() => onClose(false)} maxWidth="sm" fullWidth>
      <DialogTitle>
        {feeData.balance_amount ? "Pay Remaining Balance" : "Make Payment"} - Installment {feeData.installment}
      </DialogTitle>
      <DialogContent>
        {successMsg && <Alert severity="success">{successMsg}</Alert>}
        {errorMsg && <Alert severity="error">{errorMsg}</Alert>}

        <Box mt={2} mb={3}>
          <Typography variant="h6" gutterBottom>
            {feeData.balance_amount ? (
              <>
                <strong>Remaining Balance:</strong> ₹{feeData.balance_amount}
                {variableTotal > 0 && (
                  <span> + ₹{variableTotal} (variable fees) = ₹{totalAmount}</span>
                )}
              </>
            ) : (
              <>
                <strong>Total Amount Due:</strong> ₹{baseTotal}
                {variableTotal > 0 && (
                  <span> + ₹{variableTotal} (variable fees) = ₹{totalAmount}</span>
                )}
              </>
            )}
          </Typography>
        </Box>

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
          />
        )}

        <TextField
          fullWidth
          margin="normal"
          type="number"
          label="Amount to Pay"
          value={depositAmount}
          onChange={(e) => {
            const value = Math.min(Number(e.target.value), totalAmount);
            setDepositAmount(value.toString());
          }}
          inputProps={{
            min: 0,
            max: totalAmount,
            step: "any"
          }}
          helperText={`Maximum: ₹${totalAmount}`}
        />

        <Box mt={2}>
          <Typography variant="body1">
            <strong>Remaining Balance After Payment:</strong> ₹{balance > 0 ? balance : 0}
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => onClose(false)} disabled={submitting}>
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!depositAmount || submitting || Number(depositAmount) <= 0}
          variant="contained"
          color="primary"
        >
          {submitting ? "Processing..." : "Submit Payment"}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default PaymentDialog;