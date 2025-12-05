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
  const [students, setStudents] = useState([]) // New state for student data
  const [fromDate, setFromDate] = useState("")
  const [toDate, setToDate] = useState("")
  const [roleFilter, setRoleFilter] = useState("all") // 'all', 'student', 'staff'
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
          axios.get("https://namami-infotech.com/LIT/src/students/get_student.php") // Fetch student data
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
    // Filter employees based on role selection
    if (roleFilter === "all") {
      setFilteredEmployees(employees)
    } else if (roleFilter === "student") {
      setFilteredEmployees(employees.filter(emp => emp.Role === "Student"))
    } else {
      setFilteredEmployees(employees.filter(emp => emp.Role !== "Student"))
    }
  }, [roleFilter, employees])

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
    return date.getDay() === 0 // Sunday is 0 in JavaScript
  }

  // Function to get student details by matching EmpId with StudentID
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

  // Function to calculate attendance percentage for an employee
  const calculateAttendancePercentage = (employeeId) => {
    if (!filteredAttendance.length || !fromDate || !toDate) return 0
    
    // Get all unique dates excluding Sundays
    const startDate = new Date(fromDate)
    const endDate = new Date(toDate)
    
    // Calculate total working days (excluding Sundays)
    const totalDays = []
    const currentDate = new Date(startDate)
    
    while (currentDate <= endDate) {
      if (currentDate.getDay() !== 0) { // Not Sunday
        totalDays.push(new Date(currentDate).toISOString().split('T')[0])
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }
    
    const totalWorkingDays = totalDays.length
    if (totalWorkingDays === 0) return 0
    
    // Count attendance days for this employee
    const attendanceDays = new Set(
      filteredAttendance
        .filter(record => record.EmpId === employeeId)
        .map(record => record.InTime.split(" ")[0])
    ).size
    
    // Calculate percentage
    const percentage = (attendanceDays / totalWorkingDays) * 100
    return Math.round(percentage * 100) / 100 // Round to 2 decimal places
  }

  const exportAttendanceToCSV = () => {
    if (!filteredAttendance.length) {
      alert("No data available for export.")
      return
    }

    // Get all unique dates excluding Sundays
    const uniqueDates = [...new Set(filteredAttendance.map((record) => record.InTime.split(" ")[0]))]
      .filter(date => !isSunday(date))
      .sort()

    // Updated CSV header with Attendance % column
    const csvHeader = [
      "S. No.", 
      "Employee ID", 
      "Employee Name", 
      "RefrenceBy", 
      "Course", 
      "Guardian Name", 
      "Guardian Contact No.",
      "Attendance %", // New column
      ...uniqueDates.flatMap((date) => [date])
    ]

    const csvRows = filteredEmployees.map((employee, index) => {
      const studentDetails = getStudentDetails(employee.EmpId)
      const attendancePercentage = calculateAttendancePercentage(employee.EmpId)
      
      const row = [
        index + 1, 
        employee.EmpId, 
        employee.Name, 
        employee.RefrenceBy,
        studentDetails.course,
        studentDetails.guardianName,
        studentDetails.guardianContactNo,
        `${attendancePercentage}%`, // Add attendance percentage
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
        <Typography variant="h5" component="h2" sx={{ mb: 3, color: "primary.main", fontWeight: 600 }}>
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
                startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} />,
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
                startAdornment: <DateRange sx={{ mr: 1, color: "action.active" }} />,
              }}
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <Stack direction={isMobile ? "column" : "row"} spacing={2} justifyContent="flex-end">
              <Button
                variant="contained"
                onClick={exportAttendanceToCSV}
                startIcon={<GetApp />}
                disabled={!filteredAttendance.length || loading}
                sx={{
                  bgcolor: "primary.main",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                Export Report
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Loading State */}
        {loading && (
          <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 4 }}>
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

        {/* Summary Info */}
        {fromDate && toDate && filteredAttendance.length > 0 && (
          <Box sx={{ mt: 2, p: 2, bgcolor: "grey.50", borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">
              <strong>Report Period:</strong> {new Date(fromDate).toLocaleDateString()} to{" "}
              {new Date(toDate).toLocaleDateString()}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Role Filter:</strong> {roleFilter === "all" ? "All Roles" : roleFilter === "student" ? "Students Only" : "Staff Only"}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              <strong>Generated:</strong> {new Date().toLocaleDateString()}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  )
}

export default AttendanceReport