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

const PaymentDialog = ({ open, onClose, feeData, student, variableFees, firstDueInstallment }) => {
  const [mode, setMode] = useState("Cash");
  const [modeId, setModeId] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [remarks, setRemarks] = useState("");
  const [paymentDate, setPaymentDate] = useState("");


  // Calculate base total from fee structure
  const baseTotal =
    Number(feeData.tution_fees || 0) +
    Number(feeData.exam_fees || 0) +
    Number(feeData.hostel_fees || 0) +
    Number(feeData.admission_fees || 0) +
    Number(feeData.prospectus_fees || 0) -
    Number(feeData.Scholarship || 0);

  // Calculate variable fees total - only include if this is a new payment (not balance payment)
  const variableTotal = (!feeData.balance_amount && feeData.id === firstDueInstallment?.id && Array.isArray(variableFees))
    ? variableFees.reduce((sum, vf) => sum + Number(vf.amount || 0), 0)
    : 0;

  // Determine the total amount to pay
  const totalAmount = feeData.balance_amount 
    ? Number(feeData.balance_amount)  // Use just the balance amount if it exists
    : baseTotal + variableTotal;      // Otherwise use full amount + variables

  // Calculate balance after payment
  const balance = totalAmount - Number(depositAmount || 0);

  // Initialize deposit amount
  useEffect(() => {
    if (feeData?.balance_amount) {
      // For balance payments, default to the full remaining balance
      setDepositAmount(feeData.balance_amount.toString());
    } else {
      // For new payments, default to the full amount
      setDepositAmount((baseTotal + variableTotal).toString());
    }
  }, [feeData, baseTotal, variableTotal]);

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
        original_transaction_id: feeData.Paid || null,
        Remark: remarks,
        payment_date: paymentDate
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
type="date"
  fullWidth
  margin="normal"
  label="Payment Date"
  value={paymentDate}
  onChange={(e) => setPaymentDate(e.target.value)}
        />
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
  label="Remarks (optional)"
  value={remarks}
  onChange={(e) => setRemarks(e.target.value)}
  multiline
  rows={2}
/>

        <Box mt={2}>
          <Typography variant="body1">
            <strong>Remaining Balance After Payment:</strong> ₹{Math.max(balance, 0)}
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