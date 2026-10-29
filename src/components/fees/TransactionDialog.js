"use client";

import {
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  Button,
  Box,
  Grid,
  Divider,
  IconButton,
  CircularProgress,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import PrintIcon from "@mui/icons-material/Print";
import ShareIcon from "@mui/icons-material/Share";
import DownloadIcon from "@mui/icons-material/Download";
import logo from "../../assets/images (1).png";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef, useState, useEffect } from "react";
import axios from "axios";

// Utility to convert number to words
const numberToWords = (num) => {
  const n = Math.floor(Number(num));
  if (isNaN(n) || n === 0) return "Zero Rupees Only";

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
  ];

  const b = [
    "",
    "",
    "Twenty",
    "Thirty",
    "Forty",
    "Fifty",
    "Sixty",
    "Seventy",
    "Eighty",
    "Ninety",
  ];

  const inWords = (val) => {
    if (val < 20) return a[val];
    if (val < 100)
      return b[Math.floor(val / 10)] + (val % 10 ? " " + a[val % 10] : "");
    if (val < 1000)
      return (
        a[Math.floor(val / 100)] +
        " Hundred" +
        (val % 100 ? " " + inWords(val % 100) : "")
      );
    if (val < 100000)
      return (
        inWords(Math.floor(val / 1000)) +
        " Thousand" +
        (val % 1000 ? " " + inWords(val % 1000) : "")
      );
    if (val < 10000000)
      return (
        inWords(Math.floor(val / 100000)) +
        " Lakh" +
        (val % 100000 ? " " + inWords(val % 100000) : "")
      );
    return (
      inWords(Math.floor(val / 10000000)) +
      " Crore" +
      (val % 10000000 ? " " + inWords(val % 10000000) : "")
    );
  };

  const words = inWords(n).trim();
  return words + (n === 1 ? " Rupee Only" : " Rupees Only");
};

// Format currency with symbol & 2 decimals
const formatAmount = (val) => {
  if (val === undefined || val === null || val === "" || isNaN(Number(val))) {
    return "₹0.00";
  }
  return `₹${Number(val).toFixed(2)}`;
};

// Format date to "DD Mon YYYY" (e.g. 07 Jul 2026)
const formatReceiptDate = (dateVal) => {
  if (!dateVal) return "-";
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return String(dateVal);
  const day = String(d.getDate()).padStart(2, "0");
  const monthNames = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const month = monthNames[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
};

const TransactionDialog = ({ open, transactionData, onClose, student, isVariableFee = false, feeType }) => {
  const contentRef = useRef();
  const [downloading, setDownloading] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [studentDetails, setStudentDetails] = useState(student || null);

  // Sync or fetch student details when dialog opens
  useEffect(() => {
    if (student) {
      setStudentDetails(student);
    } else if (open && transactionData?.stu_id) {
      fetchStudentDetails(transactionData.stu_id);
    }
  }, [open, student, transactionData]);

  const fetchStudentDetails = async (studentId) => {
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
      );
      if (response.data && response.data.success && response.data.data) {
        setStudentDetails(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching student details for receipt:", error);
    }
  };

  if (!transactionData) return null;

  // Resolved values
  const studentId =
    transactionData.stu_id ||
    transactionData.Student_id ||
    studentDetails?.StudentID ||
    "-";
  const studentName =
    transactionData.CandidateName ||
    studentDetails?.CandidateName ||
    "-";
  const mobile =
    studentDetails?.StudentContactNo ||
    transactionData.StudentContactNo ||
    transactionData.mobile ||
    "-";
  const address =
    studentDetails?.PermanentAddress ||
    transactionData.PermanentAddress ||
    transactionData.address ||
    "-";
  const course =
    transactionData.course ||
    studentDetails?.Course ||
    "N/A";
  const isVariable =
    Boolean(isVariableFee) ||
    feeType === "Variable Fee" ||
    Boolean(transactionData.particular) ||
    transactionData.installment === undefined ||
    transactionData.installment === null ||
    transactionData.installment === "" ||
    transactionData.installment === "-";

  const particular = transactionData.particular || transactionData.Particular || "";
  const installment = transactionData.installment ?? "-";
  const paymentMode = transactionData.mode || transactionData.Mode || "-";
  const modeId = transactionData.mode_id || transactionData.Mode_id || "-";
  const remark = transactionData.Remark || transactionData.remark || modeId || "-";

  const totalAmount = Number(transactionData.total_amount || 0);
  const depositAmount = Number(transactionData.deposit_amount || 0);
  const balanceAmount = Number(transactionData.balance_amount || 0);

  // Fee Details rows calculation
  const feeDetailsList = [];
  if (isVariable) {
    feeDetailsList.push({
      label: particular || "Variable Fees",
      amount: depositAmount > 0 ? depositAmount : totalAmount,
    });
  } else {
    if (Number(transactionData.tuition_fees) > 0) {
      feeDetailsList.push({
        label: "Tuition Fees",
        amount: Number(transactionData.tuition_fees),
      });
    }
    if (Number(transactionData.variable_fees) > 0) {
      feeDetailsList.push({
        label: "Variable Fees",
        amount: Number(transactionData.variable_fees),
      });
    }
    if (Number(transactionData.exam_fees) > 0) {
      feeDetailsList.push({
        label: "Exam Fees",
        amount: Number(transactionData.exam_fees),
      });
    }
    if (Number(transactionData.hostel_fees) > 0) {
      feeDetailsList.push({
        label: "Hostel Fees",
        amount: Number(transactionData.hostel_fees),
      });
    }
    if (Number(transactionData.admission_fees) > 0) {
      feeDetailsList.push({
        label: "Admission Fees",
        amount: Number(transactionData.admission_fees),
      });
    }
    if (Number(transactionData.prospectus_fees) > 0) {
      feeDetailsList.push({
        label: "Prospectus Fees",
        amount: Number(transactionData.prospectus_fees),
      });
    }
    // Fallback if none are explicitly set
    if (feeDetailsList.length === 0) {
      feeDetailsList.push({
        label: "Tuition Fees",
        amount: totalAmount > 0 ? totalAmount : depositAmount,
      });
    }
  }

  // Download PDF matching the receipt view
  const handleDownload = async () => {
    if (!contentRef.current) return;
    setDownloading(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
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
      pdf.save(`Receipt_No_${transactionData.id}_${studentId}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Failed to download receipt PDF. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  // Print Receipt
  const handlePrint = () => {
    if (!contentRef.current) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      window.print();
      return;
    }
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Fee Payment Receipt - ${transactionData.id}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
              margin: 0;
              padding: 10px;
              color: #111;
              background: #fff;
            }
            * { box-sizing: border-box; }
          </style>
        </head>
        <body>
          ${contentRef.current.innerHTML}
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

  // Share Receipt
  const handleShare = async () => {
    if (!contentRef.current) return;
    setSharing(true);
    try {
      const canvas = await html2canvas(contentRef.current, {
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
      const file = new File([blob], `Receipt_${transactionData.id}.pdf`, {
        type: "application/pdf",
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: isVariable ? "Variable Fee Receipt" : "Fee Payment Receipt",
          text: `${isVariable ? "Variable Fee Receipt" : "Fee Payment Receipt"} for ${studentName} (${studentId})`,
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
      PaperProps={{
        sx: {
          borderRadius: 2,
          maxWidth: 720,
          maxHeight: "94vh",
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Modal Top Action Bar */}
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
        sx={{
          p: { xs: 2, sm: 4 },
          backgroundColor: "#ffffff",
          overflowY: "auto",
        }}
      >
        <Box
          ref={contentRef}
          sx={{
            width: "100%",
            backgroundColor: "#ffffff",
            color: "#111827",
            fontFamily:
              '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
            p: { xs: 1, sm: 2 },
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
                height: { xs: 55, sm: 68 },
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
                  color: "#000000",
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
          <Box sx={{ textAlign: "center", my: 2 }}>
            <Typography
              sx={{
                fontSize: { xs: "18px", sm: "20px" },
                fontWeight: 800,
                color: "#111827",
                lineHeight: 1.3,
              }}
            >
              {isVariable ? "Variable Fee Receipt" : "Fee Payment Receipt"}
            </Typography>
            <Typography
              sx={{
                fontSize: "14.5px",
                fontWeight: 600,
                color: "#1f2937",
                mt: 0.5,
              }}
            >
              {isVariable
                ? (particular ? `Receipt - ${particular}` : "Receipt - Variable Fee")
                : `Receipt - Installment ${installment}`}
            </Typography>
            <Typography
              sx={{
                fontSize: "13.5px",
                color: "#9ca3af",
                mt: 0.5,
                fontWeight: 400,
              }}
            >
              Receipt No. {transactionData.id}
            </Typography>
          </Box>

          <Divider sx={{ my: 2, borderColor: "#e5e7eb" }} />

          {/* Student Information Section */}
          <Box sx={{ mb: 2.5 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Student Information
            </Typography>
            <Grid container spacing={4}>
              {/* Left Column */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Student ID:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {studentId}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Name:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {studentName}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Mobile:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {mobile}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Address:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {address}
                  </Typography>
                </Box>
              </Grid>

              {/* Right Column */}
              <Grid item xs={6}>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Course:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                    }}
                  >
                    {course}
                  </Typography>
                </Box>
                {isVariable ? (
                  <>
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "13.5px",
                          color: "#111827",
                        }}
                      >
                        Fee Type:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          color: "#111827",
                          textAlign: "right",
                        }}
                      >
                        Variable Fee
                      </Typography>
                    </Box>
                    {particular && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Particular:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                            maxWidth: "65%",
                          }}
                        >
                          {particular}
                        </Typography>
                      </Box>
                    )}
                  </>
                ) : (
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      mb: 1,
                    }}
                  >
                    <Typography
                      sx={{
                        fontWeight: 700,
                        fontSize: "13.5px",
                        color: "#111827",
                      }}
                    >
                      Installment:
                    </Typography>
                    <Typography
                      sx={{
                        fontSize: "13.5px",
                        color: "#111827",
                        textAlign: "right",
                      }}
                    >
                      {installment}
                    </Typography>
                  </Box>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
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
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Mode Id:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                      wordBreak: "break-all",
                    }}
                  >
                    {modeId}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* Payment Breakdown Section */}
          <Box sx={{ mt: 3, mb: 2 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Payment Breakdown
            </Typography>
            <Grid container spacing={4}>
              {/* Current Payment */}
              <Grid item xs={6}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1976d2",
                    mb: 1.25,
                  }}
                >
                  Current Payment:
                </Typography>
                {feeDetailsList.length > 0 && !Number(transactionData.tuition_fees) && !Number(transactionData.exam_fees) && !Number(transactionData.hostel_fees) && !Number(transactionData.admission_fees) && !Number(transactionData.prospectus_fees) ? (
                  feeDetailsList.map((item, idx) => (
                    <Box
                      key={idx}
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        mb: 1,
                      }}
                    >
                      <Typography
                        sx={{
                          fontWeight: 700,
                          fontSize: "13.5px",
                          color: "#111827",
                        }}
                      >
                        {item.label}:
                      </Typography>
                      <Typography
                        sx={{
                          fontSize: "13.5px",
                          color: "#111827",
                          textAlign: "right",
                        }}
                      >
                        {formatAmount(item.amount)}
                      </Typography>
                    </Box>
                  ))
                ) : (
                  <>
                    {Number(transactionData.tuition_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Tuition Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.tuition_fees)}
                        </Typography>
                      </Box>
                    )}
                    {Number(transactionData.variable_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Variable Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.variable_fees)}
                        </Typography>
                      </Box>
                    )}
                    {Number(transactionData.exam_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Exam Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.exam_fees)}
                        </Typography>
                      </Box>
                    )}
                    {Number(transactionData.hostel_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Hostel Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.hostel_fees)}
                        </Typography>
                      </Box>
                    )}
                    {Number(transactionData.admission_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Admission Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.admission_fees)}
                        </Typography>
                      </Box>
                    )}
                    {Number(transactionData.prospectus_fees) > 0 && (
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                          mb: 1,
                        }}
                      >
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: "13.5px",
                            color: "#111827",
                          }}
                        >
                          Prospectus Fees:
                        </Typography>
                        <Typography
                          sx={{
                            fontSize: "13.5px",
                            color: "#111827",
                            textAlign: "right",
                          }}
                        >
                          {formatAmount(transactionData.prospectus_fees)}
                        </Typography>
                      </Box>
                    )}
                  </>
                )}
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
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
                    {formatReceiptDate(transactionData.payment_date)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Remark:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                      textAlign: "right",
                      wordBreak: "break-all",
                    }}
                  >
                    {remark}
                  </Typography>
                </Box>
              </Grid>

              {/* Payment Summary */}
              <Grid item xs={6}>
                <Typography
                  sx={{
                    fontSize: "14px",
                    fontWeight: 700,
                    color: "#1976d2",
                    mb: 1.25,
                  }}
                >
                  Payment Summary:
                </Typography>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
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
                    {formatAmount(totalAmount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Amount Paid:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#1976d2",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    {formatAmount(depositAmount)}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    mb: 1,
                  }}
                >
                  <Typography
                    sx={{
                      fontWeight: 700,
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    Status:
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: balanceAmount <= 0 ? "#16a34a" : "#ea580c",
                      fontWeight: 600,
                      textAlign: "right",
                    }}
                  >
                    {balanceAmount <= 0
                      ? "Fully Paid"
                      : `Partially Paid (Due ${formatAmount(balanceAmount)})`}
                  </Typography>
                </Box>
              </Grid>
            </Grid>

            {/* In Words */}
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                mt: 2,
                gap: 1.5,
              }}
            >
              <Typography
                sx={{
                  fontWeight: 700,
                  fontSize: "13.5px",
                  color: "#111827",
                }}
              >
                In Words:
              </Typography>
              <Typography
                sx={{
                  fontSize: "13.5px",
                  color: "#111827",
                }}
              >
                {numberToWords(depositAmount)}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 2.5, borderColor: "#e5e7eb" }} />

          {/* Fee Details Section */}
          <Box sx={{ mb: 3 }}>
            <Typography
              sx={{
                fontSize: "16px",
                fontWeight: 800,
                color: "#111827",
                mb: 1.5,
              }}
            >
              Fee Details
            </Typography>

            <Box sx={{ width: "100%" }}>
              {/* Header */}
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  py: 1,
                  px: 1.5,
                  backgroundColor: "#f9fafb",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Fee Type
                </Typography>
                <Typography
                  sx={{
                    fontWeight: 700,
                    fontSize: "14px",
                    color: "#111827",
                  }}
                >
                  Amount
                </Typography>
              </Box>

              {/* Rows */}
              {feeDetailsList.map((item, idx) => (
                <Box
                  key={idx}
                  sx={{
                    display: "flex",
                    justifyContent: "space-between",
                    py: 1.25,
                    px: 1.5,
                    borderBottom: "1px solid #f3f4f6",
                  }}
                >
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    {item.label}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: "13.5px",
                      color: "#111827",
                    }}
                  >
                    {formatAmount(item.amount)}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>

          {/* System generated note */}
          <Box sx={{ textAlign: "center", mt: 6, mb: 1 }}>
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

      {/* Action Buttons */}
      <DialogActions
        sx={{
          px: 3,
          py: 2,
          backgroundColor: "#f9fafb",
          borderTop: "1px solid #e5e7eb",
          gap: 1,
        }}
      >
        <Button
          onClick={handlePrint}
          variant="outlined"
          color="inherit"
          startIcon={<PrintIcon />}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Print
        </Button>
        <Button
          onClick={handleShare}
          variant="outlined"
          color="success"
          startIcon={sharing ? <CircularProgress size={18} /> : <ShareIcon />}
          disabled={sharing}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          Share
        </Button>
        <Button
          onClick={handleDownload}
          variant="contained"
          color="primary"
          startIcon={
            downloading ? <CircularProgress size={18} color="inherit" /> : <DownloadIcon />
          }
          disabled={downloading}
          sx={{ textTransform: "none", fontWeight: 600 }}
        >
          {downloading ? "Downloading..." : "Download PDF"}
        </Button>
        <Button
          onClick={onClose}
          variant="outlined"
          color="inherit"
          sx={{ textTransform: "none" }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default TransactionDialog;
