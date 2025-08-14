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
  Checkbox,
  FormControlLabel,
  FormGroup,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  ButtonGroup,
} from "@mui/material"
import axios from "axios"
import VisibilityIcon from "@mui/icons-material/Visibility"
import DownloadIcon from "@mui/icons-material/Download"
import FilterListIcon from "@mui/icons-material/FilterList"
import * as XLSX from "xlsx"
import { useNavigate } from "react-router-dom"

const FeesPaymentList = () => {
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
  const [distinctCourses, setDistinctCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("")
  
  const [downloadDialogOpen, setDownloadDialogOpen] = useState(false)
  const [reportType, setReportType] = useState("") // "filtered" or "full"
  const [reportFilters, setReportFilters] = useState({
    course: "",
    session: "",
    installments: [],
  })
  const [installmentOptions, setInstallmentOptions] = useState([
    { id: 1, label: "Installment 1" },
    { id: 2, label: "Installment 2" },
    { id: 3, label: "Installment 3" },
    { id: 4, label: "Installment 4" },
    { id: 5, label: "Installment 5" },
    { id: 6, label: "Installment 6" },
    { id: 7, label: "Installment 7" },
    { id: 8, label: "Installment 8" },
    { id: 9, label: "Installment 9" },
    { id: 10, label: "Installment 10" },
    { id: 11, label: "Installment 11" },
    { id: 12, label: "Installment 12" },
  ])

  const [downloadProgress, setDownloadProgress] = useState(0)
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

        // Extract distinct sessions and courses
        const sessions = [...new Set(response.data.data.map((item) => item.Session).filter(Boolean))]
        const courses = [...new Set(response.data.data.map((item) => item.Course).filter(Boolean))]

        setDistinctSessions(sessions)
        setDistinctCourses(courses)
      } else {
        setSnackbarMessage(response.data.message)
        setOpenSnackbar(true)
      }
    } catch (error) {
      setSnackbarMessage("Error fetching student list.")
      setOpenSnackbar(true)
    } finally {
      setLoading(false)
    }
  }

  const handleSearch = (query, session = selectedSession, course = selectedCourse) => {
    setSearchQuery(query)
    const lower = query.toLowerCase()
  
    const filtered = transactions.filter((tx) => {
      const matchesQuery =
        (tx.StudentID && tx.StudentID.toLowerCase().includes(lower)) ||
        (tx.CandidateName && tx.CandidateName.toLowerCase().includes(lower)) ||
        (tx.StudentContactNo && tx.StudentContactNo.toLowerCase().includes(lower))
  
      const matchesSession = session ? tx.Session === session : true
      const matchesCourse = course ? tx.Course === course : true
      return matchesQuery && matchesSession && matchesCourse
    })
  
    setFilteredTransactions(filtered)
    setPage(0)
  }

  const handleSessionChange = (event, newValue) => {
    setSelectedSession(newValue || "")
    handleSearch(searchQuery, newValue || "")
  }
  const handleCourseChange = (event, newValue) => {
    setSelectedCourse(newValue || "")
    handleSearch(searchQuery, selectedSession, newValue || "")
  }
  const handleChangePage = (event, newPage) => setPage(newPage)

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10))
    setPage(0)
  }

  const handleViewClick = (studentId) => {
    // Navigate to student details - you'll need to implement this based on your routing
    navigate(`/fees/${studentId}`) // 
    console.log(`fees/${studentId}`)
  }

  const openFilteredReportDialog = () => {
    setReportType("filtered")
    setReportFilters({
      course: "",
      session: "",
      installments: [],
    })
    setDownloadDialogOpen(true)
  }

  const openFullReportDialog = () => {
    setReportType("full")
    setDownloadDialogOpen(true)
  }

  const handleReportFilterChange = (field, value) => {
    setReportFilters((prev) => ({
      ...prev,
      [field]: value,
    }))
  }

  const handleInstallmentToggle = (installmentId) => {
    setReportFilters((prev) => {
      const newInstallments = prev.installments.includes(installmentId)
        ? prev.installments.filter((id) => id !== installmentId)
        : [...prev.installments, installmentId]

      return {
        ...prev,
        installments: newInstallments,
      }
    })
  }

  const downloadFeesReport = async () => {
    setDownloadProgress(0)
    setProcessedStudents(0)
    setIsDownloading(true)

    try {
      // Initial fetch of all students
      const studentsResponse = await axios.get("https://namami-infotech.com/LIT/src/students/get_student.php")

      if (!studentsResponse.data.success) {
        throw new Error("Failed to fetch student data")
      }

      let allStudents = studentsResponse.data.data

      // Apply filters only for filtered report type
      if (reportType === "filtered") {
        if (reportFilters.course) {
          allStudents = allStudents.filter((student) => student.Course === reportFilters.course)
        }

        if (reportFilters.session) {
          allStudents = allStudents.filter((student) => student.Session === reportFilters.session)
        }
      }

      setTotalStudents(allStudents.length)
      const reportData = []
      const BATCH_SIZE = 5
      const DELAY_BETWEEN_BATCHES = 1000

      // Process students in batches
      for (let i = 0; i < allStudents.length; i += BATCH_SIZE) {
        const batch = allStudents.slice(i, i + BATCH_SIZE)
        const batchPromises = batch.map((student) => processStudent(student))

        // Wait for current batch to complete
        const batchResults = await Promise.allSettled(batchPromises)

        // Add successful results to report data
        batchResults.forEach((result) => {
          if (result.status === "fulfilled" && result.value) {
            // Apply installment filter only for filtered report type
            if (reportType === "filtered" && reportFilters.installments.length > 0) {
              const filteredInstallments = result.value.installments.filter((inst) =>
                reportFilters.installments.includes(inst.installmentNo),
              )

              if (filteredInstallments.length > 0) {
                reportData.push({
                  ...result.value,
                  installments: filteredInstallments,
                })
              }
            } else {
              reportData.push(result.value)
            }
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
        const reportTypeText = reportType === "filtered" ? "filtered" : "full"
        setSnackbarMessage(`${reportTypeText} report generated successfully with ${reportData.length} students!`)
        setOpenSnackbar(true)
      } else {
        throw new Error("No student data available for report with current filters")
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
      let feeStructure = []
      try {
        const feeResponse = await axios.get(
          `https://namami-infotech.com/LIT/src/fees/get_student_fee_structure.php?StudentId=${student.StudentID}`,
          { timeout: 10000 },
        )
        if (feeResponse.data.success) {
          feeStructure = feeResponse.data.data
        }
      } catch (error) {
        console.error(`Error fetching fee structure for ${student.StudentID}:`, error)
        return null
      }

      // Process installments
      const installments = []
      let totalPaid = 0
      let totalDue = 0

      for (const installment of feeStructure) {
        try {
          let transactionDetails = null
          if (installment.Paid && installment.Paid !== "0") {
            const transactionResponse = await axios.get(
              `https://namami-infotech.com/LIT/src/fees/get_fee_transaction.php?id=${installment.Paid}`,
              { timeout: 10000 },
            )
            if (transactionResponse.data.success) {
              transactionDetails = transactionResponse.data.data
            }
          }

          const installmentTotal = 
  (installment.tution_fees || 0) + 
  (installment.hostel_fees || 0);

          const isPaid = installment.Paid && installment.Paid !== "0";
let amountPaid = 0;
if (transactionDetails) {
  // Subtract variable fees from deposit amount for tuition/hostel calculation
  amountPaid = Math.max(0, 
    (transactionDetails.deposit_amount || 0) - 
    (transactionDetails.variable_fees || 0)
  );
}

const balanceAmount = isPaid ? installmentTotal - amountPaid : installmentTotal;
          if (isPaid) {
            totalPaid += amountPaid
            totalDue += balanceAmount
          } else {
            totalDue += installmentTotal
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
            balanceAmount: balanceAmount,
          })
        } catch (error) {
          console.error(`Error processing installment ${installment.installment} for ${student.StudentID}:`, error)
          continue
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
        0,
      )

      const totalScholarship = feeStructure.reduce((sum, item) => sum + (item.Scholarship || 0), 0)
      const netFees = totalFees - totalScholarship

      return {
        studentId: student.StudentID,
        studentName: student.CandidateName,
        course: student.Course,
        session: student.Session,
        gender: student.Gender,
        guardianName: student.GuardianName,
        guardianContact: student.GuardianContactNo,
        studentContact: student.StudentContactNo,
        address: student.PermanentAddress,
        totalFees: totalFees,
        totalScholarship: totalScholarship,
        netFees: netFees,
        totalPaid: totalPaid,
        totalDue: totalDue,
        installments: installments,
      }
    } catch (error) {
      console.error(`Error processing student ${student.StudentID}:`, error)
      return null
    }
  }

  const generateExcelFile = (reportData) => {
    try {
      // Prepare worksheet data
      const worksheetData = []

      // Add headers (matching the DETAIL REPORT.xlsx structure)
      worksheetData.push([
        "Student ID",
        "Student Name",
        "Course",
        "Session",
        "Gender",
        "Guardian Name",
        "Guardian Contact",
        "Student Contact",
        "Address",
        "COLLEGE FEE (1ST YEAR)",
        "HOSTEL FEE (1ST YEAR)",
        "Total Fees (1ST YEAR)",
        "Scholarship (1ST YEAR)",
        "Net Fees (1ST YEAR)",
        "Total Paid (UPTO 4TH INS)",
        "Total Due (1ST YEAR)",
        "INS 1 TOTAL AMOUNT",
        "INS 1 PAID AMOUNT",
        "INS 1 DUE AMOUNT",
        "INS 2 TOTAL AMOUNT",
        "INS 2 PAID AMOUNT",
        "INS 2 DUE AMOUNT",
        "INS 3 TOTAL AMOUNT",
        "INS 3 PAID AMOUNT",
        "INS 3 DUE AMOUNT",
        "INS 4 TOTAL AMOUNT",
        "INS 4 PAID AMOUNT",
        "INS 4 DUE AMOUNT",
        "COLLEGE FEE (2ND YEAR)",
        "HOSTEL FEE (2ND YEAR)",
        "Total Fees (2ND YEAR)",
        "Scholarship (2ND YEAR)",
        "Net Fees (2ND YEAR)",
        "Total Paid (5 TO 8TH INS)",
        "Total DUE (2ND YEAR)",
        "INS 5 TOTAL AMOUNT",
        "INS 5 PAID AMOUNT",
        "INS 5 DUE AMOUNT",
        "INS 6 TOTAL AMOUNT",
        "INS 6 PAID AMOUNT",
        "INS 6 DUE AMOUNT",
        "INS 7 TOTAL AMOUNT",
        "INS 7 PAID AMOUNT",
        "INS 7 DUE AMOUNT",
        "INS 8 TOTAL AMOUNT",
        "INS 8 PAID AMOUNT",
        "INS 8 DUE AMOUNT",
        "COLLEGE FEE (3RD YEAR)",
        "HOSTEL FEE (3RD YEAR)",
        "Total Fees (3RD YEAR)",
        "Scholarship (3RD YEAR)",
        "Net Fees (3RD YEAR)",
        "Total Paid (9 TO 12TH INS)",
        "Total DUE (3RD YEAR)",
        "INS 9 TOTAL AMOUNT",
        "INS 9 PAID AMOUNT",
        "INS 9 DUE AMOUNT",
        "INS 10 TOTAL AMOUNT",
        "INS 10 PAID AMOUNT",
        "INS 10 DUE AMOUNT",
        "INS 11 TOTAL AMOUNT",
        "INS 11 PAID AMOUNT",
        "INS 11 DUE AMOUNT",
        "INS 12 TOTAL AMOUNT",
        "INS 12 PAID AMOUNT",
        "INS 12 DUE AMOUNT",
      ])

      // Process each student
      reportData.forEach((student) => {
        // Initialize year-wise data
        const years = {
          1: {
            collegeFee: 0,
            hostelFee: 0,
            scholarship: 0,
            installments: Array(4)
              .fill(null)
              .map(() => ({
                total: 0,
                paid: 0,
                due: 0,
              })),
          },
          2: {
            collegeFee: 0,
            hostelFee: 0,
            scholarship: 0,
            installments: Array(4)
              .fill(null)
              .map(() => ({
                total: 0,
                paid: 0,
                due: 0,
              })),
          },
          3: {
            collegeFee: 0,
            hostelFee: 0,
            scholarship: 0,
            installments: Array(4)
              .fill(null)
              .map(() => ({
                total: 0,
                paid: 0,
                due: 0,
              })),
          },
        }

        // Process each installment
        student.installments.forEach((installment) => {
          // Determine which year the installment belongs to (1-3)
          const year = Math.ceil(installment.installmentNo / 4)

          if (year >= 1 && year <= 3) {
            // Determine which installment within the year (1-4)
            const yearInstallment = (installment.installmentNo - 1) % 4

            // Update year totals
            years[year].collegeFee += installment.tuitionFees || 0
            years[year].hostelFee += installment.hostelFees || 0
            years[year].scholarship += installment.scholarship || 0

            // Update installment data
            years[year].installments[yearInstallment] = {
              total: installment.totalAmount,
              paid: installment.amountPaid,
              due: installment.balanceAmount,
            }
          }
        })

        // Calculate totals for each year
        for (const year of [1, 2, 3]) {
          years[year].totalFees = years[year].collegeFee + years[year].hostelFee
          years[year].netFees = years[year].totalFees - years[year].scholarship

          // Calculate total paid and due for the year
          years[year].totalPaid = years[year].installments.reduce((sum, ins) => sum + (ins?.paid || 0), 0)
          years[year].totalDue = years[year].installments.reduce((sum, ins) => sum + (ins?.due || 0), 0)
        }

        // Create row data matching the DETAIL REPORT.xlsx structure
        const row = [
          student.studentId,
          student.studentName,
          student.course,
          student.session,
          student.gender,
          student.guardianName,
          student.guardianContact,
          student.studentContact,
          student.address,
          // Year 1 data
          years[1].collegeFee,
          years[1].hostelFee,
          years[1].totalFees,
          years[1].scholarship,
          years[1].netFees,
          years[1].totalPaid,
          years[1].totalDue,
          // Year 1 installments
          ...years[1].installments.flatMap((ins) => [ins?.total || 0, ins?.paid || 0, ins?.due || 0]),
          // Year 2 data
          years[2].collegeFee,
          years[2].hostelFee,
          years[2].totalFees,
          years[2].scholarship,
          years[2].netFees,
          years[2].totalPaid,
          years[2].totalDue,
          // Year 2 installments
          ...years[2].installments.flatMap((ins) => [ins?.total || 0, ins?.paid || 0, ins?.due || 0]),
          // Year 3 data
          years[3].collegeFee,
          years[3].hostelFee,
          years[3].totalFees,
          years[3].scholarship,
          years[3].netFees,
          years[3].totalPaid,
          years[3].totalDue,
          // Year 3 installments
          ...years[3].installments.flatMap((ins) => [ins?.total || 0, ins?.paid || 0, ins?.due || 0]),
        ]

        worksheetData.push(row)
      })

      // Create workbook and worksheet
      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)

      // Set column widths
      const colWidths = [
        { wch: 10 }, // Student ID
        { wch: 25 }, // Student Name
        { wch: 15 }, // Course
        { wch: 10 }, // Session
        { wch: 10 }, // Gender
        { wch: 25 }, // Guardian Name
        { wch: 15 }, // Guardian Contact
        { wch: 15 }, // Student Contact
        { wch: 50 }, // Address
        // Year 1 columns
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        { wch: 15 },
        // Installments (12 columns x 3 years)
        ...Array(36).fill({ wch: 12 }),
        // Year 2 and 3 columns (same as year 1)
        ...Array(14).fill({ wch: 15 }),
        ...Array(36).fill({ wch: 12 }),
      ]
      ws["!cols"] = colWidths

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, "Fees Report")

      // Generate Excel file and download
      const date = new Date().toISOString().split("T")[0]
      const reportTypeText = reportType === "filtered" ? "Filtered" : "Full"
      XLSX.writeFile(wb, `${reportTypeText}_Fees_Report_${date}.xlsx`)
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

<Autocomplete
  options={distinctCourses}
  value={selectedCourse}
  onChange={handleCourseChange}
  renderInput={(params) => (
    <TextField {...params} label="Filter by Course" variant="outlined" size="small" />
  )}
  style={{ minWidth: 200 }}
  clearOnEscape
  isOptionEqualToValue={(option, value) => option === value}
  getOptionLabel={(option) => option || ""}
/>
          

          <ButtonGroup variant="contained" disabled={isDownloading}>
            <Button
              onClick={openFilteredReportDialog}
              startIcon={<FilterListIcon />}
              style={{
                backgroundColor: "#CC7A00",
                "&:hover": { backgroundColor: "#B8690A" },
              }}
            >
              Filtered Report
            </Button>
            <Button
              onClick={openFullReportDialog}
              startIcon={<DownloadIcon />}
              style={{
                backgroundColor: "#CC7A00",
                "&:hover": { backgroundColor: "#B8690A" },
              }}
            >
              Full Report
            </Button>
          </ButtonGroup>
          <TextField
            label="Search by Student ID or Name or Contact"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            style={{ minWidth: 300 }}
          />
        </div>
      </div>

      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student ID</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student Name</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student Contact No.</TableCell>
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
                <TableCell>{tx.StudentContactNo}</TableCell>
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

      {/* Download Report Dialog */}
      <Dialog
        open={downloadDialogOpen}
        onClose={handleCloseDownloadDialog}
        disableEscapeKeyDown={isDownloading}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box display="flex" alignItems="center" gap={2}>
            {reportType === "filtered" ? <FilterListIcon color="primary" /> : <DownloadIcon color="primary" />}
            {reportType === "filtered" ? "Generate Filtered Fees Report" : "Generate Full Fees Report"}
          </Box>
        </DialogTitle>
        <DialogContent>
          {reportType === "filtered" && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                Filter Report
              </Typography>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="course-filter-label">Course</InputLabel>
                <Select
                  labelId="course-filter-label"
                  value={reportFilters.course}
                  label="Course"
                  onChange={(e) => handleReportFilterChange("course", e.target.value)}
                >
                  <MenuItem value="">All Courses</MenuItem>
                  {distinctCourses.map((course) => (
                    <MenuItem key={course} value={course}>
                      {course}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth sx={{ mb: 2 }}>
                <InputLabel id="session-filter-label">Session</InputLabel>
                <Select
                  labelId="session-filter-label"
                  value={reportFilters.session}
                  label="Session"
                  onChange={(e) => handleReportFilterChange("session", e.target.value)}
                >
                  <MenuItem value="">All Sessions</MenuItem>
                  {distinctSessions.map((session) => (
                    <MenuItem key={session} value={session}>
                      {session}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Typography variant="subtitle1" gutterBottom>
                Installments (Leave unchecked for all)
              </Typography>
              <FormGroup row sx={{ mb: 2 }}>
                {installmentOptions.map((option) => (
                  <FormControlLabel
                    key={option.id}
                    control={
                      <Checkbox
                        checked={reportFilters.installments.includes(option.id)}
                        onChange={() => handleInstallmentToggle(option.id)}
                      />
                    }
                    label={option.label}
                  />
                ))}
              </FormGroup>
            </Box>
          )}

          {reportType === "full" && (
            <Box sx={{ mt: 2, mb: 3 }}>
              <Typography variant="body1" gutterBottom>
                This will generate a comprehensive report for all students with complete fee details.
              </Typography>
            </Box>
          )}

          {isDownloading && (
            <Box sx={{ width: "100%", mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                Processing students: {processedStudents} of {totalStudents}
              </Typography>
              <LinearProgress variant="determinate" value={downloadProgress} sx={{ height: 8, borderRadius: 4 }} />
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                {Math.round(downloadProgress)}% Complete
              </Typography>
            </Box>
          )}

          {!isDownloading && (
            <Typography variant="body2" color="text.secondary">
              Please wait while we generate your fees report. This may take a few minutes depending on the number of
              students.
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDownloadDialog} disabled={isDownloading}>
            Cancel
          </Button>
          <Button onClick={downloadFeesReport} disabled={isDownloading} variant="contained" color="primary">
            {isDownloading ? "Generating..." : "Generate Report"}
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
