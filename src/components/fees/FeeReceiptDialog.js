"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Divider,
  CircularProgress,
  IconButton,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import axios from "axios";
import logo from "../../assets/images (1).png";

const FeeReceiptDialog = ({
  open,
  onClose,
  transactionData,
  student,
  title,
}) => {
  const receiptRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [studentDetails, setStudentDetails] = useState(student || null);
  const [loadingStudent, setLoadingStudent] = useState(false);

  // Reset scroll to top whenever dialog opens
  useEffect(() => {
    if (open) {
      const timer = setTimeout(() => {
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = 0;
        }
      }, 30);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // If student is passed directly, sync it
  useEffect(() => {
    if (student) {
      setStudentDetails(student);
    }
  }, [student]);

  // If student details are missing, attempt to fetch using student id
  useEffect(() => {
    const studentId =
      transactionData?.Student_id ||
      transactionData?.stu_id ||
      transactionData?.StudentID;

    if (open && studentId && (!studentDetails || !studentDetails.CandidateName)) {
      fetchStudentDetails(studentId);
    }
  }, [open, transactionData]);

  const fetchStudentDetails = async (studentId) => {
    setLoadingStudent(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
      );
      if (response.data && response.data.success && response.data.data) {
        setStudentDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching student details for receipt:", error);
    } finally {
      setLoadingStudent(false);
    }
  };

  if (!transactionData) return null;

  // Determine Receipt Title & Details Section Header
  const getReceiptTitle = () => {
    if (title) return title;
    const p = (transactionData.particular || "").toLowerCase();
    const c = (transactionData.category || "").toLowerCase();

    // Variable / Late payment fees go to Variable Fee Receipt
    if (p.includes("variable") || p.includes("late") || c.includes("variable")) {
      return "Variable Fee Receipt";
    }

    // Exam fee aur Other fee dono 'Other Fee Receipt' me jayenge
    return "Other Fee Receipt";
  };

  const getDetailsHeader = () => {
    const receiptTitle = getReceiptTitle();
    if (receiptTitle.includes("Variable")) {
      return "Variable Fee Details";
    }
    if (receiptTitle.includes("Other")) {
      return "Other Fee Details";
    }
    return receiptTitle.replace(/Receipt/i, "Details").trim();
  };

  // Format currency with 2 decimals
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
      return "0.00";
    }
    return Number(val).toFixed(2);
  };

  // Format date to YYYY-MM-DD (e.g. 2026-10-15)
  const formatReceiptDate = (dateVal) => {
    if (!dateVal) return "-";
    if (typeof dateVal === "string" && dateVal.includes("-")) {
      const part = dateVal.split("T")[0].split(" ")[0];
      if (part.length === 10) return part;
    }
    try {
      const d = new Date(dateVal);
      if (isNaN(d.getTime())) return String(dateVal);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    } catch (e) {
      return String(dateVal);
    }
  };

  // Values calculation
  const receiptId = transactionData.id || "-";
  const studentId =
    transactionData.Student_id ||
    transactionData.stu_id ||
    studentDetails?.StudentID ||
    "-";
  const studentName =
    transactionData.CandidateName ||
    studentDetails?.CandidateName ||
    "-";
  const course =
    transactionData.Course ||
    transactionData.course ||
    studentDetails?.Course ||
    "-";
  const mobile =
    transactionData.StudentContactNo ||
    transactionData.mobile ||
    studentDetails?.StudentContactNo ||
    "-";
  const address =
    transactionData.PermanentAddress ||
    transactionData.address ||
    studentDetails?.PermanentAddress ||
    "-";

  const particularText = transactionData.category &&
    !transactionData.particular?.includes(transactionData.category)
      ? `${transactionData.particular} -- ${transactionData.category}`
      : transactionData.particular || "-";

  const totalAmountRaw =
    transactionData.total_amount !== undefined &&
    transactionData.total_amount !== null &&
    transactionData.total_amount !== ""
      ? transactionData.total_amount
      : transactionData.Amount;

  const paidAmountRaw =
    transactionData.deposit_amount !== undefined &&
    transactionData.deposit_amount !== null &&
    transactionData.deposit_amount !== ""
      ? transactionData.deposit_amount
      : (transactionData.Paid !== undefined &&
         transactionData.Paid !== null &&
         transactionData.Paid !== ""
          ? transactionData.Paid
          : transactionData.Amount);

  const outstandingRaw =
    transactionData.balance_amount !== undefined &&
    transactionData.balance_amount !== null &&
    transactionData.balance_amount !== ""
      ? transactionData.balance_amount
      : Math.max(0, Number(totalAmountRaw || 0) - Number(paidAmountRaw || 0));

  const totalAmount = formatCurrency(totalAmountRaw);
  const paidAmount = formatCurrency(paidAmountRaw);
  const outstanding = formatCurrency(outstandingRaw);

  const paymentStatus = (
    transactionData.status ||
    transactionData.Payment_Status ||
    (Number(outstandingRaw) === 0 && Number(paidAmountRaw) > 0
      ? "PAID"
      : Number(outstandingRaw) > 0 && Number(paidAmountRaw) > 0
        ? "PARTIAL"
        : "PAID")
  ).toUpperCase();

  const paymentMode = transactionData.Mode || transactionData.mode || "N/A";
  const paymentDate = formatReceiptDate(transactionData.payment_date);
  const remarks = transactionData.Remark || transactionData.remark || "-";

  // PDF Generation
  const handleDownloadPdf = async () => {
    if (!receiptRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Receipt_${receiptId}_${studentId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download receipt PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Print Receipt
  const handlePrint = () => {
    if (!receiptRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Receipt - ${receiptId}</title>
          <style>
            @page { size: A4; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 20px;
              color: #111;
              background: #fff;
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${receiptRef.current.innerHTML}
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  // WhatsApp / System Share
  const handleShare = async () => {
    if (!receiptRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      const blob = pdf.output("blob");
      const file = new File([blob], `Receipt_${receiptId}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: "Fee Receipt",
          text: "Please find the attached fee receipt.",
          files: [file],
        });
      } else {
        alert("Sharing is only available on supported devices/browsers.");
      }
    } catch (err) {
      console.error("Share failed:", err);
    } finally {
      setSharing(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      disableAutoFocus
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 680,
          width: "100%",
          maxHeight: "92vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          m: { xs: 1, sm: 2 },
        },
      }}
    >
      {/* Modal top action bar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          px: 2.5,
          py: 1.5,
          backgroundColor: "#f9fafb",
          borderBottom: "1px solid #e5e7eb",
          flexShrink: 0,
        }}
      >
        <Typography variant="subtitle1" fontWeight={700} color="#111827">
          Receipt Preview
        </Typography>
        <IconButton size="small" onClick={onClose}>
          <CloseIcon fontSize="small" />
        </IconButton>
      </Box>

      {/* Printable Receipt Content */}
      <DialogContent
        ref={scrollContainerRef}
        sx={{
          p: { xs: 2, sm: 3.5 },
          backgroundColor: "#ffffff",
          overflowX: "hidden",
          overflowY: "auto",
        }}
      >
        <Box
          ref={receiptRef}
          sx={{
            width: "100%",
            maxWidth: "100%",
            backgroundColor: "#ffffff",
            color: "#111827",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            p: { xs: 0.5, sm: 1.5 },
            boxSizing: "border-box",
          }}
        >
          {/* Header with Logo and Institute Info */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 2,
              gap: 2,
            }}
          >
            <Box
              component="img"
              src={logo}
              alt="Lakshay Institute Of Technology"
              sx={{
                height: { xs: 58, sm: 70 },
                width: "auto",
                objectFit: "contain",
                flexShrink: 0,
              }}
            />
            <Box sx={{ textAlign: "right", flexShrink: 1 }}>
              <Typography
                sx={{
                  fontSize: { xs: "17px", sm: "19px" },
                  fontWeight: 800,
                  color: "#111827",
                  lineHeight: 1.25,
                  mb: 0.5,
                }}
              >
                Lakshay Institute Of Technology
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.4,
                }}
              >
                M4/46, near water tank, Acharya Vihar, Bhubaneswar, Odisha 751013
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.4,
                }}
              >
                Phone: +91 - 6742544690
              </Typography>
              <Typography
                sx={{
                  fontSize: "12px",
                  color: "#374151",
                  lineHeight: 1.4,
                }}
              >
                Email: connect@litindia.ac.in
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />

          {/* Title and Receipt ID */}
          <Box sx={{ textAlign: "center", my: 1.5 }}>
            <Typography
              sx={{
                fontSize: { xs: "20px", sm: "22px" },
                fontWeight: 800,
                color: "#111827",
                letterSpacing: "-0.01em",
              }}
            >
              {getReceiptTitle()}
            </Typography>
            <Typography
              sx={{
                fontSize: "13.5px",
                color: "#374151",
                mt: 0.5,
                fontWeight: 500,
              }}
            >
              Receipt ID: {receiptId}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />

          {/* Student Information Section */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Student Information
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Student ID:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {studentId}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Name:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {studentName}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Course:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {course}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Mobile:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {mobile}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Address:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {address}
                </Typography>
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />

          {/* Fee Details Section */}
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontSize: "15px",
                fontWeight: 800,
                color: "#111827",
                mb: 1.5,
              }}
            >
              {getDetailsHeader()}
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.25 }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Fee ID:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {receiptId}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Particular:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    maxWidth: "70%",
                    textAlign: "right",
                    wordBreak: "break-word",
                  }}
                >
                  {particularText}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Total Amount:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  ₹{totalAmount}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Paid Amount:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  ₹{paidAmount}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Outstanding:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  ₹{outstanding}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Payment Status:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 800,
                    textAlign: "right",
                    color:
                      paymentStatus === "PAID"
                        ? "#16a34a"
                        : paymentStatus === "PARTIAL"
                          ? "#ea580c"
                          : "#dc2626",
                  }}
                >
                  {paymentStatus}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Payment Mode:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  {paymentMode}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Payment Date:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                  }}
                >
                  {paymentDate}
                </Typography>
              </Box>

              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: 2,
                }}
              >
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    fontWeight: 700,
                    color: "#111827",
                    flexShrink: 0,
                  }}
                >
                  Remarks:
                </Typography>
                <Typography
                  sx={{
                    fontSize: "13.5px",
                    color: "#111827",
                    textAlign: "right",
                    maxWidth: "70%",
                    wordBreak: "break-word",
                  }}
                >
                  {remarks}
                </Typography>
              </Box>
            </Box>
          </Box>

          {/* Footer note */}
          <Box sx={{ mt: 4, mb: 1, textAlign: "center" }}>
            <Typography
              sx={{
                fontSize: "12px",
                fontStyle: "italic",
                color: "#6b7280",
              }}
            >
              This is a system-generated receipt and does not require a signature.
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      {/* Actions */}
      <DialogActions
        sx={{
          px: 3,
          py: 1.5,
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          gap: 1,
          flexShrink: 0,
        }}
      >
        <Button
          onClick={handleShare}
          variant="outlined"
          color="success"
          disabled={sharing}
          startIcon={
            sharing ? <CircularProgress size={16} color="inherit" /> : <ShareIcon />
          }
          sx={{ textTransform: "none", borderRadius: 1 }}
        >
          Share
        </Button>
        <Button
          onClick={handlePrint}
          variant="outlined"
          color="inherit"
          startIcon={<PrintIcon />}
          sx={{ textTransform: "none", borderRadius: 1 }}
        >
          Print
        </Button>
        <Button
          onClick={handleDownloadPdf}
          variant="contained"
          disabled={downloading}
          startIcon={
            downloading ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <DownloadIcon />
            )
          }
          sx={{
            backgroundColor: "#CC7A00",
            "&:hover": { backgroundColor: "#b56700" },
            fontWeight: 700,
            textTransform: "none",
            borderRadius: 1,
          }}
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none", borderRadius: 1 }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default FeeReceiptDialog;

