"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Typography,
  Grid,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Divider,
  useTheme,
  useMediaQuery,
} from "@mui/material"
import axios from "axios"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"

function DashboardData() {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))
  const [dashboardData, setDashboardData] = useState(null)
  const [selectedSession, setSelectedSession] = useState("")
  const [availableSessions, setAvailableSessions] = useState([])
  const [selectedCourse, setSelectedCourse] = useState("ALL_COURSES")
  const [availableCourses, setAvailableCourses] = useState([])

  const handleSessionChange = (event) => {
    setSelectedSession(event.target.value)
  }

  const handleCourseChange = (event) => {
    setSelectedCourse(event.target.value)
  }

  useEffect(() => {
    fetchDashboardData()
  }, [])

  // Update available courses when session changes
  useEffect(() => {
    if (dashboardData && selectedSession) {
      const coursesForSession = dashboardData.feesBySessionCourse
        .filter((fee) => fee.session === selectedSession)
        .map((fee) => fee.course)

      const uniqueCourses = [...new Set(coursesForSession)]
      setAvailableCourses(uniqueCourses)

      // Always default to "ALL_COURSES" when session changes
      setSelectedCourse("ALL_COURSES")
    }
  }, [selectedSession, dashboardData])

  const fetchDashboardData = async () => {
    try {
      // Ensure this URL points to your updated PHP API
      const response = await axios.get("https://namami-infotech.com/LIT/src/menu/admin_dash.php")

      if (response.data.success) {
        setDashboardData(response.data.data)

        // Extract available sessions from feesBySession
        const sessions = response.data.data.feesBySession?.map((fee) => fee.session) || []
        const uniqueSessions = [...new Set(sessions)]
        const sortedSessions = uniqueSessions.sort((a, b) => b.localeCompare(a))
        setAvailableSessions(sortedSessions)

        // Set default session
        if (sortedSessions.length > 0 && !selectedSession) {
          setSelectedSession(sortedSessions[0])
        }
      }
    } catch (error) {
      console.error("Error fetching dashboard data:", error)
    }
  }

  const getSelectedFees = () => {
  if (!dashboardData || !selectedSession) return null

  let fees = {
    netFee: 0,
    paid: 0,
    due: 0,
    firstYearNetFee: 0,
    firstYearPaid: 0,
    firstYearDue: 0,
    secondYearNetFee: 0,
    secondYearPaid: 0,
    secondYearDue: 0,
    thirdYearNetFee: 0,
    thirdYearPaid: 0,
    thirdYearDue: 0,
  }

  if (selectedCourse === "ALL_COURSES") {
    // Aggregate fees across all courses for the selected session
    const courseFees = dashboardData.feesBySessionCourse.filter(
      (fee) => fee.session === selectedSession
    )

    courseFees.forEach((fee) => {
      fees.netFee += Number.parseFloat(fee.netFee || 0)
      fees.paid += Number.parseFloat(fee.paid || 0)
      fees.due += Number.parseFloat(fee.due || 0)
      fees.firstYearNetFee += Number.parseFloat(fee.firstYearNetFee || 0)
      fees.firstYearPaid += Number.parseFloat(fee.firstYearPaid || 0)
      fees.firstYearDue += Number.parseFloat(fee.firstYearDue || 0)
      fees.secondYearNetFee += Number.parseFloat(fee.secondYearNetFee || 0)
      fees.secondYearPaid += Number.parseFloat(fee.secondYearPaid || 0)
      fees.secondYearDue += Number.parseFloat(fee.secondYearDue || 0)
      fees.thirdYearNetFee += Number.parseFloat(fee.thirdYearNetFee || 0)
      fees.thirdYearPaid += Number.parseFloat(fee.thirdYearPaid || 0)
      fees.thirdYearDue += Number.parseFloat(fee.thirdYearDue || 0)
    })
  } else {
    // Get fees for specific course
    const feeData = dashboardData.feesBySessionCourse.find(
      (fee) => fee.session === selectedSession && fee.course === selectedCourse
    )

    if (feeData) {
      fees = {
        netFee: Number.parseFloat(feeData.netFee || 0),
        paid: Number.parseFloat(feeData.paid || 0),
        due: Number.parseFloat(feeData.due || 0),
        firstYearNetFee: Number.parseFloat(feeData.firstYearNetFee || 0),
        firstYearPaid: Number.parseFloat(feeData.firstYearPaid || 0),
        firstYearDue: Number.parseFloat(feeData.firstYearDue || 0),
        secondYearNetFee: Number.parseFloat(feeData.secondYearNetFee || 0),
        secondYearPaid: Number.parseFloat(feeData.secondYearPaid || 0),
        secondYearDue: Number.parseFloat(feeData.secondYearDue || 0),
        thirdYearNetFee: Number.parseFloat(feeData.thirdYearNetFee || 0),
        thirdYearPaid: Number.parseFloat(feeData.thirdYearPaid || 0),
        thirdYearDue: Number.parseFloat(feeData.thirdYearDue || 0),
      }
    }
  }

  return fees
}

  // Process data for all charts
  const processChartData = () => {
    if (!dashboardData) return null

    // Get fees data first
    const fees = getSelectedFees()

    // Student Distribution Bar Chart data
    let selectedSessionData = []
    if (selectedCourse === "ALL_COURSES") {
      selectedSessionData = dashboardData.studentsBySessionCourse
        .filter((item) => item.Session === selectedSession)
        .map((item) => ({
          name: item.Course,
          students: item.TotalStudents,
        }))
    } else {
      const courseData = dashboardData.studentsBySessionCourse.find(
        (item) => item.Session === selectedSession && item.Course === selectedCourse,
      )
      if (courseData) {
        selectedSessionData = [
          {
            name: courseData.Course,
            students: courseData.TotalStudents,
          },
        ]
      }
    }

    // Employee attendance data for pie chart
    const employeeData = [
      { name: "Present", value: dashboardData.presentEmployees },
      { name: "Absent", value: dashboardData.absentEmployees },
    ]

    // Student attendance data for pie chart
    const studentData = [
      { name: "Present", value: dashboardData.presentStudentEmployees },
      { name: "Absent", value: dashboardData.absentStudentEmployees },
    ]

    // Overall Fees Pie Chart data
    const overallFeesData = fees
      ? [
          { name: "Net Fee", value: fees.netFee },
          { name: "Paid", value: fees.paid },
          { name: "Due", value: fees.due },
        ]
      : []

    return {
      selectedSessionData,
      employeeData,
      studentData,
      overallFeesData,
    }
  }

  const chartData = processChartData()
  const selectedFees = getSelectedFees()
  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"] // For student distribution and attendance
  const OVERALL_FEES_COLORS = [theme.palette.primary.main, theme.palette.success.main, theme.palette.error.main] // For Net, Paid, Due

  // Format currency for display
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount)
  }

  // Get total student count for selected criteria
  const getTotalStudentCount = () => {
    if (!dashboardData || !selectedSession) return 0

    if (selectedCourse === "ALL_COURSES") {
      // Sum all students for the session
      return dashboardData.studentsBySessionCourse
        .filter((item) => item.Session === selectedSession)
        .reduce((total, item) => total + item.TotalStudents, 0)
    } else {
      // Get students for specific course
      const courseData = dashboardData.studentsBySessionCourse.find(
        (item) => item.Session === selectedSession && item.Course === selectedCourse,
      )
      return courseData ? courseData.TotalStudents : 0
    }
  }

  const totalStudentCount = getTotalStudentCount()

  return (
    <Box sx={{ padding: 3, backgroundColor: theme.palette.grey[100], minHeight: "100vh" }}>
      <Paper elevation={3} sx={{ p: isMobile ? 2 : 4, borderRadius: 2 }}>
        <Typography variant="h4" mb={isMobile ? 2 : 3} sx={{ fontWeight: "bold", color: theme.palette.primary.dark }}>
          Dashboard Overview
        </Typography>

        {/* Conditional rendering for loading state */}
        {!dashboardData || !selectedSession ? (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
            <Typography variant="h5" color="text.secondary">
              Loading data...
            </Typography>
          </Box>
        ) : (
          <>
            {/* Session and Course Selection */}
            <Grid container spacing={isMobile ? 2 : 3} mb={isMobile ? 2 : 3}>
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="session-select-label">Select Academic Session</InputLabel>
                  <Select
                    labelId="session-select-label"
                    id="session-select"
                    value={selectedSession}
                    label="Select Academic Session"
                    onChange={handleSessionChange}
                  >
                    {availableSessions.map((session) => (
                      <MenuItem key={session} value={session}>
                        {session}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel id="course-select-label">Select Course</InputLabel>
                  <Select
                    labelId="course-select-label"
                    id="course-select"
                    value={selectedCourse}
                    label="Select Course"
                    onChange={handleCourseChange}
                  >
                    <MenuItem value="ALL_COURSES">
                      <em>All Courses (Session Total)</em>
                    </MenuItem>
                    {availableCourses.map((course) => (
                      <MenuItem key={course} value={course}>
                        {course}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>

            {/* Student Count Summary */}
            <Grid container spacing={isMobile ? 2 : 3} mb={isMobile ? 2 : 3}>
              <Grid item xs={12}>
                <Card sx={{ backgroundColor: theme.palette.grey[200], boxShadow: "none" }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom sx={{ color: theme.palette.text.secondary }}>
                      Student Summary - {selectedSession}
                      {selectedCourse !== "ALL_COURSES" && ` - ${selectedCourse}`}
                    </Typography>
                    <Typography
                      variant={isMobile ? "h5" : "h4"}
                      sx={{ fontWeight: "bold", color: theme.palette.primary.main }}
                    >
                      {totalStudentCount} Students
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCourse === "ALL_COURSES" ? "All courses combined" : `${selectedCourse} only`}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>

            {/* Fee Summary Cards - SESSION + COURSE SPECIFIC */}
            {selectedFees && (
              <>
                <Typography
                  variant="h5"
                  mb={isMobile ? 2 : 3}
                  sx={{ fontWeight: "bold", color: theme.palette.primary.dark }}
                >
                  Fee Summary - {selectedSession}
                  {selectedCourse !== "ALL_COURSES" && ` - ${selectedCourse}`}
                  {selectedCourse === "ALL_COURSES" && " (All Courses)"}
                </Typography>
                <Grid container spacing={isMobile ? 2 : 3} mb={isMobile ? 3 : 4}>
                  {/* Total Net Fee */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: theme.palette.primary.main, color: "white", height: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Total Net Fee
                        </Typography>
                        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold" }}>
                          {formatCurrency(selectedFees.netFee)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                          {selectedCourse !== "ALL_COURSES" ? `${selectedCourse} only` : "All courses combined"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Total Paid */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: theme.palette.success.main, color: "white", height: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Total Paid
                        </Typography>
                        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold" }}>
                          {formatCurrency(selectedFees.paid)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                          {selectedFees.netFee > 0
                            ? `${((selectedFees.paid / selectedFees.netFee) * 100).toFixed(1)}% collected`
                            : "0% collected"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>

                  {/* Total Due */}
                  <Grid item xs={12} md={4}>
                    <Card sx={{ backgroundColor: theme.palette.error.main, color: "white", height: "100%" }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom>
                          Total Due
                        </Typography>
                        <Typography variant={isMobile ? "h5" : "h4"} sx={{ fontWeight: "bold" }}>
                          {formatCurrency(selectedFees.due)}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                          {selectedFees.netFee > 0
                            ? `${((selectedFees.due / selectedFees.netFee) * 100).toFixed(1)}% pending`
                            : "0% pending"}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                </Grid>

                
{/* Year-wise Fee Breakdown in Pie Charts */}
<Typography
  variant="h6"
  mb={isMobile ? 1 : 2}
  sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
>
  Year-wise Fee Breakdown {selectedCourse === "ALL_COURSES" && "(Aggregated)"}
</Typography>
<Grid container spacing={isMobile ? 2 : 3} mb={isMobile ? 3 : 4}>
  {/* First Year Pie Chart */}
  <Grid item xs={12} md={4}>
    <Card variant="outlined" sx={{ height: "100%", borderColor: theme.palette.divider }}>
      <CardContent>
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ fontWeight: "bold", color: theme.palette.text.secondary, textAlign: 'center' }}
        >
          First Year
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Paid', value: selectedFees.firstYearPaid },
                  { name: 'Due', value: selectedFees.firstYearDue }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill={theme.palette.success.main} />
                <Cell fill={theme.palette.error.main} />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" align="center">
          Net: {formatCurrency(selectedFees.firstYearNetFee)}
        </Typography>
        {selectedCourse === "ALL_COURSES" && (
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Sum of all courses
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>

  {/* Second Year Pie Chart */}
  <Grid item xs={12} md={4}>
    <Card variant="outlined" sx={{ height: "100%", borderColor: theme.palette.divider }}>
      <CardContent>
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ fontWeight: "bold", color: theme.palette.text.secondary, textAlign: 'center' }}
        >
          Second Year
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Paid', value: selectedFees.secondYearPaid },
                  { name: 'Due', value: selectedFees.secondYearDue }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill={theme.palette.success.main} />
                <Cell fill={theme.palette.error.main} />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" align="center">
          Net: {formatCurrency(selectedFees.secondYearNetFee)}
        </Typography>
        {selectedCourse === "ALL_COURSES" && (
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Sum of all courses
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>

  {/* Third Year Pie Chart */}
  <Grid item xs={12} md={4}>
    <Card variant="outlined" sx={{ height: "100%", borderColor: theme.palette.divider }}>
      <CardContent>
        <Typography
          variant="subtitle1"
          gutterBottom
          sx={{ fontWeight: "bold", color: theme.palette.text.secondary, textAlign: 'center' }}
        >
          Third Year
        </Typography>
        <Box sx={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={[
                  { name: 'Paid', value: selectedFees.thirdYearPaid },
                  { name: 'Due', value: selectedFees.thirdYearDue }
                ]}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                <Cell fill={theme.palette.success.main} />
                <Cell fill={theme.palette.error.main} />
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <Typography variant="body2" align="center">
          Net: {formatCurrency(selectedFees.thirdYearNetFee)}
        </Typography>
        {selectedCourse === "ALL_COURSES" && (
          <Typography variant="caption" color="text.secondary" align="center" display="block">
            Sum of all courses
          </Typography>
        )}
      </CardContent>
    </Card>
  </Grid>
</Grid>

                <Divider sx={{ my: isMobile ? 3 : 4 }} />
              </>
            )}

            {/* Overall Fees Pie Chart */}
            <Typography
              variant="h5"
              mb={isMobile ? 2 : 3}
              sx={{ fontWeight: "bold", color: theme.palette.primary.dark }}
            >
              Overall Fees Distribution ({selectedSession}
              {selectedCourse !== "ALL_COURSES" && ` - ${selectedCourse}`})
            </Typography>
            <Paper sx={{ p: isMobile ? 2 : 3, height: isMobile ? 300 : 400, mb: isMobile ? 3 : 4 }}>
              {chartData &&
              chartData.overallFeesData.length > 0 &&
              (chartData.overallFeesData[0].value > 0 ||
                chartData.overallFeesData[1].value > 0 ||
                chartData.overallFeesData[2].value > 0) ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData.overallFeesData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={isMobile ? 80 : 120}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    >
                      {chartData.overallFeesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={OVERALL_FEES_COLORS[index % OVERALL_FEES_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography variant="h6" color="text.secondary">
                    No fee data available for the selected criteria to display in chart.
                  </Typography>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: isMobile ? 3 : 4 }} />

            {/* Student Distribution Chart */}
            <Typography
              variant="h5"
              mb={isMobile ? 2 : 3}
              sx={{ fontWeight: "bold", color: theme.palette.primary.dark }}
            >
              Student Distribution - {selectedSession}
              {selectedCourse !== "ALL_COURSES" && ` - ${selectedCourse}`}
            </Typography>

            <Paper sx={{ p: isMobile ? 2 : 3, height: isMobile ? 300 : 400, mb: isMobile ? 3 : 4 }}>
              {chartData && chartData.selectedSessionData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData.selectedSessionData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="name"
                      angle={isMobile ? -45 : 0}
                      textAnchor={isMobile ? "end" : "middle"}
                      height={isMobile ? 80 : 60}
                    />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="students" fill={theme.palette.info.main} name="Students" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
                  <Typography variant="h6" color="text.secondary">
                    No student data available for the selected criteria
                  </Typography>
                </Box>
              )}
            </Paper>

            <Divider sx={{ my: isMobile ? 3 : 4 }} />

            {/* Attendance Section */}
            <Typography
              variant="h5"
              mb={isMobile ? 2 : 3}
              sx={{ fontWeight: "bold", color: theme.palette.primary.dark }}
            >
              Today's Attendance Overview
            </Typography>
            <Grid container spacing={isMobile ? 2 : 3}>
              {/* Employee Attendance Pie Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: isMobile ? 2 : 3, height: 300 }}>
                  <Typography
                    variant="subtitle1"
                    align="center"
                    mb={isMobile ? 1 : 2}
                    sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
                  >
                    Employee Attendance
                  </Typography>
                  {chartData && (
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={chartData.employeeData}
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.employeeData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>

              {/* Student Attendance Pie Chart */}
              <Grid item xs={12} md={6}>
                <Paper sx={{ p: isMobile ? 2 : 3, height: 300 }}>
                  <Typography
                    variant="subtitle1"
                    align="center"
                    mb={isMobile ? 1 : 2}
                    sx={{ fontWeight: "bold", color: theme.palette.text.primary }}
                  >
                    Student Attendance
                  </Typography>
                  {chartData && (
                    <ResponsiveContainer width="100%" height="80%">
                      <PieChart>
                        <Pie
                          data={chartData.studentData}
                          cx="50%"
                          cy="50%"
                          outerRadius={isMobile ? 60 : 80}
                          fill="#8884d8"
                          dataKey="value"
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                        >
                          {chartData.studentData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </>
        )}
      </Paper>
    </Box>
  )
}

export default DashboardData