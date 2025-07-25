"use client"

import {
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Box,
  Grid,
  Divider,
} from "@mui/material"
import logo from "../../assets/images (1).png"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import { useRef, useState, useEffect } from "react"
import axios from "axios"

// Utility to convert number to words
const numberToWords = (num) => {
  const a = [
    "",
    "One",
    "Two",
    "Three",
    "Four",
    "Five",
    "Six",
    "Seven",
    "Eight",
    "Nine",
    "Ten",
    "Eleven",
    "Twelve",
    "Thirteen",
    "Fourteen",
    "Fifteen",
    "Sixteen",
    "Seventeen",
    "Eighteen",
    "Nineteen",
  ]

  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"]

  const numToWords = (n) => {
    if (n < 20) return a[n]
    if (n < 100) return b[Math.floor(n / 10)] + (n % 10 ? " " + a[n % 10] : "")
    if (n < 1000) return a[Math.floor(n / 100)] + " Hundred" + (n % 100 ? " " + numToWords(n % 100) : "")
    if (n < 100000) return numToWords(Math.floor(n / 1000)) + " Thousand" + (n % 1000 ? " " + numToWords(n % 1000) : "")
    if (n < 10000000)
      return numToWords(Math.floor(n / 100000)) + " Lakh" + (n % 100000 ? " " + numToWords(n % 100000) : "")
    return numToWords(Math.floor(n / 10000000)) + " Crore" + (n % 10000000 ? " " + numToWords(n % 10000000) : "")
  }

  if (isNaN(num)) return ""
  return numToWords(Number(num)).trim() + " Rupees Only"
}

const TransactionDialog = ({ open, transactionData, onClose, student }) => {
  const contentRef = useRef()
  const [previousPayments, setPreviousPayments] = useState(null)
  const [loading, setLoading] = useState(false)

  // Fetch previous payments for this installment when dialog opens
  useEffect(() => {
    if (open && transactionData && transactionData.receiptIndex > 1) {
      fetchPreviousPayments()
    }
  }, [open, transactionData])

  const fetchPreviousPayments = async () => {
    setLoading(true)
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/get_transaction_by_stuid.php?stu_id=${transactionData.stu_id}`,
      )

      if (response.data.success && response.data.data) {
        // Filter transactions for the same installment, excluding current transaction
        const installmentTransactions = response.data.data.filter(
          (transaction) =>
            Number(transaction.installment) === Number(transactionData.installment) &&
            Number(transaction.id) !== Number(transactionData.id),
        )

        // Sort by date to get chronological order
        installmentTransactions.sort((a, b) => new Date(a.payment_date) - new Date(b.payment_date))

        // Calculate total previous payments
        const totalPreviousPayments = installmentTransactions.reduce(
          (acc, payment) => ({
            tuition_fees: acc.tuition_fees + Number(payment.tuition_fees || 0),
            exam_fees: acc.exam_fees + Number(payment.exam_fees || 0),
            hostel_fees: acc.hostel_fees + Number(payment.hostel_fees || 0),
            admission_fees: acc.admission_fees + Number(payment.admission_fees || 0),
            prospectus_fees: acc.prospectus_fees + Number(payment.prospectus_fees || 0),
            variable_fees: acc.variable_fees + Number(payment.variable_fees || 0),
            total_deposit: acc.total_deposit + Number(payment.deposit_amount || 0),
          }),
          {
            tuition_fees: 0,
            exam_fees: 0,
            hostel_fees: 0,
            admission_fees: 0,
            prospectus_fees: 0,
            variable_fees: 0,
            total_deposit: 0,
          },
        )

        setPreviousPayments(totalPreviousPayments)
      }
    } catch (error) {
      console.error("Error fetching previous payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const total = Number(transactionData.total_amount)
  const isFirstPayment = !transactionData.receiptIndex || transactionData.receiptIndex === 1

  // Add this helper to calculate the breakdown total
  const getBreakdownTotal = (data) => {
    return (
      Number(data.tuition_fees || 0) +
      Number(data.exam_fees || 0) +
      Number(data.hostel_fees || 0) +
      Number(data.admission_fees || 0) +
      Number(data.prospectus_fees || 0) +
      Number(data.variable_fees || 0)
    )
  }

  const handleDownload = async () => {
    const canvas = await html2canvas(contentRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF()
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, width, height)
    pdf.save(
      `receipt_${transactionData.stu_id}_${transactionData.installment}_${transactionData.receiptIndex || 1}.pdf`,
    )
  }

  // Generate PDF blob and share on WhatsApp
  const handleShare = async () => {
    const canvas = await html2canvas(contentRef.current)
    const imgData = canvas.toDataURL("image/png")
    const pdf = new jsPDF()
    const width = pdf.internal.pageSize.getWidth()
    const height = (canvas.height * width) / canvas.width
    pdf.addImage(imgData, "PNG", 0, 0, width, height)
    const blob = pdf.output("blob")
    const file = new File([blob], "receipt.pdf", { type: "application/pdf" })

    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      await navigator.share({
        title: "Receipt",
        text: "Please find the attached receipt.",
        files: [file],
      })
    } else {
      alert("WhatsApp share is only available on supported devices/browsers.")
    }
  }

  function formatDateTime(dateTimeString) {
    const date = new Date(dateTimeString)
    const options = {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }

    const formatter = new Intl.DateTimeFormat("en-US", options)
    const parts = formatter.formatToParts(date)

    const day = parts.find((p) => p.type === "day")?.value
    const month = parts.find((p) => p.type === "month")?.value
    const year = parts.find((p) => p.type === "year")?.value

    return `${day}-${month}-${year}`
  }

  if (!transactionData) return null

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <Box ref={contentRef}>
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <img src={logo || "/placeholder.svg"} alt="College Logo" style={{ height: 60 }} />
            <Box textAlign="right">
              <Typography variant="h6" fontWeight={700}>
                Lakshay Institute Of Technology
              </Typography>
              <Typography variant="body2">M4/46, near water tank, Acharya Vihar, Bhubaneswar, Odisha 751013</Typography>
              <Typography variant="body2">Phone: +91 - 6742544690</Typography>
              <Typography variant="body2">Email: connect@litindia.ac.in</Typography>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent dividers>
          <Box my={2}>
            <Typography variant="h6" align="center" fontWeight={700} gutterBottom>
              Fee Payment Receipt
              {transactionData.receiptIndex && (
                <Typography variant="subtitle2">
                  (Receipt {transactionData.receiptIndex} of {transactionData.totalReceipts})
                </Typography>
              )}
            </Typography>
          </Box>
          <Divider sx={{ mb: 2 }} />

          {/* Student Details */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Student Information
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              <Box display="flex" justifyContent="space-between">
                <strong>Student ID:</strong> <span>{transactionData.stu_id}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Name:</strong> <span>{student?.CandidateName || "-"}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Mobile:</strong> <span>{student?.StudentContactNo || "-"}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Address:</strong> <span>{student?.PermanentAddress || "-"}</span>
              </Box>
            </Grid>
            <Grid item xs={6}>
              <Box display="flex" justifyContent="space-between">
                <strong>Course:</strong> <span>{transactionData.course}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Installment:</strong> <span>{transactionData.installment}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Payment Mode:</strong> <span>{transactionData.mode}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Mode Id:</strong> <span>{transactionData.mode_id}</span>
              </Box>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          {/* Payment Breakdown */}
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Payment Breakdown
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={6}>
              {/* Current Payment Breakdown */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
                Current Payment:
              </Typography>
              {Number(transactionData.tuition_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Tuition Fees:</strong> <span>₹{transactionData.tuition_fees}</span>
                </Box>
              )}
              {Number(transactionData.exam_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Exam Fees:</strong> <span>₹{transactionData.exam_fees}</span>
                </Box>
              )}
              {Number(transactionData.hostel_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Hostel Fees:</strong> <span>₹{transactionData.hostel_fees}</span>
                </Box>
              )}
              {Number(transactionData.admission_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Admission Fees:</strong> <span>₹{transactionData.admission_fees}</span>
                </Box>
              )}
              {Number(transactionData.prospectus_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Prospectus Fees:</strong> <span>₹{transactionData.prospectus_fees}</span>
                </Box>
              )}
              {Number(transactionData.variable_fees) > 0 && (
                <Box display="flex" justifyContent="space-between">
                  <strong>Variable Fees:</strong> <span>₹{transactionData.variable_fees}</span>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" mt={1}>
                <strong>Payment Date:</strong> <span>{formatDateTime(transactionData.payment_date)}</span>
              </Box>
              <Box display="flex" justifyContent="space-between">
                <strong>Remark:</strong> <span>{transactionData.Remark}</span>
              </Box>
            </Grid>

            <Grid item xs={6}>
              {/* Payment Summary */}
              <Typography variant="subtitle2" fontWeight={600} gutterBottom color="primary">
                Payment Summary:
              </Typography>

              <Box display="flex" justifyContent="space-between">
                <strong>Total Installment Amount:</strong> <span>₹{total}</span>
              </Box>

              {!isFirstPayment && previousPayments && (
                <Box display="flex" justifyContent="space-between" sx={{ color: "success.main" }}>
                  <strong>Already Paid (Previous):</strong> <span>₹{previousPayments.total_deposit}</span>
                </Box>
              )}

              <Box display="flex" justifyContent="space-between" sx={{ color: "primary.main" }}>
                <strong>{isFirstPayment ? "Amount Paid" : "Now Paid"}:</strong>{" "}
                <span>₹{transactionData.deposit_amount}</span>
              </Box>

              {Number(transactionData.balance_amount) > 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ color: "error.main" }}>
                  <strong>Balance Amount:</strong> <span>₹{transactionData.balance_amount}</span>
                </Box>
              )}

              {Number(transactionData.balance_amount) === 0 && (
                <Box display="flex" justifyContent="space-between" sx={{ color: "success.main" }}>
                  <strong>Status:</strong> <span>Fully Paid</span>
                </Box>
              )}

              <Box mt={2} display="flex" justifyContent="space-between">
                <strong>In Words:</strong> <span>{numberToWords(transactionData.deposit_amount)}</span>
              </Box>

              {/* Show scholarship if applicable */}
              {(() => {
                const breakdownTotal = getBreakdownTotal(transactionData)
                const scholarship = breakdownTotal - total
                return scholarship > 0 ? (
                  <Box mt={1} display="flex" justifyContent="space-between" sx={{ color: "success.main" }}>
                    <strong>Scholarship Applied:</strong> <span>₹{scholarship}</span>
                  </Box>
                ) : null
              })()}
            </Grid>
          </Grid>

          {/* Previous Payments Summary for subsequent receipts */}
          {!isFirstPayment && previousPayments && (
            <>
              <Divider sx={{ my: 3 }} />
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Previous Payments Summary
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  {previousPayments.tuition_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Tuition Fees:</strong> <span>₹{previousPayments.tuition_fees}</span>
                    </Box>
                  )}
                  {previousPayments.exam_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Exam Fees:</strong> <span>₹{previousPayments.exam_fees}</span>
                    </Box>
                  )}
                  {previousPayments.hostel_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Hostel Fees:</strong> <span>₹{previousPayments.hostel_fees}</span>
                    </Box>
                  )}
                </Grid>
                <Grid item xs={6}>
                  {previousPayments.admission_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Admission Fees:</strong> <span>₹{previousPayments.admission_fees}</span>
                    </Box>
                  )}
                  {previousPayments.prospectus_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Prospectus Fees:</strong> <span>₹{previousPayments.prospectus_fees}</span>
                    </Box>
                  )}
                  {previousPayments.variable_fees > 0 && (
                    <Box display="flex" justifyContent="space-between">
                      <strong>Variable Fees:</strong> <span>₹{previousPayments.variable_fees}</span>
                    </Box>
                  )}
                </Grid>
              </Grid>
            </>
          )}

          <Divider sx={{ my: 3 }} />
          <Box textAlign="center">
            <Typography variant="body2" fontStyle="italic">
              This is a system-generated receipt and does not require a signature.
            </Typography>
          </Box>
        </DialogContent>
      </Box>

      <DialogActions>
        <Button onClick={handleShare} color="success" variant="outlined">
          Share
        </Button>
        <Button onClick={handleDownload} color="secondary" variant="outlined">
          Download
        </Button>
        <Button onClick={onClose} color="primary" variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  )
}

export default TransactionDialog
