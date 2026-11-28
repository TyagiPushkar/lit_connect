import React, { useState, useEffect, useRef } from 'react';
import {
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Snackbar, TablePagination,
  TableFooter, TextField, Tooltip, IconButton, Box,
  Chip, Stack, Switch, FormControlLabel, Typography, InputAdornment,
  CircularProgress
} from '@mui/material';
import {
  Dialog, DialogTitle, DialogContent, DialogActions,
  InputLabel, MenuItem, Select, FormControl
} from '@mui/material';
import * as XLSX from 'xlsx';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import FilterListIcon from '@mui/icons-material/FilterList';
import ClearIcon from '@mui/icons-material/Clear';
import SearchIcon from '@mui/icons-material/Search';
import AssessmentIcon from '@mui/icons-material/Assessment';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from "@mui/icons-material/Visibility";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { format, eachDayOfInterval, isSunday } from 'date-fns';

// Helper to normalize any date string to 'YYYY-MM-DD'
const normalizeDateKey = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  const ymdMatch = s.match(/^(\d{4})[-/](\d{1,2})[-/](\d{1,2})/);
  if (ymdMatch) {
    return `${ymdMatch[1]}-${ymdMatch[2].padStart(2, "0")}-${ymdMatch[3].padStart(2, "0")}`;
  }
  const dmyMatch = s.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{4})/);
  if (dmyMatch) {
    return `${dmyMatch[3]}-${dmyMatch[2].padStart(2, "0")}-${dmyMatch[1].padStart(2, "0")}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    return `${y}-${m}-${day}`;
  }
  return "";
};

const StudentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [employeeStatus, setEmployeeStatus] = useState({}); // Store employee IsActive status
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState(
    () => sessionStorage.getItem("students_searchQuery") || ""
  );
  const [page, setPage] = useState(
    () => parseInt(sessionStorage.getItem("students_page") || "0", 10)
  );
  const [rowsPerPage, setRowsPerPage] = useState(
    () => parseInt(sessionStorage.getItem("students_rowsPerPage") || "10", 10)
  );
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState("");
  const [particular, setParticular] = useState("");
  const [amount, setAmount] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [courseFilter, setCourseFilter] = useState(
    () => sessionStorage.getItem("students_courseFilter") || ""
  );
  const [batchFilter, setBatchFilter] = useState(
    () => sessionStorage.getItem("students_batchFilter") || ""
  );
  const [semesterFilter, setSemesterFilter] = useState(
    () => sessionStorage.getItem("students_semesterFilter") || ""
  );
  const [startMonth, setStartMonth] = useState(
    () => sessionStorage.getItem("students_startMonth") || ""
  );
  const [endMonth, setEndMonth] = useState(
    () => sessionStorage.getItem("students_endMonth") || ""
  );
  const [showFilters, setShowFilters] = useState(
    () => sessionStorage.getItem("students_showFilters") === "true"
  );
  const [isActiveFilter, setIsActiveFilter] = useState(
    () => sessionStorage.getItem("students_isActiveFilter") || "all"
  ); // 'all', 'active', 'inactive'

  // Attendance export dialog states
  const [attendanceDialogOpen, setAttendanceDialogOpen] = useState(false);
  const [dialogSemester, setDialogSemester] = useState("");
  const [dialogStartMonth, setDialogStartMonth] = useState("");
  const [dialogEndMonth, setDialogEndMonth] = useState("");
  const [attendanceExportLoading, setAttendanceExportLoading] = useState(false);
  const [exportProgressText, setExportProgressText] = useState("");

  const isFirstFilter = useRef(true);

  // Keep sessionStorage in sync
  useEffect(() => {
    sessionStorage.setItem("students_searchQuery", searchQuery);
    sessionStorage.setItem("students_courseFilter", courseFilter);
    sessionStorage.setItem("students_batchFilter", batchFilter);
    sessionStorage.setItem("students_semesterFilter", semesterFilter);
    sessionStorage.setItem("students_startMonth", startMonth);
    sessionStorage.setItem("students_endMonth", endMonth);
    sessionStorage.setItem("students_showFilters", showFilters.toString());
    sessionStorage.setItem("students_isActiveFilter", isActiveFilter);
    sessionStorage.setItem("students_page", page.toString());
    sessionStorage.setItem("students_rowsPerPage", rowsPerPage.toString());
  }, [
    searchQuery,
    courseFilter,
    batchFilter,
    semesterFilter,
    startMonth,
    endMonth,
    showFilters,
    isActiveFilter,
    page,
    rowsPerPage,
  ]);

  // Extract unique values for filters
  const uniqueCourses = [
    ...new Set(transactions.map((tx) => tx.Course).filter(Boolean)),
  ].sort();
  const uniqueBatches = [
    ...new Set(transactions.map((tx) => tx.Session).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a));
  const uniqueSemesters = [
    ...new Set(transactions.map((tx) => tx.Sem).filter(Boolean)),
  ].sort();

  useEffect(() => {
    fetchLibraryTransactions();
    fetchEmployeeStatus();
  }, []);

  useEffect(() => {
    if (transactions.length === 0) return;

    let shouldResetPage = true;
    if (isFirstFilter.current) {
      isFirstFilter.current = false;
      shouldResetPage = false;
    }

    applyFilters(shouldResetPage);
  }, [
    transactions,
    employeeStatus,
    searchQuery,
    courseFilter,
    batchFilter,
    semesterFilter,
    isActiveFilter,
  ]);

  const fetchLibraryTransactions = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/students/get_student.php",
      );
      if (response.data.success) {
        const sorted = response.data.data.sort(
          (a, b) => b.TransactionId - a.TransactionId,
        );
        setTransactions(sorted);
        setFilteredTransactions(sorted);
      } else {
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error fetching library transactions.");
      setOpenSnackbar(true);
    }
  };

  const fetchEmployeeStatus = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/employee/list_students.php?Tenent_Id=1",
      );
      if (response.data.success) {
        // Create a map of employee/student IDs to their IsActive status
        const statusMap = {};
        response.data.data.forEach((emp) => {
          statusMap[emp.EmpId] = emp.IsActive === 1; // Convert 1/0 to true/false
        });
        setEmployeeStatus(statusMap);
      } else {
        console.error("Error fetching employee status:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching employee status:", error);
    }
  };

  const getStudentStatus = (studentId) => {
    // Check if student ID exists in employee status
    if (employeeStatus[studentId] !== undefined) {
      return employeeStatus[studentId];
    }
    // If not found in employee list, assume active
    return true;
  };

  const applyFilters = (shouldResetPage = true) => {
    let filtered = transactions;

    // Apply text search filter across:
    // 1. Student ID
    // 2. Student Name
    // 3. Guardian Name
    // 4. Father Name
    // 5. Mother Name
    // 6. All mobile numbers
    if (searchQuery) {
      const lower = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((tx) => {
        // 1. Students ID
        const studentIdMatch =
          (tx.StudentID && String(tx.StudentID).toLowerCase().includes(lower)) ||
          (tx.TempID && String(tx.TempID).toLowerCase().includes(lower));

        // 2. Students Name
        const studentNameMatch =
          tx.CandidateName && String(tx.CandidateName).toLowerCase().includes(lower);

        // 3. Guardian Name (if any)
        const guardianNameMatch =
          tx.GuardianName && String(tx.GuardianName).toLowerCase().includes(lower);

        // 4. Father Name
        const fatherNameMatch =
          (tx.FatherName && String(tx.FatherName).toLowerCase().includes(lower)) ||
          (tx.father_name && String(tx.father_name).toLowerCase().includes(lower));

        // 5. Mother Name
        const motherNameMatch =
          (tx.mother_name && String(tx.mother_name).toLowerCase().includes(lower)) ||
          (tx.MotherName && String(tx.MotherName).toLowerCase().includes(lower));

        // 6. All Mobile Numbers
        const mobileMatch =
          (tx.StudentContactNo && String(tx.StudentContactNo).toLowerCase().includes(lower)) ||
          (tx.GuardianContactNo && String(tx.GuardianContactNo).toLowerCase().includes(lower)) ||
          (tx.AlternateGaurdiaNumber && String(tx.AlternateGaurdiaNumber).toLowerCase().includes(lower)) ||
          (tx.AlternateGuardianNumber && String(tx.AlternateGuardianNumber).toLowerCase().includes(lower)) ||
          (tx.Mobile && String(tx.Mobile).toLowerCase().includes(lower)) ||
          (tx.mobile && String(tx.mobile).toLowerCase().includes(lower)) ||
          (tx.ContactNo && String(tx.ContactNo).toLowerCase().includes(lower));

        return (
          studentIdMatch ||
          studentNameMatch ||
          guardianNameMatch ||
          fatherNameMatch ||
          motherNameMatch ||
          mobileMatch
        );
      });
    }

    // Apply course filter
    if (courseFilter) {
      filtered = filtered.filter((tx) => tx.Course === courseFilter);
    }

    // Apply batch filter
    if (batchFilter) {
      filtered = filtered.filter((tx) => tx.Session === batchFilter);
    }

    // Apply semester filter
    if (semesterFilter) {
      filtered = filtered.filter((tx) => tx.Sem === semesterFilter);
    }

    // Apply active status filter
    if (isActiveFilter !== "all") {
      const isActive = isActiveFilter === "active";
      filtered = filtered.filter((tx) => {
        const studentActiveStatus = getStudentStatus(tx.StudentID);
        return studentActiveStatus === isActive;
      });
    }

    setFilteredTransactions(filtered);
    if (shouldResetPage) {
      setPage(0);
    } else {
      const maxPage = Math.max(0, Math.ceil(filtered.length / rowsPerPage) - 1);
      if (page > maxPage) {
        setPage(maxPage);
      }
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCourseFilter("");
    setBatchFilter("");
    setSemesterFilter("");
    setStartMonth("");
    setEndMonth("");
    setIsActiveFilter("all");
  };

  const hasActiveFilters = () => {
    return (
      Boolean(searchQuery) ||
      Boolean(courseFilter) ||
      Boolean(batchFilter) ||
      Boolean(semesterFilter) ||
      Boolean(startMonth) ||
      Boolean(endMonth) ||
      isActiveFilter !== "all"
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (courseFilter) count++;
    if (batchFilter) count++;
    if (semesterFilter) count++;
    if (startMonth) count++;
    if (endMonth) count++;
    if (isActiveFilter !== "all") count++;
    return count;
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClick = (studentId) => {
    navigate(`/student/${studentId}`);
  };

  const handleToggleActive = async (student) => {
    setLoading(true);
    try {
      const currentStatus = getStudentStatus(student.StudentID);
      const action = currentStatus ? "disable" : "enable";

      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/employee/disable_employee.php",
        {
          EmpId: student.StudentID,
          action: action,
        },
      );

      if (response.data.success) {
        setSnackbarMessage(
          `Student ${action === "enable" ? "enabled" : "disabled"} successfully`,
        );
        setOpenSnackbar(true);

        // Update the employee status map
        setEmployeeStatus((prev) => ({
          ...prev,
          [student.StudentID]: action === "enable",
        }));

        // Also update the transactions if they have IsActive field
        setTransactions((prevTransactions) =>
          prevTransactions.map((tx) =>
            tx.StudentID === student.StudentID
              ? { ...tx, IsActive: action === "enable" }
              : tx,
          ),
        );
      } else {
        setSnackbarMessage(
          response.data.message || `Failed to ${action} student`,
        );
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error updating student status");
      setOpenSnackbar(true);
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedStudent || !particular || !amount) {
      setSnackbarMessage("All fields are required.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/variable.php",
        {
          student_id: selectedStudent,
          particular,
          amount,
        },
      );

      if (response.data.success) {
        setSnackbarMessage("Fee added successfully.");
        setOpenSnackbar(true);
        setOpenDialog(false);
        setSelectedStudent("");
        setParticular("");
        setAmount("");
      } else {
        setSnackbarMessage(response.data.message || "Failed to add fee.");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("API error: " + error.message);
      setOpenSnackbar(true);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);

    // Prepare the data for export
    const dataForExport = filteredTransactions.map((student) => {
      const isActive = getStudentStatus(student.StudentID);
      return {
        "Student ID": student.StudentID,
        Name: student.CandidateName,
        Course: student.Course,
        Semester: student.Sem,
        Session: student.Session,
        Gender: student.Gender,
        DOB: student.DOB,
        Contact: student.StudentContactNo,
        "Guardian Name": student.GuardianName,
        "Guardian Contact": student.GuardianContactNo,
        "Mother Name": student.mother_name,
        Email: student.EmailId,
        Address: student.PermanentAddress,
        "Post Office": student.PostOffice,
        District: student.District,
        Pincode: student.PinCode,
        "Blood Group": student.BloodGroup,
        "10th Board": student.Board10University,
        "10th Passing Year": student.Year10Passing,
        "10th Percentage": student.Percentage10,
        "12th Board": student.Board12University || student.Council12Name,
        "12th Passing Year": student.Year12Passing || student.Year12PassingAlt,
        "12th Percentage": student.Percentage12,
        "Aadhar Number": student.AadharNumber,
        Category: student.ReligionCategory,
        Disabled: student.Disabled,
        "Hostel Interest": student.InterestInHostel,
        "Transport Interest": student.InterestInTransport,
        "Submission Date": student.SubmissionDate,
        "Reference By": student.RefrenceBy,
        Status: isActive ? "Active" : "Inactive",
        "Last College": student.last_institute_name,
        "Annual Income": student.AnnualIncome,
      };
    });

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Students");

    // Generate file name with current date
    const fileName = `Students_Report_${new Date().toISOString().slice(0, 10)}.xlsx`;

    // Export the file
    XLSX.writeFile(wb, fileName);
    setIsExporting(false);

    setSnackbarMessage("Excel report downloaded successfully!");
    setOpenSnackbar(true);
  };

  const handleRemoveMobileID = async (StudentID) => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/LIT/src/auth/remove_device.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employee_id: StudentID }),
        },
      );

      console.log(response, "responseresponseresponseresponse")
      const data = await response.json();

      console.log(data);

      if (data.success) {
        alert("Mobile ID removed successfully.");
        fetchLibraryTransactions();
      } else {
        alert("Mobile ID already removed");
      }
    } catch (err) {
      console.log("Error removing Mobile ID.");
    }
  };

  const handleOpenAttendanceDialog = () => {
    const curYear = new Date().getFullYear();
    const curMonth = new Date().getMonth() + 1;
    const defStartMonth =
      startMonth || (curMonth >= 7 ? `${curYear}-07` : `${curYear}-01`);
    const defEndMonth =
      endMonth || `${curYear}-${String(curMonth).padStart(2, "0")}`;

    setDialogSemester(semesterFilter || "");
    setDialogStartMonth(defStartMonth);
    setDialogEndMonth(defEndMonth);
    setAttendanceDialogOpen(true);
  };

  const handleExportAttendanceAverage = async (customParams = null) => {
    const targetSem = customParams
      ? customParams.semester
      : dialogSemester !== undefined && attendanceDialogOpen
      ? dialogSemester
      : semesterFilter;

    const targetStartMonth = customParams
      ? customParams.startMonth
      : attendanceDialogOpen
      ? dialogStartMonth
      : startMonth;

    const targetEndMonth = customParams
      ? customParams.endMonth
      : attendanceDialogOpen
      ? dialogEndMonth
      : endMonth;

    if (!targetStartMonth || !targetEndMonth) {
      setSnackbarMessage("Please select both Start Month and End Month.");
      setOpenSnackbar(true);
      return;
    }

    if (targetStartMonth > targetEndMonth) {
      setSnackbarMessage("Start Month cannot be after End Month.");
      setOpenSnackbar(true);
      return;
    }

    setAttendanceExportLoading(true);
    setExportProgressText("Preparing student records...");

    try {
      // Filter students to include in the attendance report
      let targetStudents = transactions;
      if (courseFilter) {
        targetStudents = targetStudents.filter(
          (s) => s.Course === courseFilter
        );
      }
      if (batchFilter) {
        targetStudents = targetStudents.filter(
          (s) => s.Session === batchFilter
        );
      }
      if (targetSem) {
        targetStudents = targetStudents.filter(
          (s) => String(s.Sem || "").trim() === String(targetSem).trim()
        );
      }
      if (isActiveFilter !== "all") {
        const isActive = isActiveFilter === "active";
        targetStudents = targetStudents.filter(
          (s) => getStudentStatus(s.StudentID) === isActive
        );
      }
      if (searchQuery) {
        const lower = searchQuery.toLowerCase().trim();
        targetStudents = targetStudents.filter((tx) => {
          const studentIdMatch =
            (tx.StudentID &&
              String(tx.StudentID).toLowerCase().includes(lower)) ||
            (tx.TempID && String(tx.TempID).toLowerCase().includes(lower));
          const studentNameMatch =
            tx.CandidateName &&
            String(tx.CandidateName).toLowerCase().includes(lower);
          return studentIdMatch || studentNameMatch;
        });
      }

      if (targetStudents.length === 0) {
        setSnackbarMessage("No students found matching the selected criteria.");
        setOpenSnackbar(true);
        setAttendanceExportLoading(false);
        return;
      }

      setExportProgressText("Fetching holidays & calendar...");
      let holidaysList = [];
      try {
        const holidayRes = await axios.get(
          `https://namami-infotech.com/LIT/src/holiday/view_holiday.php?Tenent_Id=${user?.tenent_id || "1"}`,
          { timeout: 10000 }
        );
        if (holidayRes.data?.success && Array.isArray(holidayRes.data.data)) {
          holidaysList = holidayRes.data.data;
        }
      } catch (err) {
        console.warn("Error fetching holidays:", err);
      }

      setExportProgressText("Fetching attendance logs...");
      const studentAttendanceMap = new Map();
      let bulkLoaded = false;
      try {
        const attRes = await axios.get(
          "https://namami-infotech.com/LIT/src/attendance/get_attendance.php",
          { timeout: 15000 }
        );
        if (
          attRes.data?.success &&
          Array.isArray(attRes.data.data) &&
          attRes.data.data.length > 0
        ) {
          attRes.data.data.forEach((rec) => {
            const empId = String(
              rec.EmpId || rec.emp_id || rec.StudentID || ""
            )
              .trim()
              .toLowerCase();
            if (!empId) return;
            if (!studentAttendanceMap.has(empId)) {
              studentAttendanceMap.set(empId, []);
            }
            studentAttendanceMap.get(empId).push(rec);
          });
          bulkLoaded = true;
        }
      } catch (err) {
        console.warn("Bulk attendance API error, will fallback:", err);
      }

      // If bulk attendance didn't load or returned 0 records, fetch per student
      const missingStudents = targetStudents.filter((s) => {
        const sid = String(s.StudentID || "").trim().toLowerCase();
        return !studentAttendanceMap.has(sid);
      });

      if (
        !bulkLoaded ||
        (missingStudents.length > 0 && missingStudents.length <= 60)
      ) {
        const toFetch = !bulkLoaded ? targetStudents : missingStudents;
        const batchSize = 6;
        for (let i = 0; i < toFetch.length; i += batchSize) {
          const chunk = toFetch.slice(i, i + batchSize);
          setExportProgressText(
            `Fetching individual logs (${Math.min(
              i + batchSize,
              toFetch.length
            )}/${toFetch.length})...`
          );
          await Promise.all(
            chunk.map(async (stu) => {
              const sid = String(stu.StudentID || "").trim();
              if (!sid) return;
              try {
                const res = await axios.get(
                  "https://namami-infotech.com/LIT/src/attendance/view_attendance.php",
                  { params: { EmpId: sid }, timeout: 8000 }
                );
                if (res.data?.success && Array.isArray(res.data.data)) {
                  studentAttendanceMap.set(sid.toLowerCase(), res.data.data);
                }
              } catch (e) {
                // Ignore individual failure
              }
            })
          );
        }
      }

      setExportProgressText("Calculating attendance averages...");

      // Helper function to check if a day is a working day (excluding Sunday and course/sem specific holidays)
      const isWorkingDay = (day, studentCourse, studentSem) => {
        if (isSunday(day)) return false;

        const currentDate = format(day, "yyyy-MM-dd");
        const normalizedCourse = String(studentCourse || "").trim().toLowerCase();
        const normalizedSem = String(studentSem || "").trim();

        const isHoliday = holidaysList.some((holiday) => {
          if (!holiday.date) return false;
          const holidayDate = String(holiday.date).trim().split(" ")[0].split("T")[0];
          if (holidayDate !== currentDate) return false;

          const holidayCourse = String(holiday.Course || "").trim().toLowerCase();
          const holidaySem = String(holiday.Sem || "").trim();

          const courseMatches =
            !holidayCourse || holidayCourse === "all" || holidayCourse === normalizedCourse;
          const semMatches =
            !holidaySem || holidaySem.toLowerCase() === "all" || holidaySem === normalizedSem;

          return courseMatches && semMatches;
        });

        return !isHoliday;
      };

      // Generate months array between targetStartMonth and targetEndMonth
      const [sY, sM] = targetStartMonth.split("-").map(Number);
      const [eY, eM] = targetEndMonth.split("-").map(Number);
      const months = [];
      let y = sY;
      let m = sM - 1;
      const targetEndVal = eY * 12 + (eM - 1);

      while (y * 12 + m <= targetEndVal) {
        const curDate = new Date(y, m, 1);
        const monthKey = `${y}-${String(m + 1).padStart(2, "0")}`;
        const monthName = curDate.toLocaleString("en-US", {
          month: "short",
          year: "numeric",
        });
        months.push({
          year: y,
          month: m,
          monthKey,
          monthName,
          startDate: new Date(y, m, 1),
          endDate: new Date(y, m + 1, 0),
        });
        m++;
        if (m > 11) {
          m = 0;
          y++;
        }
      }

      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(
        today.getMonth() + 1
      ).padStart(2, "0")}`;

      // Build Excel Rows
      const excelRows = targetStudents.map((student) => {
        const studentIdNorm = String(student.StudentID || "")
          .trim()
          .toLowerCase();
        const studentTempIdNorm = String(student.TempID || "")
          .trim()
          .toLowerCase();
        const rawPunches =
          studentAttendanceMap.get(studentIdNorm) ||
          (studentTempIdNorm ? studentAttendanceMap.get(studentTempIdNorm) : null) ||
          [];

        let studentTotalClasses = 0;
        let studentTotalPresent = 0;
        let sumOfMonthlyPercentages = 0;
        let validMonthsCount = 0;

        const row = {
          "Student ID": student.StudentID || "N/A",
          "Student Name": student.CandidateName || "N/A",
          Semester: student.Sem || "N/A",
          Course: student.Course || "N/A",
          Batch: student.Session || "N/A",
        };

        months.forEach((mon) => {
          const isFuture = mon.monthKey > currentMonthKey;
          if (isFuture) {
            row[`${mon.monthName} Classes`] = "-";
            row[`${mon.monthName} Present`] = "-";
            row[`${mon.monthName} (%)`] = "-";
            return;
          }

          // Calculate working days in this month for this student
          const daysInMonth = eachDayOfInterval({
            start: mon.startDate,
            end: mon.endDate,
          });
          const workingDays = daysInMonth.filter((d) =>
            isWorkingDay(d, student.Course, student.Sem)
          );
          const totalClasses = workingDays.length;

          // Find present dates within this month that fall on working days (Option 3)
          const presentDates = new Set();
          rawPunches.forEach((punch) => {
            const rawVal =
              punch.InTime || punch.date || punch.Date || punch.attendance_date;
            const normDate = normalizeDateKey(rawVal);
            if (!normDate) return;

            const [pY, pM, pD] = normDate.split("-").map(Number);
            if (pY === mon.year && pM === mon.month + 1) {
              const punchDay = new Date(pY, pM - 1, pD);
              if (isWorkingDay(punchDay, student.Course, student.Sem)) {
                presentDates.add(normDate);
              }
            }
          });

          const presentCount = Math.min(totalClasses, presentDates.size);
          const pct =
            totalClasses > 0
              ? Math.min(100, (presentCount / totalClasses) * 100).toFixed(1)
              : "0.0";

          row[`${mon.monthName} Classes`] = totalClasses;
          row[`${mon.monthName} Present`] = presentCount;
          row[`${mon.monthName} (%)`] = `${pct}%`;

          studentTotalClasses += totalClasses;
          studentTotalPresent += presentCount;
          if (totalClasses > 0) {
            sumOfMonthlyPercentages += Number(pct);
            validMonthsCount += 1;
          }
        });

        const studentTotalAbsent = Math.max(
          0,
          studentTotalClasses - studentTotalPresent
        );

        // Exact calculation as AttendanceSummary.js (Mean of monthly percentages)
        const summaryAveragePct =
          validMonthsCount > 0
            ? Math.min(
                100,
                sumOfMonthlyPercentages / validMonthsCount,
              ).toFixed(2)
            : "0.00";

        row["Total Classes"] = studentTotalClasses;
        row["Total Present"] = studentTotalPresent;
        row["Total Absent"] = studentTotalAbsent;
        // Matches AttendanceSummary.js (62.14%)
        row["Attendance Average (%)"] = `${summaryAveragePct}%`;

        return row;
      });

      // Export to Excel sheet
      const ws = XLSX.utils.json_to_sheet(excelRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Attendance Average");

      const semPart = targetSem ? `_Sem_${targetSem}` : "";
      const fileName = `Student_Attendance_Average${semPart}_${targetStartMonth}_to_${targetEndMonth}.xlsx`;

      XLSX.writeFile(wb, fileName);

      setSnackbarMessage(
        `Attendance Average Excel downloaded successfully (${excelRows.length} students)!`
      );
      setOpenSnackbar(true);
      setAttendanceDialogOpen(false);
    } catch (err) {
      console.error("Attendance Average export error:", err);
      setSnackbarMessage(
        "Failed to export attendance average: " +
          (err.message || "Unknown error")
      );
      setOpenSnackbar(true);
    } finally {
      setAttendanceExportLoading(false);
      setExportProgressText("");
    }
  };

  // Calculate counts for summary
  const activeCount = transactions.filter((tx) =>
    getStudentStatus(tx.StudentID),
  ).length;
  const inactiveCount = transactions.length - activeCount;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ color: "#CC7A00" }}>Students List</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Tooltip title="Export Attendance Average (Excel)">
            <Button
              variant="outlined"
              startIcon={<AssessmentIcon />}
              onClick={handleOpenAttendanceDialog}
              sx={{
                borderColor: "#CC7A00",
                color: "#CC7A00",
                "&:hover": {
                  borderColor: "#B36B00",
                  backgroundColor: "rgba(204, 122, 0, 0.08)",
                },
                textTransform: "none",
                fontWeight: 600,
                height: 40,
                whiteSpace: "nowrap",
              }}
            >
              Attendance Avg Excel
            </Button>
          </Tooltip>

          <Tooltip title="Export to Excel">
            <IconButton
              onClick={exportToExcel}
              disabled={isExporting || filteredTransactions.length === 0}
              color="primary"
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>

          <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={hasActiveFilters() ? "primary" : "default"}
              sx={{
                border: hasActiveFilters() ? "2px solid #1976d2" : "none",
                borderRadius: 1,
              }}
            >
              <FilterListIcon />
              {hasActiveFilters() && (
                <Chip
                  label={getActiveFilterCount()}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    height: 20,
                    minWidth: 20,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          <TextField
            placeholder="Search ID, Name, Parent, Mobile..."
            variant="outlined"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: "text.secondary", fontSize: 24, ml: 0.5, mr: 0.5 }} />
                </InputAdornment>
              ),
              endAdornment: searchQuery ? (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => handleSearch("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ) : null,
            }}
            sx={{
              width: { xs: 340, sm: 460, md: 540, lg: 620 },
              "& .MuiOutlinedInput-root": {
                borderRadius: 2,
                backgroundColor: "#fff",
                height: 48,
                fontSize: "1.05rem",
                "& fieldset": {
                  borderColor: "rgba(0, 0, 0, 0.23)",
                },
                "&:hover fieldset": {
                  borderColor: "#CC7A00",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#CC7A00",
                  borderWidth: 2,
                },
              },
              "& .MuiInputBase-input": {
                padding: "12px 14px 12px 4px",
                fontSize: "1rem",
                "&::placeholder": {
                  fontSize: "0.95rem",
                  opacity: 0.7,
                },
              },
            }}
          />
        </div>
      </div>

      {/* Filter Section */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <h4 style={{ margin: 0 }}>Filters</h4>
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              disabled={!hasActiveFilters()}
            >
              Clear All
            </Button>
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap sx={{ alignItems: "center" }}>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseFilter}
                onChange={(e) => setCourseFilter(e.target.value)}
                label="Course"
              >
                <MenuItem value="">All Courses</MenuItem>
                {uniqueCourses.map((course) => (
                  <MenuItem key={course} value={course}>
                    {course}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Batch</InputLabel>
              <Select
                value={batchFilter}
                onChange={(e) => setBatchFilter(e.target.value)}
                label="Batch"
              >
                <MenuItem value="">All Batches</MenuItem>
                {uniqueBatches.map((batch) => (
                  <MenuItem key={batch} value={batch}>
                    {batch}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                value={semesterFilter}
                onChange={(e) => setSemesterFilter(e.target.value)}
                label="Semester"
              >
                <MenuItem value="">All Semesters</MenuItem>
                {uniqueSemesters.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={isActiveFilter}
                onChange={(e) => setIsActiveFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              type="month"
              label="Start Month"
              value={startMonth}
              onChange={(e) => setStartMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />

            <TextField
              size="small"
              type="month"
              label="End Month"
              value={endMonth}
              onChange={(e) => setEndMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ minWidth: 160 }}
            />

            <Button
              variant="contained"
              startIcon={<AssessmentIcon />}
              onClick={handleOpenAttendanceDialog}
              sx={{
                backgroundColor: "#CC7A00",
                "&:hover": { backgroundColor: "#B36B00" },
                textTransform: "none",
                fontWeight: 600,
                height: 40,
                whiteSpace: "nowrap",
              }}
            >
              Export Attendance Avg
            </Button>
          </Stack>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {searchQuery && (
                  <Chip
                    label={`Search: "${searchQuery}"`}
                    onDelete={() => setSearchQuery("")}
                    size="small"
                  />
                )}
                {courseFilter && (
                  <Chip
                    label={`Course: ${courseFilter}`}
                    onDelete={() => setCourseFilter("")}
                    size="small"
                  />
                )}
                {batchFilter && (
                  <Chip
                    label={`Batch: ${batchFilter}`}
                    onDelete={() => setBatchFilter("")}
                    size="small"
                  />
                )}
                {semesterFilter && (
                  <Chip
                    label={`Semester: ${semesterFilter}`}
                    onDelete={() => setSemesterFilter("")}
                    size="small"
                  />
                )}
                {startMonth && (
                  <Chip
                    label={`Start Month: ${startMonth}`}
                    onDelete={() => setStartMonth("")}
                    size="small"
                  />
                )}
                {endMonth && (
                  <Chip
                    label={`End Month: ${endMonth}`}
                    onDelete={() => setEndMonth("")}
                    size="small"
                  />
                )}
                {isActiveFilter !== "all" && (
                  <Chip
                    label={`Status: ${isActiveFilter === "active" ? "Active" : "Inactive"}`}
                    onDelete={() => setIsActiveFilter("all")}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student ID</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Student Name</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Course</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Batch</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Semester</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Mobile</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Guardian Name</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Mother Name</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>Status</TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>View</TableCell>
              {user && user.role === "HR" && (
                <>
                  <TableCell style={{ color: "white" }}>
                    Reset Mobile ID
                  </TableCell>
                  <TableCell style={{ color: "white" }}>
                    Disable/Enable
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length > 0 ? (
              filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((tx) => {
                  const isActive = getStudentStatus(tx.StudentID);
                  return (
                    <TableRow
                      key={tx.TransactionId || tx.StudentID}
                      sx={{
                        backgroundColor: !isActive ? "#f5f5f5" : "inherit",
                        opacity: !isActive ? 0.7 : 1,
                      }}
                    >
                      <TableCell>{tx.StudentID || "-"}</TableCell>
                      <TableCell>{tx.CandidateName || "-"}</TableCell>
                      <TableCell>{tx.Course || "-"}</TableCell>
                      <TableCell>{tx.Session || "-"}</TableCell>
                      <TableCell>{tx.Sem ? `Sem ${tx.Sem}` : (tx.Sem === 0 ? "0" : "-")}</TableCell>
                      <TableCell>
                        <Box>
                          <Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
                            {tx.StudentContactNo || tx.GuardianContactNo || tx.AlternateGaurdiaNumber || "-"}
                          </Typography>
                          {tx.StudentContactNo && tx.GuardianContactNo && tx.StudentContactNo !== tx.GuardianContactNo && (
                            <Typography variant="caption" sx={{ color: "text.secondary", display: "block", fontSize: "0.75rem" }}>
                              G: {tx.GuardianContactNo}
                            </Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{tx.GuardianName || tx.FatherName || tx.father_name || "-"}</TableCell>
                      <TableCell>{tx.mother_name || tx.MotherName || "-"}</TableCell>
                      <TableCell>
                        <Chip
                          label={isActive ? "Active" : "Inactive"}
                          color={isActive ? "success" : "error"}
                          size="small"
                          icon={isActive ? <CheckCircleIcon /> : <BlockIcon />}
                        />
                      </TableCell>
                      <TableCell>
                        <Tooltip title="View Student Details">
                          <VisibilityIcon
                            color="primary"
                            sx={{ cursor: "pointer" }}
                            onClick={() => handleViewClick(tx.StudentID)}
                          />
                        </Tooltip>
                      </TableCell>
                      {user && user.role === "HR" && (
                        <>
                          <TableCell>
                            <Tooltip title="Reset Mobile ID">
                              <IconButton
                                sx={{
                                  backgroundColor: "red",
                                  color: "white",
                                  ":hover": { backgroundColor: "darkred" },
                                }}
                                onClick={() =>
                                  handleRemoveMobileID(tx.StudentID)
                                }
                              >
                                <RestartAltIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Tooltip
                              title={
                                isActive ? "Disable Student" : "Enable Student"
                              }
                            >
                              <FormControlLabel
                                control={
                                  <Switch
                                    checked={isActive}
                                    onChange={() => handleToggleActive(tx)}
                                    disabled={loading}
                                    color={isActive ? "primary" : "secondary"}
                                  />
                                }
                                label=""
                              />
                            </Tooltip>
                          </TableCell>
                        </>
                      )}
                    </TableRow>
                  );
                })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={user && user.role === "HR" ? 12 : 10}
                  align="center"
                >
                  No students found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                count={filteredTransactions.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      {/* Summary information */}
      <Box
        sx={{
          mt: 2,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <Box sx={{ display: "flex", gap: 1 }}>
          <Chip
            label={`Total Students: ${transactions.length}`}
            color="primary"
            variant="outlined"
          />
          <Chip
            label={`Active: ${activeCount}`}
            color="success"
            variant="outlined"
          />
          <Chip
            label={`Inactive: ${inactiveCount}`}
            color="error"
            variant="outlined"
          />
        </Box>
        {hasActiveFilters() && (
          <Chip
            label={`Filtered: ${filteredTransactions.length}`}
            color="secondary"
            variant="outlined"
          />
        )}
      </Box>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Variable Fee</DialogTitle>
        <DialogContent>
          <FormControl fullWidth margin="normal">
            <InputLabel>Student</InputLabel>
            <Select
              value={selectedStudent}
              onChange={(e) => setSelectedStudent(e.target.value)}
            >
              {transactions.map((student) => (
                <MenuItem key={student.StudentID} value={student.StudentID}>
                  {student.StudentID} - {student.CandidateName}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            fullWidth
            margin="normal"
            label="Particular"
            value={particular}
            onChange={(e) => setParticular(e.target.value)}
          />
          <TextField
            fullWidth
            margin="normal"
            label="Amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleSubmit} color="primary">
            Submit
          </Button>
        </DialogActions>
      </Dialog>

      {/* Attendance Average Export Dialog */}
      <Dialog
        open={attendanceDialogOpen}
        onClose={() => !attendanceExportLoading && setAttendanceDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle
          sx={{
            backgroundColor: "#CC7A00",
            color: "#fff",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <AssessmentIcon /> Export Student Attendance Average (Excel)
        </DialogTitle>
        <DialogContent sx={{ pt: 3, mt: 1 }}>
          <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
            Select Semester and the date range (Start &amp; End Month) to calculate student attendance averages, monthly breakdown, and download as an Excel file.
          </Typography>

          <Stack spacing={2.5}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={dialogSemester}
                onChange={(e) => setDialogSemester(e.target.value)}
                label="Semester"
              >
                <MenuItem value="">All Semesters</MenuItem>
                {uniqueSemesters.map((sem) => (
                  <MenuItem key={sem} value={sem}>
                    Semester {sem}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Box sx={{ display: "flex", gap: 2 }}>
              <TextField
                fullWidth
                size="small"
                type="month"
                label="Start Month (Month & Year)"
                value={dialogStartMonth}
                onChange={(e) => setDialogStartMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
              <TextField
                fullWidth
                size="small"
                type="month"
                label="End Month (Month & Year)"
                value={dialogEndMonth}
                onChange={(e) => setDialogEndMonth(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Box>

            <Box
              sx={{
                p: 1.5,
                backgroundColor: "#f9f9f9",
                borderRadius: 1.5,
                border: "1px solid #e0e0e0",
              }}
            >
              <Typography
                variant="subtitle2"
                sx={{ fontWeight: 600, color: "#333", mb: 0.5 }}
              >
                Export Summary Preview:
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Target:{" "}
                {dialogSemester ? `Semester ${dialogSemester} students` : "All Semesters"}{" "}
                (
                {
                  transactions.filter(
                    (s) =>
                      !dialogSemester ||
                      String(s.Sem || "").trim() === String(dialogSemester).trim(),
                  ).length
                }{" "}
                students)
              </Typography>
              <Typography variant="body2" color="textSecondary">
                • Months: {dialogStartMonth || "Not selected"} to{" "}
                {dialogEndMonth || "Not selected"}
              </Typography>
              
            </Box>

            {attendanceExportLoading && (
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.5,
                  p: 1.5,
                  backgroundColor: "#fff8e1",
                  borderRadius: 1,
                  border: "1px solid #ffe082",
                }}
              >
                <CircularProgress size={24} sx={{ color: "#CC7A00" }} />
                <Typography variant="body2" sx={{ fontWeight: 500, color: "#CC7A00" }}>
                  {exportProgressText || "Calculating attendance..."}
                </Typography>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button
            onClick={() => setAttendanceDialogOpen(false)}
            disabled={attendanceExportLoading}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={() => handleExportAttendanceAverage()}
            variant="contained"
            disabled={
              attendanceExportLoading || !dialogStartMonth || !dialogEndMonth
            }
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#B36B00" },
              fontWeight: 600,
              textTransform: "none",
            }}
            startIcon={
              attendanceExportLoading ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <FileDownloadIcon />
              )
            }
          >
            {attendanceExportLoading ? "Processing..." : "Download Excel"}
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default StudentsList;