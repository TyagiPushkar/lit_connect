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
  Refresh,
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
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const fetchData = async () => {
    if (!user?.tenent_id) return;
    setLoading(true);
    setError("");
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

      if (employeesResponse.data?.success) {
        setEmployees(employeesResponse.data.data);
        setFilteredEmployees(employeesResponse.data.data);
      }

      if (attendanceResponse.data?.success) {
        setAttendance(attendanceResponse.data.data);
      }

      if (studentsResponse.data?.success) {
        setStudents(studentsResponse.data.data);
      }

      if (holidaysResponse.data?.success) {
        setHolidays(holidaysResponse.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user?.tenent_id]);

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

  // Helper to normalize any date/string to "YYYY-MM-DD"
  const normalizeDateStr = (dateVal) => {
    if (!dateVal) return "";
    if (typeof dateVal === "string") {
      const trimmed = dateVal.trim();
      const match = trimmed.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
      const d = new Date(trimmed);
      if (!isNaN(d.getTime())) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return trimmed.split(" ")[0].split("T")[0];
    }
    if (dateVal instanceof Date && !isNaN(dateVal.getTime())) {
      const y = dateVal.getFullYear();
      const m = String(dateVal.getMonth() + 1).padStart(2, "0");
      const day = String(dateVal.getDate()).padStart(2, "0");
      return `${y}-${m}-${day}`;
    }
    return "";
  };

  useEffect(() => {
    const filterAttendance = () => {
      if (!fromDate || !toDate) {
        setFilteredAttendance([]);
        return;
      }

      const startDate = normalizeDateStr(fromDate);
      const endDate = normalizeDateStr(toDate);

      const filtered = attendance.filter((record) => {
        const recordDate = normalizeDateStr(record.InTime);
        return recordDate >= startDate && recordDate <= endDate;
      });

      setFilteredAttendance(filtered);
    };

    filterAttendance();
  }, [fromDate, toDate, attendance]);

  const isSunday = (dateString) => {
    if (!dateString) return false;
    const normalized = normalizeDateStr(dateString);
    if (!normalized) return false;
    const [y, m, d] = normalized.split("-").map(Number);
    const date = new Date(y, m - 1, d);
    return date.getDay() === 0;
  };

  const cleanCourse = (c) =>
    (c || "").toString().replace(/[^a-z0-9]/gi, "").toLowerCase();

  const cleanSem = (s) => {
    const str = (s || "").toString().trim().toLowerCase();
    const digitMatch = str.match(/\d+/);
    return digitMatch ? digitMatch[0] : str;
  };

  const getStudentDetails = (empId) => {
    if (empId === undefined || empId === null) {
      return {
        course: "N/A",
        sem: "N/A",
        guardianName: "N/A",
        guardianContactNo: "N/A",
      };
    }
    const empIdStr = empId.toString().trim().toLowerCase();
    const student = students.find((s) => {
      const sid = (s.StudentID || s.student_id || s.EmpId || s.emp_id || "")
        .toString()
        .trim()
        .toLowerCase();
      return sid === empIdStr;
    });

    if (student) {
      return {
        course: student.Course ? String(student.Course).trim() : "N/A",
        sem: student.Sem ? String(student.Sem).trim() : "N/A",
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

  // Check if a date is a holiday for a specific employee
  const isHolidayForEmployee = (dateString, employee) => {
    if (!holidays || !holidays.length || !dateString) return false;
    const targetDate = normalizeDateStr(dateString);
    if (!targetDate) return false;

    const matchingHolidays = holidays.filter((h) => {
      return normalizeDateStr(h.date || h.Date) === targetDate;
    });

    if (matchingHolidays.length === 0) return false;

    const isStudent =
      employee?.Role?.toString().trim().toLowerCase() === "student";

    const studentDetails = getStudentDetails(employee?.EmpId);
    const stuCourseNorm = cleanCourse(studentDetails.course);
    const stuSemNorm = cleanSem(studentDetails.sem);

    return matchingHolidays.some((holiday) => {
      const hCourse =
        holiday.Course || holiday.course || holiday.COURSE || "All";
      const hSem = holiday.Sem || holiday.sem || holiday.SEM || "All";

      const hCourseNorm = cleanCourse(hCourse);
      const hSemNorm = cleanSem(hSem);

      const isAllCourse =
        !hCourseNorm || hCourseNorm === "all" || hCourseNorm === "undefined";
      const isAllSem =
        !hSemNorm || hSemNorm === "all" || hSemNorm === "undefined";

      if (isAllCourse && isAllSem) {
        return true;
      }

      if (!isStudent) {
        return isAllCourse && isAllSem;
      }

      const courseMatches =
        isAllCourse || (stuCourseNorm && stuCourseNorm === hCourseNorm);
      const semMatches =
        isAllSem || (stuSemNorm && stuSemNorm === hSemNorm);

      return courseMatches && semMatches;
    });
  };

  const getHolidayTitle = (dateString) => {
    if (!holidays || !holidays.length || !dateString) return null;
    const targetDate = normalizeDateStr(dateString);
    const matchingHolidays = holidays.filter(
      (h) => normalizeDateStr(h.date || h.Date) === targetDate,
    );
    if (matchingHolidays.length === 0) return null;
    return matchingHolidays
      .map((h) => h.title || h.Title)
      .filter(Boolean)
      .join(" / ");
  };

  const exportAttendanceToCSV = () => {
    if (!fromDate || !toDate) {
      alert("Please select From Date and To Date.");
      return;
    }

    if (!filteredEmployees.length) {
      alert("No employees available for export.");
      return;
    }

    const startNorm = normalizeDateStr(fromDate);
    const endNorm = normalizeDateStr(toDate);
    if (!startNorm || !endNorm) {
      alert("Please select valid From Date and To Date.");
      return;
    }

    const [startYear, startMonth, startDay] = startNorm.split("-").map(Number);
    const [endYear, endMonth, endDay] = endNorm.split("-").map(Number);
    const startDate = new Date(startYear, startMonth - 1, startDay);
    const endDate = new Date(endYear, endMonth - 1, endDay);

    if (startDate > endDate) {
      alert("From Date cannot be after To Date.");
      return;
    }

    setExporting(true);

    // Run export in next event tick to prevent UI freeze
    setTimeout(() => {
      try {
        // 1. Precompute Student details Map (O(1) lookup)
        const studentMap = new Map();
        students.forEach((s) => {
          const sid = (s.StudentID || s.student_id || s.EmpId || s.emp_id || "")
            .toString()
            .trim()
            .toLowerCase();
          if (sid) {
            studentMap.set(sid, {
              course: s.Course ? String(s.Course).trim() : "N/A",
              sem: s.Sem ? String(s.Sem).trim() : "N/A",
              guardianName: s.GuardianName || "N/A",
              guardianContactNo: s.GuardianContactNo || "N/A",
            });
          }
        });

        // 2. Precompute Holidays Map by date (O(1) lookup)
        const holidaysByDate = new Map();
        holidays.forEach((h) => {
          const dateKey = normalizeDateStr(h.date || h.Date);
          if (dateKey) {
            if (!holidaysByDate.has(dateKey)) {
              holidaysByDate.set(dateKey, []);
            }
            holidaysByDate.get(dateKey).push({
              title: h.title || h.Title || "Holiday",
              course: (
                h.Course ||
                h.course ||
                h.COURSE ||
                "All"
              )
                .toString()
                .trim(),
              sem: (h.Sem || h.sem || h.SEM || "All").toString().trim(),
            });
          }
        });

        const checkHolidayFast = (dateKey, isStudent, sCourse, sSem) => {
          const dayHolidays = holidaysByDate.get(dateKey);
          if (!dayHolidays || dayHolidays.length === 0) return false;

          const stuCourseNorm = cleanCourse(sCourse);
          const stuSemNorm = cleanSem(sSem);

          return dayHolidays.some((h) => {
            const hCourseNorm = cleanCourse(h.course);
            const hSemNorm = cleanSem(h.sem);

            const isAllCourse =
              !hCourseNorm ||
              hCourseNorm === "all" ||
              hCourseNorm === "undefined";
            const isAllSem =
              !hSemNorm || hSemNorm === "all" || hSemNorm === "undefined";

            if (isAllCourse && isAllSem) return true;
            if (!isStudent) return isAllCourse && isAllSem;

            const courseMatches =
              isAllCourse || (stuCourseNorm && stuCourseNorm === hCourseNorm);
            const semMatches =
              isAllSem || (stuSemNorm && stuSemNorm === hSemNorm);

            return courseMatches && semMatches;
          });
        };

        // 3. Precompute Attendance Map (O(1) lookup)
        const attendanceMap = new Map(); // key: `${empId}_${date}` -> InTime
        const attendedDatesByEmp = new Map(); // key: empId -> Set(dates)

        filteredAttendance.forEach((record) => {
          const empIdStr = record.EmpId?.toString().trim().toLowerCase();
          const recDate = normalizeDateStr(record.InTime);
          if (empIdStr && recDate) {
            const key = `${empIdStr}_${recDate}`;
            if (!attendanceMap.has(key)) {
              const inTime =
                (record.InTime || "").split(" ")[1] || "Present";
              attendanceMap.set(key, inTime);
            }
            if (!attendedDatesByEmp.has(empIdStr)) {
              attendedDatesByEmp.set(empIdStr, new Set());
            }
            attendedDatesByEmp.get(empIdStr).add(recDate);
          }
        });

        // 4. Generate all dates in range (excluding Sundays)
        const allDates = [];
        const cur = new Date(startYear, startMonth - 1, startDay);
        while (cur <= endDate) {
          if (cur.getDay() !== 0) {
            allDates.push(normalizeDateStr(cur));
          }
          cur.setDate(cur.getDate() + 1);
        }

        const uniqueDates = [...new Set(allDates)].sort();

        // 5. Build CSV Header
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
            const dayHolidays = holidaysByDate.get(date);
            const holidayTitle = dayHolidays
              ? dayHolidays.map((h) => h.title).join(" / ")
              : null;
            return holidayTitle ? [`"${date} (${holidayTitle})"`] : [date];
          }),
        ];

        // 6. Build CSV Rows with O(1) Lookups
        const csvRows = filteredEmployees.map((employee, index) => {
          const empIdStr =
            employee.EmpId?.toString().trim().toLowerCase() || "";
          const isStudent =
            employee.Role?.toString().trim().toLowerCase() === "student";
          const studentDetails = studentMap.get(empIdStr) || {
            course: "N/A",
            sem: "N/A",
            guardianName: "N/A",
            guardianContactNo: "N/A",
          };
          const studentCourse = studentDetails.course || "";
          const studentSem = studentDetails.sem || "";

          // Calculate percentage strictly on working days (excluding holidays)
          let totalWorkingDays = 0;
          let attendedWorkingDaysCount = 0;

          uniqueDates.forEach((d) => {
            const isHoliday = checkHolidayFast(
              d,
              isStudent,
              studentCourse,
              studentSem,
            );
            if (!isHoliday) {
              totalWorkingDays++;
              const key = `${empIdStr}_${d}`;
              if (attendanceMap.has(key)) {
                attendedWorkingDaysCount++;
              }
            }
          });

          const attendancePercentage =
            totalWorkingDays > 0
              ? Math.round(
                  (attendedWorkingDaysCount / totalWorkingDays) * 10000,
                ) / 100
              : 0;

          const row = [
            index + 1,
            employee.EmpId,
            `"${(employee.Name || "").replace(/"/g, '""')}"`,
            `"${employee.Role || "N/A"}"`,
            employee.IsActive === 1 ? "Active" : "Inactive",
            `"${(employee.RefrenceBy || "N/A").replace(/"/g, '""')}"`,
            studentDetails.course,
            studentDetails.sem,
            `"${studentDetails.guardianName.replace(/"/g, '""')}"`,
            `"${studentDetails.guardianContactNo.replace(/"/g, '""')}"`,
            `${attendancePercentage}%`,
          ];

          uniqueDates.forEach((date) => {
            const key = `${empIdStr}_${date}`;
            const inTime = attendanceMap.get(key);
            const isHoliday = checkHolidayFast(
              date,
              isStudent,
              studentCourse,
              studentSem,
            );

            if (inTime) {
              if (isHoliday) {
                row.push(`"${inTime} (Holiday)"`);
              } else {
                row.push(inTime);
              }
            } else if (isHoliday) {
              row.push("Holiday");
            } else {
              row.push("Absent");
            }
          });

          return row;
        });

        const csvContent = [csvHeader, ...csvRows]
          .map((e) => e.join(","))
          .join("\n");
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        saveAs(blob, `attendance_report_${startNorm}_to_${endNorm}.csv`);
      } catch (err) {
        console.error("Export error:", err);
        alert("Failed to export attendance report.");
      } finally {
        setExporting(false);
      }
    }, 50);
  };

  const getAttendanceStats = () => {
    if (!filteredAttendance.length)
      return { totalRecords: 0, uniqueEmployees: 0, dateRange: 0 };

    const uniqueEmployees = new Set();
    const uniqueDates = new Set();

    filteredAttendance.forEach((record) => {
      if (record.EmpId) uniqueEmployees.add(record.EmpId);
      const d = normalizeDateStr(record.InTime);
      if (d) uniqueDates.add(d);
    });

    return {
      totalRecords: filteredAttendance.length,
      uniqueEmployees: uniqueEmployees.size,
      dateRange: uniqueDates.size,
    };
  };

  const stats = getAttendanceStats();

  // Get holiday summary
  const getHolidaySummary = () => {
    if (!fromDate || !toDate || !holidays.length) return [];

    const startDate = normalizeDateStr(fromDate);
    const endDate = normalizeDateStr(toDate);

    return holidays
      .filter((holiday) => {
        const holidayDate = normalizeDateStr(holiday.date || holiday.Date);
        return holidayDate >= startDate && holidayDate <= endDate;
      })
      .sort((a, b) => {
        const dateA = normalizeDateStr(a.date || a.Date);
        const dateB = normalizeDateStr(b.date || b.Date);
        return dateA.localeCompare(dateB);
      });
  };

  const holidaySummary = getHolidaySummary();

  const getHolidayLabel = (holiday) => {
    const c = holiday.Course || holiday.course || "All";
    const s = holiday.Sem || holiday.sem || "All";
    const cNorm = cleanCourse(c);
    const sNorm = cleanSem(s);

    const isAllCourse = !cNorm || cNorm === "all";
    const isAllSem = !sNorm || sNorm === "all";

    if (isAllCourse && isAllSem) return "";
    if (!isAllCourse && isAllSem) return ` (${c})`;
    if (isAllCourse && !isAllSem) return ` (Sem ${s})`;
    return ` (${c}, Sem ${s})`;
  };

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
                      • {holiday.date || holiday.Date}:{" "}
                      {holiday.title || holiday.Title}
                      {getHolidayLabel(holiday)}
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
                variant="outlined"
                onClick={fetchData}
                startIcon={
                  loading ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <Refresh />
                  )
                }
                disabled={loading || exporting}
                sx={{
                  color: "#CC7A00",
                  borderColor: "#CC7A00",
                  "&:hover": { borderColor: "#b36b00", bgcolor: "#fff3e0" },
                }}
              >
                Refresh Data
              </Button>
              <Button
                variant="contained"
                onClick={exportAttendanceToCSV}
                startIcon={
                  exporting ? (
                    <CircularProgress size={20} color="inherit" />
                  ) : (
                    <GetApp />
                  )
                }
                disabled={!filteredAttendance.length || loading || exporting}
                sx={{
                  bgcolor: "#CC7A00",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                {exporting ? "Exporting..." : "Export Report"}
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
