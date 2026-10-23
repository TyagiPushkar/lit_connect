import React, { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardContent,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  CircularProgress,
  Stack,
  Alert,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Chip,
} from "@mui/material";
import { GetApp, Assignment, Refresh } from "@mui/icons-material";
import axios from "axios";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";

const API_BASE = "https://namami-infotech.com/LIT/src/Ptm";
const STUDENTS_API =
  "https://namami-infotech.com/LIT/src/students/get_student.php";

const defaultSemesters = [1, 2, 3, 4, 5, 6];

const todayISO = () => new Date().toISOString().split("T")[0];

export default function PTMReport() {
  const [students, setStudents] = useState([]);
  const [ptmRecords, setPtmRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");

  const [session, setSession] = useState("all");
  const [course, setCourse] = useState("all");
  const [sem, setSem] = useState("all");

  // Pagination for preview table
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Fetch initial data
  const fetchData = async () => {
    setLoading(true);
    setStatusMsg("");
    try {
      const [studentsRes, ptmRes] = await Promise.all([
        axios
          .get(STUDENTS_API)
          .catch(() => ({ data: { success: false, data: [] } })),
        axios
          .get(`${API_BASE}/fetch_ptm.php`)
          .catch(() => ({ data: { success: false, data: [] } })),
      ]);

      if (studentsRes.data?.success && Array.isArray(studentsRes.data.data)) {
        setStudents(studentsRes.data.data);
      }
      if (ptmRes.data?.success && Array.isArray(ptmRes.data.data)) {
        setPtmRecords(ptmRes.data.data);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Compute available sessions dynamically from students (clean & unique)
  const availableSessions = useMemo(() => {
    const rawSessions = students
      .map((s) => (s.Session ? String(s.Session).trim() : ""))
      .filter(Boolean);
    const unique = Array.from(new Set(rawSessions));
    return unique.sort((a, b) => b.localeCompare(a));
  }, [students]);

  // Compute available courses dynamically from students (clean & unique)
  const availableCourses = useMemo(() => {
    const rawCourses = students
      .map((s) => (s.Course ? String(s.Course).trim() : ""))
      .filter(Boolean);
    const unique = Array.from(new Set(rawCourses));
    return unique.sort();
  }, [students]);

  // Compute available semesters from students and PTM records
  const availableSemesters = useMemo(() => {
    const fromStudents = students
      .map((s) => String(s.Sem ?? s.Semester ?? "").trim())
      .filter(Boolean);
    const fromPtm = ptmRecords
      .map((p) => String(p.Sem ?? "").trim())
      .filter(Boolean);

    const unique = Array.from(
      new Set([...defaultSemesters.map(String), ...fromStudents, ...fromPtm]),
    )
      .map(Number)
      .filter((n) => Number.isFinite(n) && n > 0);

    return unique.sort((a, b) => a - b);
  }, [students, ptmRecords]);

  // Lookup map to quickly match PTM record with student
  const studentMap = useMemo(() => {
    const map = new Map();
    students.forEach((s) => {
      if (s.StudentID) map.set(String(s.StudentID).trim().toLowerCase(), s);
      if (s.Id) map.set(String(s.Id).trim().toLowerCase(), s);
    });
    return map;
  }, [students]);

  // Filter PTM records based on selected session, course, and semester
  const filteredPtmRecords = useMemo(() => {
    const getStudent = (p) => {
      const key = String(p.StudentId || "").trim().toLowerCase();
      if (studentMap.has(key)) return studentMap.get(key);
      const nameKey = String(p.StudentName || "").trim().toLowerCase();
      return students.find(
        (s) => String(s.CandidateName || "").trim().toLowerCase() === nameKey,
      );
    };

    return ptmRecords
      .map((p) => {
        const student = getStudent(p);
        const sSession = student?.Session ? String(student.Session).trim() : "-";
        const sCourse = student?.Course ? String(student.Course).trim() : "-";
        const pSem = String(p.Sem ?? student?.Sem ?? "-").trim();
        const attendedVal = String(p.Attended || "").toLowerCase();
        const isAttended =
          attendedVal === "yes" ||
          attendedVal === "1" ||
          (p.Remarks && p.Remarks.trim().length > 0);

        return {
          ...p,
          student,
          session: sSession,
          course: sCourse,
          sem: pSem,
          studentId: student?.StudentID || p.StudentId || "-",
          studentName: p.StudentName || student?.CandidateName || "-",
          isAttended,
        };
      })
      .filter((item) => {
        const matchSession =
          session === "all" ||
          item.session.toLowerCase() === session.trim().toLowerCase();
        const matchCourse =
          course === "all" ||
          item.course.toLowerCase() === course.trim().toLowerCase();
        const matchSem =
          sem === "all" || String(item.sem).trim() === String(sem).trim();

        return matchSession && matchCourse && matchSem;
      });
  }, [ptmRecords, studentMap, students, session, course, sem]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(0);
  }, [session, course, sem]);

  // Handle Excel Download
  const handleDownloadExcel = async () => {
    setDownloading(true);
    setStatusMsg("Preparing PTM Excel report...");

    try {
      // Refresh both APIs to ensure the absolute latest records
      const [studentsRes, ptmRes] = await Promise.all([
        axios
          .get(STUDENTS_API)
          .catch(() => ({ data: { success: false, data: [] } })),
        axios
          .get(`${API_BASE}/fetch_ptm.php`)
          .catch(() => ({ data: { success: false, data: [] } })),
      ]);

      const freshStudents =
        studentsRes.data?.success && Array.isArray(studentsRes.data.data)
          ? studentsRes.data.data
          : students;
      const freshPtm =
        ptmRes.data?.success && Array.isArray(ptmRes.data.data)
          ? ptmRes.data.data
          : ptmRecords;

      // Update state if fresh data obtained
      if (studentsRes.data?.success) setStudents(freshStudents);
      if (ptmRes.data?.success) setPtmRecords(freshPtm);

      // Build fresh lookup map
      const freshMap = new Map();
      freshStudents.forEach((s) => {
        if (s.StudentID) freshMap.set(String(s.StudentID).trim().toLowerCase(), s);
        if (s.Id) freshMap.set(String(s.Id).trim().toLowerCase(), s);
      });

      const getStudent = (p) => {
        const key = String(p.StudentId || "").trim().toLowerCase();
        if (freshMap.has(key)) return freshMap.get(key);
        const nameKey = String(p.StudentName || "").trim().toLowerCase();
        return freshStudents.find(
          (s) => String(s.CandidateName || "").trim().toLowerCase() === nameKey,
        );
      };

      // Filter the records based on active filters
      const exportList = freshPtm
        .map((p) => {
          const s = getStudent(p);
          const sSession = s?.Session ? String(s.Session).trim() : "-";
          const sCourse = s?.Course ? String(s.Course).trim() : "-";
          const pSem = String(p.Sem ?? s?.Sem ?? "-").trim();
          const attendedVal = String(p.Attended || "").toLowerCase();
          const isAttended =
            attendedVal === "yes" ||
            attendedVal === "1" ||
            (p.Remarks && p.Remarks.trim().length > 0);

          return {
            studentId: s?.StudentID || p.StudentId || "-",
            studentName: p.StudentName || s?.CandidateName || "-",
            course: sCourse,
            session: sSession,
            sem: pSem,
            ptmDate: p.PTMDate || "-",
            attended: isAttended ? "Yes" : "No",
            remarks: p.Remarks || "-",
          };
        })
        .filter((item) => {
          const matchSession =
            session === "all" ||
            item.session.toLowerCase() === session.trim().toLowerCase();
          const matchCourse =
            course === "all" ||
            item.course.toLowerCase() === course.trim().toLowerCase();
          const matchSem =
            sem === "all" || String(item.sem).trim() === String(sem).trim();

          return matchSession && matchCourse && matchSem;
        });

      if (exportList.length === 0) {
        Swal.fire({
          icon: "info",
          title: "No Records Found",
          text: `No PTM records found for Session: ${session}, Course: ${course}, Sem: ${sem}.`,
        });
        setStatusMsg("");
        return;
      }

      // Format for Excel worksheet
      const excelRows = exportList.map((item, idx) => ({
        "Sl No": idx + 1,
        StudentId: item.studentId,
        StudentName: item.studentName,
        Course: item.course,
        Session: item.session,
        Sem: item.sem,
        PTMDate: item.ptmDate,
        Attended: item.attended,
        Remarks: item.remarks,
      }));

      // Generate worksheet & workbook
      const worksheet = XLSX.utils.json_to_sheet(excelRows);

      // Auto width for columns
      worksheet["!cols"] = [
        { wch: 8 },  // Sl No
        { wch: 16 }, // StudentId
        { wch: 25 }, // StudentName
        { wch: 16 }, // Course
        { wch: 16 }, // Session
        { wch: 10 }, // Sem
        { wch: 16 }, // PTMDate
        { wch: 12 }, // Attended
        { wch: 45 }, // Remarks
      ];

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "PTM_Report");

      const cleanCourse =
        course === "all" ? "All_Courses" : course.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanSession =
        session === "all"
          ? "All_Sessions"
          : session.replace(/[^a-zA-Z0-9]/g, "_");
      const cleanSem = sem === "all" ? "All_Sem" : `Sem${sem}`;
      const fileName = `PTM_Report_${cleanCourse}_${cleanSession}_${cleanSem}_${todayISO()}.xlsx`;

      XLSX.writeFile(workbook, fileName);

      setStatusMsg(
        `Successfully exported ${excelRows.length} PTM records to Excel.`,
      );

      Swal.fire({
        icon: "success",
        title: "Excel Downloaded",
        text: `Exported ${excelRows.length} PTM records to ${fileName}`,
        timer: 2500,
        showConfirmButton: false,
      });
    } catch (err) {
      console.error("Export error:", err);
      Swal.fire({
        icon: "error",
        title: "Export Failed",
        text: "Could not generate Excel file. Please try again.",
      });
    } finally {
      setDownloading(false);
    }
  };

  return (
    <Card sx={{ boxShadow: 3 }}>
      <CardContent>
        {/* Title */}
        <Typography
          variant="h5"
          component="h2"
          sx={{ mb: 3, color: "#CC7A00", fontWeight: 600 }}
        >
          <Assignment sx={{ mr: 1, verticalAlign: "middle" }} />
          PTM Report Download
        </Typography>

        {/* Controls */}
        <Grid container spacing={2} alignItems="center">
          {/* Session Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Session</InputLabel>
              <Select
                value={session}
                label="Session"
                onChange={(e) => setSession(e.target.value)}
              >
                <MenuItem value="all">All Sessions</MenuItem>
                {availableSessions.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Course Selector */}
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={course}
                label="Course"
                onChange={(e) => setCourse(e.target.value)}
              >
                <MenuItem value="all">All Courses</MenuItem>
                {availableCourses.map((c) => (
                  <MenuItem key={c} value={c}>
                    {c}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Semester Selector */}
          <Grid item xs={12} sm={6} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={sem}
                label="Semester"
                onChange={(e) => setSem(e.target.value)}
              >
                <MenuItem value="all">All Semesters</MenuItem>
                {availableSemesters.map((num) => (
                  <MenuItem key={num} value={num}>
                    Semester {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Action Buttons */}
          <Grid item xs={12} sm={6} md={4}>
            <Stack direction="row" spacing={2} justifyContent="flex-end">
              <Button
                variant="outlined"
                onClick={fetchData}
                disabled={loading || downloading}
                startIcon={
                  loading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <Refresh />
                  )
                }
                sx={{
                  color: "#CC7A00",
                  borderColor: "#CC7A00",
                  "&:hover": { borderColor: "#b36b00", bgcolor: "#fff3e0" },
                  textTransform: "none",
                }}
              >
                Refresh
              </Button>

              <Button
                variant="contained"
                onClick={handleDownloadExcel}
                disabled={
                  downloading || loading || filteredPtmRecords.length === 0
                }
                startIcon={
                  downloading ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <GetApp />
                  )
                }
                sx={{
                  bgcolor: "#CC7A00",
                  "&:hover": { bgcolor: "#b36600" },
                  textTransform: "none",
                  fontWeight: 600,
                }}
              >
                {downloading
                  ? "Exporting..."
                  : `Download Excel (${filteredPtmRecords.length})`}
              </Button>
            </Stack>
          </Grid>
        </Grid>

        {/* Status Alert if any */}
        {statusMsg && (
          <Box sx={{ mt: 2 }}>
            <Alert severity="success" sx={{ py: 0.5 }}>
              {statusMsg}
            </Alert>
          </Box>
        )}

        {/* Live Data Preview Section */}
        <Box sx={{ mt: 4 }}>
          <Stack
            direction="row"
            justifyContent="space-between"
            alignItems="center"
            sx={{ mb: 1.5 }}
          >
            <Typography variant="h6" sx={{ fontSize: "1.1rem", fontWeight: 600 }}>
              PTM Records Preview
            </Typography>
            <Chip
              label={`${filteredPtmRecords.length} records`}
              color="primary"
              size="small"
              sx={{ bgcolor: "#CC7A00", fontWeight: 600 }}
            />
          </Stack>

          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress size={32} sx={{ color: "#CC7A00" }} />
            </Box>
          ) : filteredPtmRecords.length === 0 ? (
            <Paper variant="outlined" sx={{ p: 4, textAlign: "center", bgcolor: "#fafafa" }}>
              <Typography variant="body1" color="text.secondary">
                No PTM records match the selected filters.
              </Typography>
            </Paper>
          ) : (
            <Paper variant="outlined">
              <TableContainer sx={{ maxHeight: 420 }}>
                <Table size="small" stickyHeader>
                  <TableHead>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        #
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Student ID
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Student Name
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Course
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Session
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Sem
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        PTM Date
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Attended
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600, bgcolor: "#f5f5f5" }}>
                        Remarks
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredPtmRecords
                      .slice(
                        page * rowsPerPage,
                        page * rowsPerPage + rowsPerPage,
                      )
                      .map((row, index) => (
                        <TableRow key={`${row.StudentId}-${row.PTMDate}-${index}`} hover>
                          <TableCell>{page * rowsPerPage + index + 1}</TableCell>
                          <TableCell sx={{ fontWeight: 500 }}>
                            {row.studentId}
                          </TableCell>
                          <TableCell>{row.studentName}</TableCell>
                          <TableCell>{row.course}</TableCell>
                          <TableCell>{row.session}</TableCell>
                          <TableCell>{row.sem}</TableCell>
                          <TableCell>{row.PTMDate || "-"}</TableCell>
                          <TableCell>
                            <Chip
                              label={row.isAttended ? "Yes" : "No"}
                              size="small"
                              color={row.isAttended ? "success" : "default"}
                              variant="outlined"
                            />
                          </TableCell>
                          <TableCell sx={{ maxWidth: 300, wordBreak: "break-word" }}>
                            {row.Remarks || "-"}
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </TableContainer>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50, 100]}
                component="div"
                count={filteredPtmRecords.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={(e, newPage) => setPage(newPage)}
                onRowsPerPageChange={(e) => {
                  setRowsPerPage(parseInt(e.target.value, 10));
                  setPage(0);
                }}
              />
            </Paper>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
