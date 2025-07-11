"use client"

import { useEffect, useState } from "react"
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Avatar,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Alert,
  Chip,
} from "@mui/material"
import { useParams, useNavigate } from "react-router-dom"
import logo from "../../assets/images (1).png"

function StudentReports() {
  const { studentId } = useParams()
  const navigate = useNavigate()

  // Student data state
  const [student, setStudent] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  // Report filters state
  const [selectedCategory, setSelectedCategory] = useState("")
  const [selectedSemester, setSelectedSemester] = useState("")
  const [selectedSubCategory, setSelectedSubCategory] = useState("")
  const [availableSemesters, setAvailableSemesters] = useState([])
  const [subCategories, setSubCategories] = useState([])

  // Report data state
  const [allReportsData, setAllReportsData] = useState({})
  const [reportData, setReportData] = useState([])
  const [reportLoading, setReportLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [reportType, setReportType] = useState("")
  const [showComparison, setShowComparison] = useState(true)

  const categories = ["Assignment", "Internal", "Class Test", "CBT"]

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`,
        )
        const json = await res.json()
        if (json.success && json.data) {
          setStudent(json.data)

          // Set available semesters based on student's current semester
          const currentSem = Number.parseInt(json.data.Sem) || 1
          const semesters = Array.from({ length: currentSem }, (_, i) => (i + 1).toString())
          setAvailableSemesters(semesters)

          // Auto-load all reports for current semester
          await fetchAllReportsForSemester(json.data, currentSem.toString())
        } else {
          setError("Student not found.")
        }
      } catch (err) {
        setError("Error fetching student data.")
      } finally {
        setLoading(false)
      }
    }
    fetchStudent()
  }, [studentId])

  const fetchAllReportsForSemester = async (studentData, semester) => {
    setReportLoading(true)
    const studId = studentData.StudentID
    const course = studentData.Course

    const reportPromises = {
      Assignment: fetch(
        `https://namami-infotech.com/LIT/src/report/assignment_report.php?StudId=${studId}&Course=${course}&Semester=${semester}`,
      ),
      Internal: fetch(
        `https://namami-infotech.com/LIT/src/report/internal_exam_report.php?StudId=${studId}&Course=${course}&Sem=${semester}`,
      ),
    }

    try {
      const results = await Promise.allSettled(
        Object.entries(reportPromises).map(async ([key, promise]) => {
          const response = await promise
          const data = await response.json()
          return { key, data: data.success && data.data ? data.data : [] }
        }),
      )

      const allData = {}
      results.forEach((result) => {
        if (result.status === "fulfilled") {
          allData[result.value.key] = result.value.data
        }
      })

      setAllReportsData(allData)
      setShowComparison(true)
    } catch (err) {
      console.error("Error fetching all reports:", err)
    } finally {
      setReportLoading(false)
    }
  }

  const handleCategoryChange = (category) => {
    setSelectedCategory(category)
    setSelectedSubCategory("")
    setShowComparison(false)

    if (category === "Class Test") {
      setSubCategories(["CT 1", "CT 2", "CT 3", "CT 4", "CT 5", "CT6"])
    } else if (category === "CBT") {
      setSubCategories(["1", "2", "3", "4", "5", "6"])
    } else {
      setSubCategories([])
    }
  }

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester)
    setShowComparison(false)

    // If no category selected, fetch all reports for new semester
    if (!selectedCategory) {
      fetchAllReportsForSemester(student, semester)
      setShowComparison(true)
    }
  }

  const handleSearch = async () => {
    if (!selectedCategory || !selectedSemester) {
      alert("Please select both category and semester")
      return
    }

    if ((selectedCategory === "Class Test" || selectedCategory === "CBT") && !selectedSubCategory) {
      alert(`Please select ${selectedCategory === "Class Test" ? "Test Number" : "CBT Number"}`)
      return
    }

    setReportLoading(true)
    setHasSearched(true)
    setShowComparison(false)

    try {
      let apiUrl = ""
      const studId = student.StudentID
      const course = student.Course
      const sem = selectedSemester

      // Construct API URL based on category
      if (selectedCategory === "Assignment") {
        apiUrl = `https://namami-infotech.com/LIT/src/report/assignment_report.php?StudId=${studId}&Course=${course}&Semester=${sem}`
      } else if (selectedCategory === "Internal") {
        apiUrl = `https://namami-infotech.com/LIT/src/report/internal_exam_report.php?StudId=${studId}&Course=${course}&Sem=${sem}`
      } else if (selectedCategory === "Class Test") {
        apiUrl = `https://namami-infotech.com/LIT/src/report/class_test_report.php?StudId=${studId}&Course=${course}&Sem=${sem}&Category=${selectedSubCategory}`
      } else if (selectedCategory === "CBT") {
        apiUrl = `https://namami-infotech.com/LIT/src/report/cbt_report.php?StudId=${studId}&Course=${course}&Sem=${sem}&Category=${selectedSubCategory}`
      }

      const response = await fetch(apiUrl)
      const jsonData = await response.json()

      if (jsonData.success && jsonData.data) {
        setReportData(jsonData.data)
      } else {
        setReportData([])
      }
      setReportType(selectedCategory)
    } catch (err) {
      setReportData([])
      alert("Failed to fetch report data. Please try again.")
    } finally {
      setReportLoading(false)
    }
  }

  const handleShowAll = () => {
    const currentSem = selectedSemester || student?.Sem || "1"
    fetchAllReportsForSemester(student, currentSem)
    setSelectedCategory("")
    setSelectedSubCategory("")
    setHasSearched(false)
  }

  const getPercentageColor = (percentage) => {
    if (percentage >= 75) return "#2e7d32"
    if (percentage >= 60) return "#f57c00"
    return "#d32f2f"
  }

  const calculateTotals = (data) => {
    let totalMax = 0
    let totalObtained = 0

    data.forEach((row) => {
      totalMax += Number.parseInt(row.MaxMarks) || 0
      totalObtained += Number.parseInt(row.ObtainedMarks) || 0
    })

    const percentage = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    return { totalMax, totalObtained, percentage }
  }

  const calculateAttendanceTotal = (data) => {
    let totalClasses = 0
    let totalPresent = 0

    data.forEach((row) => {
      totalClasses += Number.parseInt(row.NoOfClasses) || 0
      totalPresent += Number.parseInt(row.PresentClass) || 0
    })

    const percentage = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0
    return { totalClasses, totalPresent, percentage }
  }

  const renderStudentInfoCard = () => (
    <Card sx={{ mb: 3, borderRadius: 3, boxShadow: 4 }}>
      <CardContent
        sx={{
          background: "linear-gradient(135deg, #CC7A00 0%, #FF9800 100%)",
          color: "white",
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item>
            <Avatar
              src={student?.Photo || ""}
              sx={{
                width: 80,
                height: 80,
                border: "3px solid white",
                boxShadow: 3,
              }}
            >
              {student?.CandidateName?.charAt(0)}
            </Avatar>
          </Grid>
          <Grid item xs>
            <Typography variant="h6" sx={{ fontWeight: 700, mb: 1 }}>
              {student?.CandidateName || "N/A"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              ID: {student?.StudentID || "N/A"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Course: {student?.Course || "N/A"}
            </Typography>
            <Typography variant="body2" sx={{ opacity: 0.9 }}>
              Current Semester: {student?.Sem || "N/A"}
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  )

  const renderFilterSection = () => (
    <Paper sx={{ p: 3, mb: 3, borderRadius: 3, boxShadow: 2 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ color: "#CC7A00", fontWeight: 700 }}>
          Filter Reports
        </Typography>
        <Button variant="outlined" onClick={handleShowAll} sx={{ color: "#CC7A00", borderColor: "#CC7A00" }}>
          Show All Current Semester
        </Button>
      </Box>
      <Grid container spacing={2} alignItems="center">
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Semester</InputLabel>
            <Select value={selectedSemester} label="Semester" onChange={(e) => handleSemesterChange(e.target.value)}>
              {availableSemesters.map((sem) => (
                <MenuItem key={sem} value={sem}>
                  Semester {sem}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        <Grid item xs={12} sm={3}>
          <FormControl fullWidth size="small">
            <InputLabel>Category</InputLabel>
            <Select value={selectedCategory} label="Category" onChange={(e) => handleCategoryChange(e.target.value)}>
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>
        {(selectedCategory === "Class Test" || selectedCategory === "CBT") && (
          <Grid item xs={12} sm={3}>
            <FormControl fullWidth size="small">
              <InputLabel>{selectedCategory === "Class Test" ? "Select Test" : "Select CBT"}</InputLabel>
              <Select
                value={selectedSubCategory}
                label={selectedCategory === "Class Test" ? "Select Test" : "Select CBT"}
                onChange={(e) => setSelectedSubCategory(e.target.value)}
              >
                {subCategories.map((sub) => (
                  <MenuItem key={sub} value={sub}>
                    {sub}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        )}
        <Grid item xs={12} sm={3}>
          <Button
            variant="contained"
            onClick={handleSearch}
            disabled={reportLoading || !selectedCategory}
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#B8690A" },
              height: 40,
            }}
            fullWidth
          >
            {reportLoading ? <CircularProgress size={20} color="inherit" /> : "Search"}
          </Button>
        </Grid>
      </Grid>
    </Paper>
  )

  const renderComparisonTable = () => {
    if (reportLoading) {
      return (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <CircularProgress sx={{ color: "#CC7A00" }} />
          <Typography sx={{ mt: 2 }}>Loading all reports...</Typography>
        </Paper>
      )
    }

    const currentSem = selectedSemester || student?.Sem || "1"

    return (
      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: "12px 12px 0 0" }}>
          <Typography variant="h6" sx={{ color: "#CC7A00", fontWeight: 700 }}>
            Academic Performance Summary - Semester {currentSem}
          </Typography>
        </Box>

        <Box sx={{ p: 3 }}>
          <Grid container spacing={3}>
            {/* Assignment Summary */}
            {allReportsData.Assignment && allReportsData.Assignment.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#CC7A00", mb: 2, fontWeight: 600 }}>
                      📋 Assignment Report
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {(() => {
                        const totals = calculateAttendanceTotal(allReportsData.Assignment)
                        return (
                          <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                            <Typography
                              variant="h4"
                              sx={{ color: getPercentageColor(totals.percentage), fontWeight: 700 }}
                            >
                              {totals.percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Overall Attendance ({totals.totalPresent}/{totals.totalClasses})
                            </Typography>
                          </Box>
                        )
                      })()}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Months: {allReportsData.Assignment.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}

            {/* Internal Exam Summary */}
            {allReportsData.Internal && allReportsData.Internal.length > 0 && (
              <Grid item xs={12} md={6}>
                <Card sx={{ borderRadius: 2, border: "1px solid #e0e0e0" }}>
                  <CardContent>
                    <Typography variant="h6" sx={{ color: "#CC7A00", mb: 2, fontWeight: 600 }}>
                      📝 Internal Exam Report
                    </Typography>
                    <Box sx={{ mb: 2 }}>
                      {(() => {
                        const totals = calculateTotals(allReportsData.Internal)
                        return (
                          <Box sx={{ textAlign: "center", p: 2, backgroundColor: "#f8f9fa", borderRadius: 2 }}>
                            <Typography
                              variant="h4"
                              sx={{ color: getPercentageColor(totals.percentage), fontWeight: 700 }}
                            >
                              {totals.percentage.toFixed(1)}%
                            </Typography>
                            <Typography variant="body2" color="textSecondary">
                              Overall Score ({totals.totalObtained}/{totals.totalMax})
                            </Typography>
                          </Box>
                        )
                      })()}
                    </Box>
                    <Typography variant="body2" color="textSecondary">
                      Total Subjects: {allReportsData.Internal.length}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            )}
          </Grid>

          {/* Detailed Tables */}
          <Box sx={{ mt: 4 }}>
            {allReportsData.Assignment && allReportsData.Assignment.length > 0 && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="h6" sx={{ color: "#CC7A00", mb: 2, fontWeight: 600 }}>
                  Assignment Details
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#fafafa" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Attendance</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allReportsData.Assignment.map((row, index) => {
                        const noOfClasses = Number.parseInt(row.NoOfClasses) || 0
                        const presentClass = Number.parseInt(row.PresentClass) || 0
                        const percentage = noOfClasses > 0 ? (presentClass / noOfClasses) * 100 : 0

                        return (
                          <TableRow key={index} hover>
                            <TableCell>{row.Month}</TableCell>
                            <TableCell>
                              {presentClass} / {noOfClasses}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${percentage.toFixed(1)}%`}
                                size="small"
                                sx={{
                                  backgroundColor: getPercentageColor(percentage),
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}

            {allReportsData.Internal && allReportsData.Internal.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ color: "#CC7A00", mb: 2, fontWeight: 600 }}>
                  Internal Exam Details
                </Typography>
                <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#fafafa" }}>
                        <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                        <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {allReportsData.Internal.map((row, index) => {
                        const maxMarks = Number.parseInt(row.MaxMarks) || 0
                        const obtainedMarks = Number.parseInt(row.ObtainedMarks) || 0
                        const percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0

                        return (
                          <TableRow key={index} hover>
                            <TableCell>{row.Subject}</TableCell>
                            <TableCell>
                              {obtainedMarks} / {maxMarks}
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={`${percentage.toFixed(1)}%`}
                                size="small"
                                sx={{
                                  backgroundColor: getPercentageColor(percentage),
                                  color: "white",
                                  fontWeight: 600,
                                }}
                              />
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              </Box>
            )}
          </Box>
        </Box>
      </Paper>
    )
  }

  const renderFilteredReportTable = () => {
    if (!hasSearched) {
      return null
    }

    if (reportLoading) {
      return (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <CircularProgress sx={{ color: "#CC7A00" }} />
        </Paper>
      )
    }

    if (!reportData || reportData.length === 0) {
      return (
        <Paper sx={{ p: 4, textAlign: "center", borderRadius: 3 }}>
          <Typography variant="h6" color="textSecondary">
            No Data Available
          </Typography>
          <Typography variant="body2" color="textSecondary">
            No records found for the selected criteria
          </Typography>
        </Paper>
      )
    }

    const totals = reportType !== "Assignment" ? calculateTotals(reportData) : calculateAttendanceTotal(reportData)

    return (
      <Paper sx={{ borderRadius: 3, boxShadow: 2 }}>
        <Box sx={{ p: 2, backgroundColor: "#f5f5f5", borderRadius: "12px 12px 0 0" }}>
          <Typography variant="h6" sx={{ color: "#CC7A00", fontWeight: 700 }}>
            {reportType} Report {selectedSubCategory && `- ${selectedSubCategory}`}
          </Typography>
        </Box>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#fafafa" }}>
                {reportType === "Assignment" ? (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Month</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Attendance</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                  </>
                ) : (
                  <>
                    <TableCell sx={{ fontWeight: 700 }}>Subject</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Marks</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Percentage</TableCell>
                  </>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row, index) => {
                let percentage = 0
                let displayText = ""

                if (reportType === "Assignment") {
                  const noOfClasses = Number.parseInt(row.NoOfClasses) || 0
                  const presentClass = Number.parseInt(row.PresentClass) || 0
                  percentage = noOfClasses > 0 ? (presentClass / noOfClasses) * 100 : 0
                  displayText = `${presentClass} / ${noOfClasses}`
                } else {
                  const maxMarks = Number.parseInt(row.MaxMarks) || 0
                  const obtainedMarks = Number.parseInt(row.ObtainedMarks) || 0
                  percentage = maxMarks > 0 ? (obtainedMarks / maxMarks) * 100 : 0
                  displayText = `${obtainedMarks} / ${maxMarks}`
                }

                return (
                  <TableRow key={index} hover>
                    <TableCell>{reportType === "Assignment" ? row.Month : row.Subject}</TableCell>
                    <TableCell>{displayText}</TableCell>
                    <TableCell>
                      <Chip
                        label={`${percentage.toFixed(1)}%`}
                        size="small"
                        sx={{
                          backgroundColor: getPercentageColor(percentage),
                          color: "white",
                          fontWeight: 600,
                        }}
                      />
                    </TableCell>
                  </TableRow>
                )
              })}
              {totals && (
                <TableRow sx={{ backgroundColor: "#e8f5e8" }}>
                  <TableCell sx={{ fontWeight: 700 }}>Total</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>
                    {reportType === "Assignment"
                      ? `${totals.totalPresent} / ${totals.totalClasses}`
                      : `${totals.totalObtained} / ${totals.totalMax}`}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={`${totals.percentage.toFixed(1)}%`}
                      size="small"
                      sx={{
                        backgroundColor: getPercentageColor(totals.percentage),
                        color: "white",
                        fontWeight: 700,
                      }}
                    />
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    )
  }

  if (loading) return <CircularProgress sx={{ mt: 5 }} />

  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 5 }}>
        {error}
      </Alert>
    )
  }

  return (
    <Box sx={{ p: 2, pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ color: "#CC7A00", borderColor: "#CC7A00" }}>
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#CC7A00" }}>
              Lakshay Institute Of Technology
            </Typography>
            <Typography variant="subtitle1">Student Reports: {student?.StudentID}</Typography>
          </Box>
        </Box>
        <Avatar src={logo} alt="Logo" variant="rounded" sx={{ width: 80, height: 80 }} />
      </Box>

      {/* Student Info Card */}
      {renderStudentInfoCard()}

      {/* Filter Section */}
      {renderFilterSection()}

      {/* Report Display */}
      {showComparison ? renderComparisonTable() : renderFilteredReportTable()}
    </Box>
  )
}

export default StudentReports
