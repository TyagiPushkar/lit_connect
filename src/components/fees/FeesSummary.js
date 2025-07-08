"use client"

import { useState, useEffect } from "react"
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Box,
  Typography,
  Autocomplete,
  TextField,
  Button,
  Snackbar,
  Card,
  CardContent,
  Grid,
  LinearProgress,
} from "@mui/material"
import axios from "axios"
import DownloadIcon from "@mui/icons-material/Download"
import SummarizeIcon from "@mui/icons-material/Summarize"
import * as XLSX from "xlsx"

const FeesSummaryOptimized = () => {
  const [loading, setLoading] = useState(true)
  const [loadingProgress, setLoadingProgress] = useState(0)
  const [loadingText, setLoadingText] = useState("Initializing...")
  const [summaryData, setSummaryData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedSession, setSelectedSession] = useState("")
  const [selectedBranch, setSelectedBranch] = useState("")
  const [distinctSessions, setDistinctSessions] = useState([])
  const [distinctBranches, setDistinctBranches] = useState([])
  const [openSnackbar, setOpenSnackbar] = useState(false)
  const [snackbarMessage, setSnackbarMessage] = useState("")

  useEffect(() => {
    fetchSummaryDataOptimized()
  }, [])

  useEffect(() => {
    applyFilters()
  }, [summaryData, selectedSession, selectedBranch])

  // 🚀 OPTIMIZED VERSION - Much Faster!
  const fetchSummaryDataOptimized = async () => {
    setLoading(true)
    setLoadingProgress(0)

    try {
      setLoadingText("Fetching students...")
      setLoadingProgress(10)

      // Step 1: Get all students
      const studentsResponse = await axios.get("http://139.5.190.143/LIT/src/students/get_student.php")

      if (!studentsResponse.data.success) {
        throw new Error("Failed to fetch student data")
      }

      const students = studentsResponse.data.data
      setLoadingProgress(20)
      setLoadingText(`Processing ${students.length} students...`)

      // Step 2: Batch process students in parallel (MUCH FASTER!)
      const BATCH_SIZE = 10 // Process 10 students at once
      const summaryMap = new Map()

      for (let i = 0; i < students.length; i += BATCH_SIZE) {
        const batch = students.slice(i, i + BATCH_SIZE)
        const progress = 20 + (i / students.length) * 70
        setLoadingProgress(progress)
        setLoadingText(
          `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(students.length / BATCH_SIZE)}...`,
        )

        // Process batch in parallel
        const batchPromises = batch.map((student) => processStudentOptimized(student))
        const batchResults = await Promise.allSettled(batchPromises)

        // Aggregate results
        batchResults.forEach((result, index) => {
          if (result.status === "fulfilled" && result.value) {
            const student = batch[index]
            const key = `${student.Session}-${student.Course}`

            if (!summaryMap.has(key)) {
              summaryMap.set(key, {
                session: student.Session || "Unknown",
                branch: student.Course || "Unknown",
                firstYear: { netFee: 0, paid: 0, due: 0 },
                secondYear: { netFee: 0, paid: 0, due: 0 },
                thirdYear: { netFee: 0, paid: 0, due: 0 },
                totalNetFee: 0,
                totalPaid: 0,
                totalDue: 0,
              })
            }

            const summary = summaryMap.get(key)
            const studentData = result.value

            // Aggregate student data into summary
            summary.firstYear.netFee += studentData.firstYear.netFee
            summary.firstYear.paid += studentData.firstYear.paid
            summary.firstYear.due += studentData.firstYear.due

            summary.secondYear.netFee += studentData.secondYear.netFee
            summary.secondYear.paid += studentData.secondYear.paid
            summary.secondYear.due += studentData.secondYear.due

            summary.thirdYear.netFee += studentData.thirdYear.netFee
            summary.thirdYear.paid += studentData.thirdYear.paid
            summary.thirdYear.due += studentData.thirdYear.due

            summary.totalNetFee += studentData.totalNetFee
            summary.totalPaid += studentData.totalPaid
            summary.totalDue += studentData.totalDue
          }
        })

        // Small delay to prevent overwhelming the server
        if (i + BATCH_SIZE < students.length) {
          await new Promise((resolve) => setTimeout(resolve, 100))
        }
      }

      setLoadingProgress(95)
      setLoadingText("Finalizing data...")

      const summaryArray = Array.from(summaryMap.values())
      setSummaryData(summaryArray)

      // Extract distinct values for filters
      const sessions = [...new Set(summaryArray.map((item) => item.session))].filter(Boolean)
      const branches = [...new Set(summaryArray.map((item) => item.branch))].filter(Boolean)

      setDistinctSessions(sessions)
      setDistinctBranches(branches)

      setLoadingProgress(100)
      setLoadingText("Complete!")
    } catch (error) {
      console.error("Error fetching summary data:", error)
      setSnackbarMessage("Error fetching summary data: " + error.message)
      setOpenSnackbar(true)
    } finally {
      setTimeout(() => setLoading(false), 500) // Small delay to show completion
    }
  }

  const processStudentOptimized = async (student) => {
    try {
      // Get fee structure with timeout
      const feeResponse = await axios.get(
        `http://139.5.190.143/LIT/src/fees/get_student_fee_structure.php?StudentId=${student.StudentID}`,
        { timeout: 10000 },
      )
  
      if (!feeResponse.data.success || !feeResponse.data.data) {
        return null
      }
  
      const feeStructure = feeResponse.data.data
      const studentSummary = {
        firstYear: { netFee: 0, paid: 0, due: 0 },
        secondYear: { netFee: 0, paid: 0, due: 0 },
        thirdYear: { netFee: 0, paid: 0, due: 0 },
        totalNetFee: 0,
        totalPaid: 0,
        totalDue: 0,
      }
  
      // Get all unique transaction IDs first
      const transactionIds = new Set()
      feeStructure.forEach((installment) => {
        if (installment.Paid && installment.Paid !== "0") {
          installment.Paid.split(",").forEach((id) => {
            if (id.trim()) transactionIds.add(id.trim())
          })
        }
      })
  
      // Fetch all transactions in parallel (MUCH FASTER!)
      const transactionPromises = Array.from(transactionIds).map(async (transactionId) => {
        try {
          const response = await axios.get(
            `http://139.5.190.143/LIT/src/fees/get_fee_transaction.php?id=${transactionId}`,
            { timeout: 5000 },
          )
          return response.data.success ? { id: transactionId, data: response.data.data } : null
        } catch (error) {
          console.error(`Error fetching transaction ${transactionId}:`, error)
          return null
        }
      })
  
      const transactionResults = await Promise.allSettled(transactionPromises)
      const transactionMap = new Map()
  
      transactionResults.forEach((result) => {
        if (result.status === "fulfilled" && result.value) {
          transactionMap.set(result.value.id, result.value.data)
        }
      })
  
      // Process installments
      feeStructure.forEach((installment) => {
        // Check if this installment has any regular fees (not just variable fees)
        const hasRegularFees = 
          Number(installment.tution_fees || 0) > 0 ||
          Number(installment.hostel_fees || 0) > 0 ||
          Number(installment.exam_fees || 0) > 0 ||
          Number(installment.admission_fees || 0) > 0 ||
          Number(installment.prospectus_fees || 0) > 0;
  
        // Skip installments that only have variable fees
        if (!hasRegularFees) {
          return;
        }
  
        const installmentTotal =
          Number(installment.tution_fees || 0) +
          Number(installment.exam_fees || 0) +
          Number(installment.hostel_fees || 0) +
          Number(installment.admission_fees || 0) +
          Number(installment.prospectus_fees || 0) -
          Number(installment.Scholarship || 0)
  
        const year = Math.ceil(Number(installment.installment) / 4)
        let yearData = studentSummary.firstYear
  
        if (year === 2) yearData = studentSummary.secondYear
        else if (year === 3) yearData = studentSummary.thirdYear
  
        yearData.netFee += installmentTotal
  
        if (installment.Paid && installment.Paid !== "0") {
          const transactionIds = installment.Paid.split(",").map((id) => id.trim())
          let totalPaid = 0
  
          transactionIds.forEach((transactionId) => {
            const transaction = transactionMap.get(transactionId)
            if (transaction) {
              // Only count payments for installments with regular fees
              totalPaid += Number(transaction.deposit_amount - transaction.variable_fees || 0)
            }
          })
  
          // Ensure we don't count more than the installment total
          const applicablePayment = Math.min(totalPaid, installmentTotal)
          yearData.paid += applicablePayment
          yearData.due += Math.max(0, installmentTotal - applicablePayment)
        } else {
          yearData.due += installmentTotal
        }
      })
  
      // Calculate totals
      studentSummary.totalNetFee =
        studentSummary.firstYear.netFee + studentSummary.secondYear.netFee + studentSummary.thirdYear.netFee
      studentSummary.totalPaid =
        studentSummary.firstYear.paid + studentSummary.secondYear.paid + studentSummary.thirdYear.paid
      studentSummary.totalDue =
        studentSummary.firstYear.due + studentSummary.secondYear.due + studentSummary.thirdYear.due
  
      return studentSummary
    } catch (error) {
      console.error(`Error processing student ${student.StudentID}:`, error)
      return null
    }
  }

  const applyFilters = () => {
    let filtered = summaryData

    if (selectedSession) {
      filtered = filtered.filter((item) => item.session === selectedSession)
    }

    if (selectedBranch) {
      filtered = filtered.filter((item) => item.branch === selectedBranch)
    }

    setFilteredData(filtered)
  }

  const calculateTotals = () => {
    return filteredData.reduce(
      (totals, item) => ({
        firstYear: {
          netFee: totals.firstYear.netFee + item.firstYear.netFee,
          paid: totals.firstYear.paid + item.firstYear.paid,
          due: totals.firstYear.due + item.firstYear.due,
        },
        secondYear: {
          netFee: totals.secondYear.netFee + item.secondYear.netFee,
          paid: totals.secondYear.paid + item.secondYear.paid,
          due: totals.secondYear.due + item.secondYear.due,
        },
        thirdYear: {
          netFee: totals.thirdYear.netFee + item.thirdYear.netFee,
          paid: totals.thirdYear.paid + item.thirdYear.paid,
          due: totals.thirdYear.due + item.thirdYear.due,
        },
        totalNetFee: totals.totalNetFee + item.totalNetFee,
        totalPaid: totals.totalPaid + item.totalPaid,
        totalDue: totals.totalDue + item.totalDue,
      }),
      {
        firstYear: { netFee: 0, paid: 0, due: 0 },
        secondYear: { netFee: 0, paid: 0, due: 0 },
        thirdYear: { netFee: 0, paid: 0, due: 0 },
        totalNetFee: 0,
        totalPaid: 0,
        totalDue: 0,
      },
    )
  }

  const exportToExcel = () => {
    try {
      const totals = calculateTotals()

      const worksheetData = [
        [
          "SESSION",
          "BRANCH",
          "1ST YEAR NET FEE",
          "PAID (1ST YEAR)",
          "DUE (1ST YEAR)",
          "2ND YEAR NET FEE",
          "PAID (2ND YEAR)",
          "DUE (2ND YEAR)",
          "3RD YEAR NET FEE",
          "PAID (3RD YEAR)",
          "DUE (3RD YEAR)",
          "TOTAL NET FEE",
          "TOTAL PAID",
          "TOTAL DUE",
        ],
        ...filteredData.map((item) => [
          item.session,
          item.branch,
          item.firstYear.netFee,
          item.firstYear.paid,
          item.firstYear.due,
          item.secondYear.netFee,
          item.secondYear.paid,
          item.secondYear.due,
          item.thirdYear.netFee,
          item.thirdYear.paid,
          item.thirdYear.due,
          item.totalNetFee,
          item.totalPaid,
          item.totalDue,
        ]),
        [
          "TOTAL",
          "",
          totals.firstYear.netFee,
          totals.firstYear.paid,
          totals.firstYear.due,
          totals.secondYear.netFee,
          totals.secondYear.paid,
          totals.secondYear.due,
          totals.thirdYear.netFee,
          totals.thirdYear.paid,
          totals.thirdYear.due,
          totals.totalNetFee,
          totals.totalPaid,
          totals.totalDue,
        ],
      ]

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.aoa_to_sheet(worksheetData)
      ws["!cols"] = Array(14).fill({ wch: 15 })
      XLSX.utils.book_append_sheet(wb, ws, "Fees Summary")

      const date = new Date().toISOString().split("T")[0]
      XLSX.writeFile(wb, `Fees_Summary_${date}.xlsx`)

      setSnackbarMessage("Summary report exported successfully!")
      setOpenSnackbar(true)
    } catch (error) {
      setSnackbarMessage("Error exporting summary report")
      setOpenSnackbar(true)
    }
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const totals = calculateTotals()

  const statsCards = [
    { title: "Total Net Fees", value: totals.totalNetFee, color: "#1976d2", icon: "💰" },
    { title: "Total Paid", value: totals.totalPaid, color: "#2e7d32", icon: "✅" },
    { title: "Total Due", value: totals.totalDue, color: "#d32f2f", icon: "⏰" },
    {
      title: "Collection Rate",
      value: totals.totalNetFee > 0 ? (totals.totalPaid / totals.totalNetFee) * 100 : 0,
      color: "#ed6c02",
      icon: "📊",
    },
  ]

  if (loading) {
    return (
      <Box display="flex" flexDirection="column" justifyContent="center" alignItems="center" height="60vh" gap={3}>
        <CircularProgress size={60} thickness={5} />
        <Box width="300px">
          <Typography variant="body1" align="center" gutterBottom>
            {loadingText}
          </Typography>
          <LinearProgress variant="determinate" value={loadingProgress} sx={{ height: 8, borderRadius: 4 }} />
          <Typography variant="body2" color="textSecondary" align="center" sx={{ mt: 1 }}>
            {Math.round(loadingProgress)}% Complete
          </Typography>
        </Box>
      </Box>
    )
  }

  return (
    <div style={{ padding: "20px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
        <Typography variant="h4" style={{ color: "#CC7A00", fontWeight: "bold" }}>
          <SummarizeIcon style={{ marginRight: 10, verticalAlign: "middle" }} />
          Fees Summary Report
        </Typography>
        <Button
          variant="contained"
          startIcon={<DownloadIcon />}
          onClick={exportToExcel}
          style={{ backgroundColor: "#CC7A00" }}
          sx={{ "&:hover": { backgroundColor: "#B8690A" } }}
        >
          Export Summary
        </Button>
      </div>

      {/* Stats Cards */}
      <Grid container spacing={3} style={{ marginBottom: 30 }}>
        {statsCards.map((card, index) => (
          <Grid item xs={12} sm={6} md={3} key={index}>
            <Card elevation={3}>
              <CardContent>
                <Box display="flex" alignItems="center" justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" style={{ color: card.color, fontWeight: "bold" }}>
                      {card.title === "Collection Rate" ? `${card.value.toFixed(1)}%` : formatCurrency(card.value)}
                    </Typography>
                    <Typography variant="body2" color="textSecondary">
                      {card.title}
                    </Typography>
                  </Box>
                  <Typography variant="h4">{card.icon}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Filters */}
      <div style={{ display: "flex", gap: "20px", marginBottom: 20, alignItems: "center" }}>
        <Autocomplete
          options={distinctSessions}
          value={selectedSession}
          onChange={(_, newValue) => setSelectedSession(newValue || "")}
          renderInput={(params) => <TextField {...params} label="Filter by Session" variant="outlined" size="small" />}
          style={{ minWidth: 200 }}
          clearOnEscape
        />

        <Autocomplete
          options={distinctBranches}
          value={selectedBranch}
          onChange={(_, newValue) => setSelectedBranch(newValue || "")}
          renderInput={(params) => <TextField {...params} label="Filter by Branch" variant="outlined" size="small" />}
          style={{ minWidth: 200 }}
          clearOnEscape
        />

        <Typography variant="body2" color="textSecondary">
          Showing {filteredData.length} records
        </Typography>
      </div>

      {/* Summary Table */}
      <div style={{ overflowX: "auto", width: "100%" }}>
      <TableContainer component={Paper} elevation={3}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>SESSION</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>BRANCH</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold", textAlign: "center" }} colSpan={3}>
                1ST YEAR
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold", textAlign: "center" }} colSpan={3}>
                2ND YEAR
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold", textAlign: "center" }} colSpan={3}>
                3RD YEAR
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold", textAlign: "center" }} colSpan={3}>
                TOTAL
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell style={{ backgroundColor: "#CC7A00" }}></TableCell>
              <TableCell style={{ backgroundColor: "#CC7A00" }}></TableCell>
              {Array(4)
                .fill(null)
                .map((_, yearIndex) =>
                  Array(3)
                    .fill(null)
                    .map((_, colIndex) => (
                      <TableCell
                        key={`${yearIndex}-${colIndex}`}
                        style={{ color: "white", fontWeight: "bold", backgroundColor: "#CC7A00" }}
                      >
                        {colIndex === 0 ? "NET FEE" : colIndex === 1 ? "PAID" : "DUE"}
                      </TableCell>
                    )),
                )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredData.map((row, index) => (
              <TableRow
                key={`${row.session}-${row.branch}`}
                style={{ backgroundColor: index % 2 === 0 ? "#f9f9f9" : "white" }}
              >
                <TableCell style={{ fontWeight: "bold" }}>{row.session}</TableCell>
                <TableCell style={{ fontWeight: "bold" }}>{row.branch}</TableCell>
                <TableCell style={{ textAlign: "right" }}>{formatCurrency(row.firstYear.netFee)}</TableCell>
                <TableCell style={{ textAlign: "right", color: "#2e7d32" }}>
                  {formatCurrency(row.firstYear.paid)}
                </TableCell>
                <TableCell style={{ textAlign: "right", color: "#d32f2f" }}>
                  {formatCurrency(row.firstYear.due)}
                </TableCell>
                <TableCell style={{ textAlign: "right" }}>{formatCurrency(row.secondYear.netFee)}</TableCell>
                <TableCell style={{ textAlign: "right", color: "#2e7d32" }}>
                  {formatCurrency(row.secondYear.paid)}
                </TableCell>
                <TableCell style={{ textAlign: "right", color: "#d32f2f" }}>
                  {formatCurrency(row.secondYear.due)}
                </TableCell>
                <TableCell style={{ textAlign: "right" }}>{formatCurrency(row.thirdYear.netFee)}</TableCell>
                <TableCell style={{ textAlign: "right", color: "#2e7d32" }}>
                  {formatCurrency(row.thirdYear.paid)}
                </TableCell>
                <TableCell style={{ textAlign: "right", color: "#d32f2f" }}>
                  {formatCurrency(row.thirdYear.due)}
                </TableCell>
                <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>
                  {formatCurrency(row.totalNetFee)}
                </TableCell>
                <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#2e7d32" }}>
                  {formatCurrency(row.totalPaid)}
                </TableCell>
                <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#d32f2f" }}>
                  {formatCurrency(row.totalDue)}
                </TableCell>
              </TableRow>
            ))}
            {/* Totals Row */}
            <TableRow style={{ backgroundColor: "#e0e0e0", fontWeight: "bold" }}>
              <TableCell style={{ fontWeight: "bold", fontSize: "1.1em" }}>TOTAL</TableCell>
              <TableCell></TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatCurrency(totals.firstYear.netFee)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#2e7d32" }}>
                {formatCurrency(totals.firstYear.paid)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#d32f2f" }}>
                {formatCurrency(totals.firstYear.due)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatCurrency(totals.secondYear.netFee)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#2e7d32" }}>
                {formatCurrency(totals.secondYear.paid)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#d32f2f" }}>
                {formatCurrency(totals.secondYear.due)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold" }}>
                {formatCurrency(totals.thirdYear.netFee)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#2e7d32" }}>
                {formatCurrency(totals.thirdYear.paid)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", color: "#d32f2f" }}>
                {formatCurrency(totals.thirdYear.due)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", fontSize: "1.1em" }}>
                {formatCurrency(totals.totalNetFee)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", fontSize: "1.1em", color: "#2e7d32" }}>
                {formatCurrency(totals.totalPaid)}
              </TableCell>
              <TableCell style={{ textAlign: "right", fontWeight: "bold", fontSize: "1.1em", color: "#d32f2f" }}>
                {formatCurrency(totals.totalDue)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </TableContainer>
</div>
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </div>
  )
}

export default FeesSummaryOptimized
