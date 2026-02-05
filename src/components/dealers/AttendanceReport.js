"use client"

import { useEffect, useState } from "react"
import {
  Typography,
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material"
import { GetApp, DateRange, Schedule } from "@mui/icons-material"
import axios from "axios"
import { saveAs } from "file-saver"
import { useAuth } from "../auth/AuthContext"

const AttendanceReport = () => {
  const { user } = useAuth()
  const [employees, setEmployees] = useState([])
  const [filteredEmployees, setFilteredEmployees] = useState([])
  const [attendance, setAttendance] = useState([])
  const [students, setStudents] = useState([])
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [roleFilter, setRoleFilter] = useState("all") // 'all', 'student', 'staff'
  const [statusFilter, setStatusFilter] = useState("all") // 'all', 'active', 'inactive'
  const [filteredAttendance, setFilteredAttendance] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [employeesResponse, attendanceResponse, studentsResponse] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/LIT/src/employee/all_members.php?Tenent_Id=${user.tenent_id}`,
          ),
          axios.get("https://namami-infotech.com/LIT/src/attendance/get_attendance.php"),
          axios.get("https://namami-infotech.com/LIT/src/students/get_student.php")
        ])

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data)
          setFilteredEmployees(employeesResponse.data.data)
        }

        if (attendanceResponse.data.success) {
          setAttendance(attendanceResponse.data.data)
        }

        if (studentsResponse.data.success) {
          setStudents(studentsResponse.data.data)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        setError("Failed to fetch data")
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [user.tenent_id])

  useEffect(() => {
    // Filter employees based on role and status selection
    let filtered = employees
    
    // Apply role filter
    if (roleFilter !== "all") {
      if (roleFilter === "student") {
        filtered = filtered.filter(emp => emp.Role === "Student")
      } else {
        filtered = filtered.filter(emp => emp.Role !== "Student")
      }
    }
    
    // Apply status filter
    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter(emp => emp.IsActive === 1)
      } else {
        filtered = filtered.filter(emp => emp.IsActive === 0)
      }
    }
    
    setFilteredEmployees(filtered)
  }, [roleFilter, statusFilter, employees])

  useEffect(() => {
    const filterAttendance = () => {
      if (!fromDate || !toDate) {
        setFilteredAttendance([])
        return
      }

      const startDate = new Date(fromDate)
      const endDate = new Date(toDate)

      const filtered = attendance.filter((record) => {
        const recordDate = new Date(record.InTime)
        return recordDate >= startDate && recordDate <= endDate
      })

      setFilteredAttendance(filtered)
    }

    filterAttendance()
  }, [fromDate, toDate, attendance])

  const isSunday = (dateString) => {
    const date = new Date(dateString)
    return date.getDay() === 0
  }

  const getStudentDetails = (empId) => {
    const student = students.find(student => student.StudentID === empId.toString())
    if (student) {
      return {
        course: student.Course || "N/A",
        guardianName: student.GuardianName || "N/A",
        guardianContactNo: student.GuardianContactNo || "N/A"
      }
    }
    return {
      course: "N/A",
      guardianName: "N/A",
      guardianContactNo: "N/A"
    }
  }

  const calculateAttendancePercentage = (employeeId) => {
    if (!filteredAttendance.length || !fromDate || !toDate) return 0
    
    const startDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    const totalDays = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0) {
        totalDays.push(new Date(currentDate).toISOString().split('T')[0])
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    const totalWorkingDays = totalDays.length
    if (totalWorkingDays === 0) return 0
    
    const attendanceDays = new Set(
      filteredAttendance
        .filter(record => record.EmpId === employeeId)
        .map(record => record.InTime.split(" ")[0])
    ).size
    
    const percentage = (attendanceDays / totalWorkingDays) * 100
    return Math.round(percentage * 100) / 100
  }

  const exportAttendanceToCSV = () => {
    if (!filteredAttendance.length) {
      alert("No data available for export.")
      return
    }

    const uniqueDates = [...new Set(filteredAttendance.map((record) => record.InTime.split(" ")[0]))]
      .filter(date => !isSunday(date))
      .sort()

    const csvHeader = [
      "S. No.", 
      "Employee ID", 
      "Employee Name", 
      "Role",
      "Status",
      "RefrenceBy", 
      "Course", 
      "Guardian Name", 
      "Guardian Contact No.",
      "Attendance %",
      ...uniqueDates.flatMap((date) => [date])
    ]

    const csvRows = filteredEmployees.map((employee, index) => {
      const studentDetails = getStudentDetails(employee.EmpId)
      const attendancePercentage = calculateAttendancePercentage(employee.EmpId)
      
      const row = [
        index + 1, 
        employee.EmpId, 
        employee.Name, 
        employee.Role || "N/A",
        employee.IsActive === 1 ? "Active" : "Inactive",
        employee.RefrenceBy || "N/A",
        studentDetails.course,
        studentDetails.guardianName,
        studentDetails.guardianContactNo,
        `${attendancePercentage}%`,
      ]

      uniqueDates.forEach((date) => {
        const attendanceRecords = filteredAttendance.filter(
          (record) => record.EmpId === employee.EmpId && record.InTime.startsWith(date),
        )

        if (attendanceRecords.length > 0) {
          const inTime = attendanceRecords[0].InTime.split(" ")[1] || ""
          row.push(inTime)
        } else {
          row.push("Absent")
        }
      })

      return row
    })

    const csvContent = [csvHeader, ...csvRows].map((e) => e.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    saveAs(blob, "attendance_report.csv")
  }

  const getAttendanceStats = () => {
    if (!filteredAttendance.length) return { totalRecords: 0, uniqueEmployees: 0, dateRange: 0 }

    const uniqueEmployees = new Set(filteredAttendance.map((record) => record.EmpId)).size
    const uniqueDates = new Set(filteredAttendance.map((record) => record.InTime.split(" ")[0])).size

    return {
      totalRecords: filteredAttendance.length,
      uniqueEmployees,
      dateRange: uniqueDates,
    }
  }

  const stats = getAttendanceStats()

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 3, color: "#CC7A00", fontWeight: 600 }}
        >
          <Schedule sx={{ mr: 1, verticalAlign: "middle" }} />
          Attendance Report
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Filter by Role</InputLabel>
              <Select
                value={roleFilter}
                label="Filter by Role"
                onChange={(e) => setRoleFilter(e.target.value)}
              >
                <MenuItem value="all">All Roles</MenuItem>
                <MenuItem value="student">Students</MenuItem>
                <MenuItem value="staff">Staff</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                label="Status"
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="From Date"
              type="date"
              variant="outlined"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <DateRange sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <TextField
              label="To Date"
              type="date"
              variant="outlined"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              InputProps={{
                startAdornment: (
                  <DateRange sx={{ mr: 1, color: "action.active" }} />
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={4}>
            <Stack
              direction={isMobile ? "column" : "row"}
              spacing={2}
              justifyContent="flex-end"
            >
              <Button
                variant="contained"
                onClick={exportAttendanceToCSV}
                startIcon={<GetApp />}
                disabled={!filteredAttendance.length || loading}
                sx={{
                  bgcolor: "#CC7A00",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Export Report
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Stats Summary */}
        {filteredEmployees.length > 0 && (
          <Box
            sx={{
              mb: 3,
              p: 2,
              bgcolor: "#CC7A00",
              borderRadius: 1,
              color: "info.contrastText",
            }}
          >
            <Grid container spacing={2}>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2">
                  <strong>Total Employees:</strong> {filteredEmployees.length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2">
                  <strong>Active:</strong>{" "}
                  {filteredEmployees.filter((emp) => emp.IsActive === 1).length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2">
                  <strong>Inactive:</strong>{" "}
                  {filteredEmployees.filter((emp) => emp.IsActive === 0).length}
                </Typography>
              </Grid>
              <Grid item xs={12} sm={3}>
                <Typography variant="body2">
                  <strong>Students:</strong>{" "}
                  {
                    filteredEmployees.filter((emp) => emp.Role === "Student")
                      .length
                  }
                </Typography>
              </Grid>
            </Grid>
          </Box>
        )}

        {/* Loading State */}
        {loading && (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              py: 4,
            }}
          >
            <CircularProgress size={40} sx={{ mr: 2 }} />
            <Typography variant="body1" color="text.secondary">
              Loading attendance data...
            </Typography>
          </Box>
        )}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}

        {/* No Data State */}
        {fromDate && toDate && !loading && filteredAttendance.length === 0 && (
          <Alert severity="info" sx={{ mt: 2 }}>
            No attendance records found for the selected date range.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export default AttendanceReport