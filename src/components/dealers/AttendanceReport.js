"use client";

import { useEffect, useState } from "react";
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
} from "@mui/material";
import {
  GetApp,
  DateRange,
  Schedule,
  HolidayVillage,
} from "@mui/icons-material";
import axios from "axios";
import { saveAs } from "file-saver";
import { useAuth } from "../auth/AuthContext";

const AttendanceReport = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [filteredEmployees, setFilteredEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [students, setStudents] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [filteredAttendance, setFilteredAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [
          employeesResponse,
          attendanceResponse,
          studentsResponse,
          holidaysResponse,
        ] = await Promise.all([
          axios.get(
            `https://namami-infotech.com/LIT/src/employee/all_members.php?Tenent_Id=${user.tenent_id}`,
          ),
          axios.get(
            "https://namami-infotech.com/LIT/src/attendance/get_attendance.php",
          ),
          axios.get(
            "https://namami-infotech.com/LIT/src/students/get_student.php",
          ),
          axios.get(
            `https://namami-infotech.com/LIT/src/holiday/view_holiday.php?Tenent_Id=${user.tenent_id}`,
          ),
        ]);

        if (employeesResponse.data.success) {
          setEmployees(employeesResponse.data.data);
          setFilteredEmployees(employeesResponse.data.data);
        }

        if (attendanceResponse.data.success) {
          setAttendance(attendanceResponse.data.data);
        }

        if (studentsResponse.data.success) {
          setStudents(studentsResponse.data.data);
        }

        if (holidaysResponse.data.success) {
          setHolidays(holidaysResponse.data.data);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user.tenent_id]);

  useEffect(() => {
    let filtered = employees;

    if (roleFilter !== "all") {
      if (roleFilter === "student") {
        filtered = filtered.filter((emp) => emp.Role === "Student");
      } else {
        filtered = filtered.filter((emp) => emp.Role !== "Student");
      }
    }

    if (statusFilter !== "all") {
      if (statusFilter === "active") {
        filtered = filtered.filter((emp) => emp.IsActive === 1);
      } else {
        filtered = filtered.filter((emp) => emp.IsActive === 0);
      }
    }

    setFilteredEmployees(filtered);
  }, [roleFilter, statusFilter, employees]);

  useEffect(() => {
    const filterAttendance = () => {
      if (!fromDate || !toDate) {
        setFilteredAttendance([]);
        return;
      }

      const startDate = new Date(fromDate);
      const endDate = new Date(toDate);

      const filtered = attendance.filter((record) => {
        const recordDate = new Date(record.InTime);
        return recordDate >= startDate && recordDate <= endDate;
      });

      setFilteredAttendance(filtered);
    };

    filterAttendance();
  }, [fromDate, toDate, attendance]);

  const isSunday = (dateString) => {
    const date = new Date(dateString);
    return date.getDay() === 0;
  };

  // Check if a date is a holiday for a specific employee
  const isHolidayForEmployee = (dateString, employee) => {
    const holiday = holidays.find((h) => h.date === dateString);

    if (!holiday) return false;

    // If holiday is for "All" courses and semesters
    if (holiday.Course === "All" && holiday.Sem === "All") {
      return true;
    }

    // For students, check if holiday matches their course and semester
    if (employee.Role === "Student") {
      const studentDetails = getStudentDetails(employee.EmpId);

      // Check if holiday matches student's course and semester
      if (
        holiday.Course === studentDetails.course &&
        holiday.Sem === studentDetails.sem
      ) {
        return true;
      }

      // Check if holiday is for "All" in either course or sem
      if (holiday.Course === "All" && holiday.Sem === studentDetails.sem) {
        return true;
      }

      if (holiday.Course === studentDetails.course && holiday.Sem === "All") {
        return true;
      }
    }

    return false;
  };

  const getStudentDetails = (empId) => {
    const student = students.find(
      (student) => student.StudentID === empId.toString(),
    );
    if (student) {
      return {
        course: student.Course || "N/A",
        sem: student.Sem || "N/A",
        guardianName: student.GuardianName || "N/A",
        guardianContactNo: student.GuardianContactNo || "N/A",
      };
    }
    return {
      course: "N/A",
      sem: "N/A",
      guardianName: "N/A",
      guardianContactNo: "N/A",
    };
  };

  const getHolidayTitle = (dateString) => {
    const holiday = holidays.find((h) => h.date === dateString);
    return holiday ? holiday.title : null;
  };

  const calculateAttendancePercentage = (employeeId) => {
    if (!filteredAttendance.length || !fromDate || !toDate) return 0;

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    const totalDays = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const dateStr = currentDate.toISOString().split("T")[0];
      const employee = filteredEmployees.find(
        (emp) => emp.EmpId === employeeId,
      );

      // Check if the day is a working day (not Sunday and not holiday for this employee)
      if (
        currentDate.getDay() !== 0 &&
        !isHolidayForEmployee(dateStr, employee)
      ) {
        totalDays.push(dateStr);
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const totalWorkingDays = totalDays.length;
    if (totalWorkingDays === 0) return 0;

    const attendanceDays = new Set(
      filteredAttendance
        .filter((record) => record.EmpId === employeeId)
        .map((record) => record.InTime.split(" ")[0]),
    ).size;

    const percentage = (attendanceDays / totalWorkingDays) * 100;
    return Math.round(percentage * 100) / 100;
  };

  const exportAttendanceToCSV = () => {
    if (!filteredAttendance.length) {
      alert("No data available for export.");
      return;
    }

    // Get all dates in the range that are either working days or have attendance
    const uniqueDates = [
      ...new Set(
        filteredAttendance.map((record) => record.InTime.split(" ")[0]),
      ),
    ]
      .filter((date) => !isSunday(date))
      .sort();

    const csvHeader = [
      "S. No.",
      "Employee ID",
      "Employee Name",
      "Role",
      "Status",
      "RefrenceBy",
      "Course",
      "Semester",
      "Guardian Name",
      "Guardian Contact No.",
      "Attendance %",
      ...uniqueDates.flatMap((date) => {
        const holidayTitle = getHolidayTitle(date);
        return holidayTitle ? [`${date} (${holidayTitle})`] : [date];
      }),
    ];

    const csvRows = filteredEmployees.map((employee, index) => {
      const studentDetails = getStudentDetails(employee.EmpId);
      const attendancePercentage = calculateAttendancePercentage(
        employee.EmpId,
      );

      const row = [
        index + 1,
        employee.EmpId,
        employee.Name,
        employee.Role || "N/A",
        employee.IsActive === 1 ? "Active" : "Inactive",
        employee.RefrenceBy || "N/A",
        studentDetails.course,
        studentDetails.sem,
        studentDetails.guardianName,
        studentDetails.guardianContactNo,
        `${attendancePercentage}%`,
      ];

      uniqueDates.forEach((date) => {
        // Check if it's a holiday for this employee
        if (isHolidayForEmployee(date, employee)) {
          row.push("Holiday");
        } else {
          const attendanceRecords = filteredAttendance.filter(
            (record) =>
              record.EmpId === employee.EmpId && record.InTime.startsWith(date),
          );

          if (attendanceRecords.length > 0) {
            const inTime = attendanceRecords[0].InTime.split(" ")[1] || "";
            row.push(inTime);
          } else {
            row.push("Absent");
          }
        }
      });

      return row;
    });

    const csvContent = [csvHeader, ...csvRows]
      .map((e) => e.join(","))
      .join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, "attendance_report.csv");
  };

  const getAttendanceStats = () => {
    if (!filteredAttendance.length)
      return { totalRecords: 0, uniqueEmployees: 0, dateRange: 0 };

    const uniqueEmployees = new Set(
      filteredAttendance.map((record) => record.EmpId),
    ).size;
    const uniqueDates = new Set(
      filteredAttendance.map((record) => record.InTime.split(" ")[0]),
    ).size;

    return {
      totalRecords: filteredAttendance.length,
      uniqueEmployees,
      dateRange: uniqueDates,
    };
  };

  const stats = getAttendanceStats();

  // Get holiday summary
  const getHolidaySummary = () => {
    if (!fromDate || !toDate || !holidays.length) return [];

    const startDate = new Date(fromDate);
    const endDate = new Date(toDate);

    return holidays
      .filter((holiday) => {
        const holidayDate = new Date(holiday.date);
        return holidayDate >= startDate && holidayDate <= endDate;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const holidaySummary = getHolidaySummary();

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

        {/* Holiday Summary */}
        {holidaySummary.length > 0 && (
          <Box sx={{ mb: 3 }}>
            <Alert
              icon={<HolidayVillage />}
              severity="info"
              sx={{
                bgcolor: "#e3f2fd",
                "& .MuiAlert-icon": { color: "#1976d2" },
              }}
            >
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1 }}>
                Holidays in selected date range:
              </Typography>
              <Grid container spacing={1}>
                {holidaySummary.map((holiday, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Typography variant="body2">
                      • {holiday.date}: {holiday.title}
                      {holiday.Course !== "All" && ` (${holiday.Course}`}
                      {holiday.Sem !== "All" && `, Sem ${holiday.Sem}`}
                      {(holiday.Course !== "All" || holiday.Sem !== "All") &&
                        ")"}
                    </Typography>
                  </Grid>
                ))}
              </Grid>
            </Alert>
          </Box>
        )}

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
};

export default AttendanceReport;
