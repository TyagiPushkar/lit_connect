"use client"

import { useState, useEffect } from "react"
import {
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  TablePagination,
  TableFooter,
  TextField,
  CircularProgress,
  Box,
  Autocomplete,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
} from "@mui/material"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import { useNavigate } from "react-router-dom"
import VisibilityIcon from "@mui/icons-material/Visibility"
import DownloadIcon from "@mui/icons-material/Download"
import * as XLSX from "xlsx"

const FeesPaymentList = () => {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)

  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")
  const [searchQuery, setSearchQuery] = useState("")
  const [page, setPage] = useState(0)
  const [rowsPerPage, setRowsPerPage] = useState(10)
  const [selectedSession, setSelectedSession] = useState("")
  const [distinctSessions, setDistinctSessions] = useState([])

  const [downloadProgress, setDownloadProgress] = useState(0)
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [processedStudents, setProcessedStudents] = useState(0)
  const [totalStudents, setTotalStudents] = useState(0)
  const [isDownloading, setIsDownloading] = useState(false)

  useEffect(() => {
    fetchLibraryTransactions()
  }, [])

  useEffect(() => {
    handleSearch(searchQuery)
  }, [transactions, searchQuery])

  const fetchLibraryTransactions = async () => {
    setLoading(true)
    try {
      const response = await axios.get("https://namami-infotech.com/LIT/src/students/get_student.php")
      if (response.data.success) {
        setTransactions(response.data.data)
        setFilteredTransactions(response.data.data)
      } else {
        setSnackbarMessage(response.data.message)
        setOpenSnackbar(true)
      }
      const sessions = [...new Set(response.data.data.map((item) => item.Session).filter(Boolean))]
      setDistinctSessions(sessions)
    } catch (error) {
      setSnackbarMessage("Error fetching student list.")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query, session = selectedSession) => {
    setSearchQuery(query)
    const lower = query.toLowerCase()

    const filtered = transactions.filter((tx) => {
      const matchesQuery =
        (tx.StudentID && tx.StudentID.toLowerCase().includes(lower)) ||
        (tx.CandidateName && tx.CandidateName.toLowerCase().includes(lower))

      const matchesSession = session ? tx.Session === session : true
      return matchesQuery && matchesSession
    })

    setFilteredTransactions(filtered)
    setPage(0)
  }

  const handleSessionChange = (event, newValue) => {
    setSelectedSession(newValue || "")
    handleSearch(searchQuery, newValue || "")
  }

  const handleChangePage = (event, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewClick = (studentId) => {
    navigate(`/fees/${studentId}`)
  }

  const downloadFeesReport = async () => {
    setDownloadDialogOpen(true)
    setDownloadProgress(0)
    setProcessedStudents(0)
    setIsDownloading(true)

    try {
      // Initial fetch of all students
      const studentsResponse = await axios.get("https://namami-infotech.com/LIT/src/students/get_student.php")

      if (!studentsResponse.data.success) {
        throw new Error("Failed to fetch student data")
      }

      const allStudents = studentsResponse.data.data
      setTotalStudents(allStudents.length)
      const reportData = []
      const BATCH_SIZE = 5 // Process 5 students at a time
      const DELAY_BETWEEN_BATCHES = 1000 // 1 second between batches

      // Process students in batches
      for (let i = 0; i < allStudents.length; i += BATCH_SIZE) {
        const batch = allStudents.slice(i, i + BATCH_SIZE)
        const batchPromises = batch.map((student) => processStudent(student))

        // Wait for current batch to complete
        const batchResults = await Promise.allSettled(batchPromises)

        // Add successful results to report data
        batchResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            reportData.push(result.value)
          }
        })

        // Update progress
        setProcessedStudents(Math.min(i + BATCH_SIZE, allStudents.length))
        setDownloadProgress(((i + BATCH_SIZE) / allStudents.length) * 100)

        // Add delay between batches if not the last batch
        if (i + BATCH_SIZE < allStudents.length) {
          await new Promise((resolve) => setTimeout(resolve, DELAY_BETWEEN_BATCHES))
        }
      }

      // Generate Excel only if we have data
      if (reportData.length > 0) {
        generateExcelFile(reportData)
        setSnackbarMessage(`Report generated successfully with ${reportData.length} students!`)
        setOpenSnackbar(true)
      } else {
        throw new Error("No student data available for report")
      }
    } catch (error) {
      setSnackbarMessage("Error generating report: " + error.message)
      setOpenSnackbar(true)
    } finally {
      setIsDownloading(false)
      setDownloadDialogOpen(false)
    }
  }

  const processStudent = async (student) => {
    try {
      // Fetch fee structure
      let feeStructure = [];
      try {
        const feeResponse = await axios.get(
          `https://namami-infotech.com/LIT/src/fees/get_student_fee_structure.php?StudentId=${student.StudentID}`,
          { timeout: 10000 }
        );
        if (feeResponse.data.success) {
          feeStructure = feeResponse.data.data;
        }
      } catch (error) {
        console.error(`Error fetching fee structure for ${student.StudentID}:`, error);
        return null;
      }
  
      // Process installments
      const installments = [];
      let totalPaid = 0;
      let totalDue = 0;
  
      for (const installment of feeStructure) {
        try {
          let transactionDetails = null;
          if (installment.Paid && installment.Paid !== "0") {
            const transactionResponse = await axios.get(
              `https://namami-infotech.com/LIT/src/fees/get_fee_transaction.php?id=${installment.Paid}`,
              { timeout: 10000 }
            );
            if (transactionResponse.data.success) {
              transactionDetails = transactionResponse.data.data;
            }
          }
  
          const installmentTotal = 
            (installment.tution_fees || 0) +
            (installment.exam_fees || 0) +
            (installment.hostel_fees || 0) +
            (installment.admission_fees || 0) +
            (installment.prospectus_fees || 0) -
            (installment.Scholarship || 0);
  
          const isPaid = installment.Paid && installment.Paid !== "0";
          const amountPaid = transactionDetails?.deposit_amount || 0;
          const balanceAmount = isPaid ? installmentTotal - amountPaid : installmentTotal;
  
          if (isPaid) {
            totalPaid += amountPaid;
            totalDue += balanceAmount;
          } else {
            totalDue += installmentTotal;
          }
  
          installments.push({
            installmentNo: installment.installment,
            dueDate: installment.due_date,
            tuitionFees: installment.tution_fees || 0,
            examFees: installment.exam_fees || 0,
            hostelFees: installment.hostel_fees || 0,
            admissionFees: installment.admission_fees || 0,
            prospectusFees: installment.prospectus_fees || 0,
            scholarship: installment.Scholarship || 0,
            totalAmount: installmentTotal,
            status: isPaid ? (balanceAmount === 0 ? "Paid" : "Partially Paid") : "Due",
            paymentDate: transactionDetails?.date_time || "",
            paymentMode: transactionDetails?.mode || "",
            amountPaid: amountPaid,
            balanceAmount: balanceAmount
          });
  
        } catch (error) {
          console.error(`Error processing installment ${installment.installment} for ${student.StudentID}:`, error);
          continue;
        }
      }
  
      // Calculate totals
      const totalFees = feeStructure.reduce(
        (sum, item) =>
          sum +
          (item.tution_fees || 0) +
          (item.exam_fees || 0) +
          (item.hostel_fees || 0) +
          (item.admission_fees || 0) +
          (item.prospectus_fees || 0),
        0
      );
  
      const totalScholarship = feeStructure.reduce((sum, item) => sum + (item.Scholarship || 0), 0);
      const netFees = totalFees - totalScholarship;
  
      return {
        studentId: student.StudentID,
        studentName: student.CandidateName,
        course: student.Course,
        session: student.Session,
        guardianName: student.GuardianName,
        guardianContact: student.GuardianContactNo,
        studentContact: student.StudentContactNo,
        address: student.PermanentAddress,
        totalFees: totalFees,
        totalScholarship: totalScholarship,
        netFees: netFees,
        totalPaid: totalPaid,
        totalDue: totalDue,
        installments: installments
      };
    } catch (error) {
      console.error(`Error processing student ${student.StudentID}:`, error);
      return null;
    }
  };

  const generateExcelFile = (reportData) => {
    try {
      // Prepare worksheet data
      const worksheetData = []
  
      // Add headers
      worksheetData.push([
        "Student ID",
        "Student Name",
        "Course",
        "Session",
        "Guardian Name",
        "Guardian Contact",
        "Student Contact",
        "Address",
        "Total Fees",
        "Total Scholarship",
        "Net Fees",
        "Total Paid",
        "Total Due",
        "Installment No",
        "Due Date",
        "Tuition Fees",
        "Exam Fees",
        "Hostel Fees",
        "Admission Fees",
        "Prospectus Fees",
        "Scholarship",
        "Total Amount",
        "Status",
        "Payment Date",
        "Payment Mode",
        "Amount Paid",
        "Balance Amount",
      ])
  
      // Track merged ranges
      const merges = []
  
      // Add student data
      for (const student of reportData) {
        if (student.installments.length === 0) {
          worksheetData.push([
            student.studentId,
            student.studentName,
            student.course,
            student.session,
            student.guardianName,
            student.guardianContact,
            student.studentContact,
            student.address,
            student.totalFees,
            student.totalScholarship,
            student.netFees,
            student.totalPaid,
            student.totalDue,
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
            "",
          ])
        } else {
          const startRow = worksheetData.length
          student.installments.forEach((installment, index) => {
            worksheetData.push([
              student.studentId,
              student.studentName,
              student.course,
              student.session,
              student.guardianName,
              student.guardianContact,
              student.studentContact,
              student.address,
              student.totalFees,
              student.totalScholarship,
              student.netFees,
              student.totalPaid,
              student.totalDue,
              installment.installmentNo,
              installment.dueDate,
              installment.tuitionFees,
              installment.examFees,
              installment.hostelFees,
              installment.admissionFees,
              installment.prospectusFees,
              installment.scholarship,
              installment.totalAmount,
              installment.status,
              installment.paymentDate,
              installment.paymentMode,
              installment.amountPaid,
              installment.balanceAmount,
            ])
          })
          const endRow = worksheetData.length - 1
  
          // Add merges for student info columns (columns 0-12)
          for (let col = 0; col < 13; col++) {
            if (startRow !== endRow) {
              merges.push({ s: { r: startRow, c: col }, e: { r: endRow, c: col } })
            }
          }
        }
      }
  
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
  
      // Apply merges
      ws["!merges"] = merges
  
      // Auto-size columns
      const colWidths = worksheetData[0].map((_, colIndex) => {
        const maxLength = Math.max(
          ...worksheetData.map((row) => (row[colIndex] ? row[colIndex].toString().length : 0))
        )
        return { wch: Math.min(Math.max(maxLength, 10), 50) }
      })
      ws["!cols"] = colWidths
  
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Fees Report")
  
      // Generate Excel file and download
      const date = new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `Fees_Report_${date}.xlsx`)
    } catch (error) {
      setSnackbarMessage("Error generating Excel file: " + error.message)
      setOpenSnackbar(true)
    }
  }

  const handleCloseDownloadDialog = () => {
    if (!isDownloading) {
      setDownloadDialogOpen(false)
    }
  }

  if (loading && !downloadDialogOpen) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" height="60vh">
        <CircularProgress size={60} thickness={5} />
      </Box>
    )
  }

  return (
    <div style={{ padding: "20px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <h2 style={{ margin: 0, color: "#CC7A00" }}>Student Fees Management</h2>
        <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
          <Autocomplete
            options={distinctSessions}
            value={selectedSession}
            onChange={handleSessionChange}
            renderInput={(params) => (
              <TextField {...params} label="Filter by Session" variant="outlined" size="small" />
            )}
            style={{ minWidth: 200 }}
            clearOnEscape
            isOptionEqualToValue={(option, value) => option === value}
          />

          <TextField
            label="Search by Student ID or Name"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ minWidth: 250 }}
          />

          <Button
            variant="contained"
            color="primary"
            onClick={downloadFeesReport}
            disabled={isDownloading}
            startIcon={<DownloadIcon />}
            style={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#B8690A" },
            }}
          >
            {isDownloading ? "Generating..." : "Download Report"}
          </Button>
        </div>
      </div>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student ID</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student Name</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Course</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Session</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((tx, index) => (
              <TableRow
                key={tx.TransactionId || tx.StudentID}
                style={{
                  backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white",
                  "&:hover": { backgroundColor: "#f0f0f0" },
                }}
              >
                <TableCell>{tx.StudentID}</TableCell>
                <TableCell>{tx.CandidateName}</TableCell>
                <TableCell>{tx.Course}</TableCell>
                <TableCell>{tx.Session}</TableCell>
                <TableCell>
                  <VisibilityIcon
                    color="primary"
                    sx={{
                      cursor: "pointer",
                      "&:hover": { color: "#CC7A00" },
                    }}
                    onClick={() => handleViewClick(tx.StudentID)}
                    titleAccess="View Details"
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                count={filteredTransactions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Download Progress Dialog */}
      <Dialog
        open={downloadDialogOpen}
        onClose={handleCloseDownloadDialog}
        disableEscapeKeyDown={isDownloading}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            <DownloadIcon color="primary" />
            Generating Fees Report
          </Box>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: "100%", mb: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Processing students: {processedStudents} of {totalStudents}
            </Typography>
            <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 8, borderRadius: 4 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {Math.round(downloadProgress)}% Complete
            </Typography>
          </Box>
          <Typography variant="body2">
            Please wait while we generate your comprehensive fees report. This may take a few minutes depending on the
            number of students.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDownloadDialog} disabled={isDownloading} color="primary">
            {isDownloading ? "Processing..." : "Close"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </div>
  )
}

export default FeesPaymentList