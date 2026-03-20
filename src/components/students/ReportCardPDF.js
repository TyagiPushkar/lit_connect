"use client";
import { useMemo, useRef, useState } from "react";
import useSWR from "swr";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Grid,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import PrintIcon from "@mui/icons-material/Print";
import SchoolIcon from "@mui/icons-material/School";
import PersonIcon from "@mui/icons-material/Person";
import GradeIcon from "@mui/icons-material/Grade";
import DateRangeIcon from "@mui/icons-material/DateRange";
import AssessmentIcon from "@mui/icons-material/Assessment";
import AttendanceSummary from "./AttendanceSummary";

const fetchJSON = async (url) => {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch: " + url);
  return res.json();
};

const fetchStudent = async (url) => {
  const json = await fetchJSON(url);
  return json?.success && json?.data ? json.data : null;
};

const fetchReportArray = async (url) => {
  const json = await fetchJSON(url);
  return json?.success && json?.data ? json.data : [];
};

const calculateGrade = (percentage) => {
  if (percentage >= 80) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 45) return "C";
  return "D";
};

const calculateGPA = (percentage) => {
  if (percentage >= 80) return "4.0";
  if (percentage >= 60) return "3.0";
  if (percentage >= 45) return "2.0";
  return "1.0";
};

export default function ReportCardPDF({ studentId, sem, year }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const reportRef = useRef(null);
  //  const [availableSemesters, setAvailableSemesters] = useState([]);

  const {
    data: student,
    error: studentError,
    isLoading: studentLoading,
  } = useSWR(
    studentId
      ? `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
      : null,
    fetchStudent,
  );

  const course = student?.Course;
  // const semester = useMemo(() => {
  //   if (!student?.Sem) return undefined;
  //   return String(student.Sem);
  // }, [student]);
  const semester = sem ?? (student?.Sem ? String(student.Sem) : undefined);

  const studCode = student?.StudentID;

  const { data: assignment, isLoading: assignmentLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/assignment_report.php?StudId=${encodeURIComponent(
          studCode,
        )}&Course=${encodeURIComponent(course)}&Semester=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  );

  const { data: internal, isLoading: internalLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/internal_exam_report.php?StudId=${encodeURIComponent(
          studCode,
        )}&Course=${encodeURIComponent(course)}&Sem=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  );

  const { data: vst, isLoading: vstLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/vst_exam_report.php?StudId=${encodeURIComponent(
          studCode,
        )}&Course=${encodeURIComponent(course)}&Sem=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  );

  const ctKeys = useMemo(() => ["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"], []);
  const cbtKeys = useMemo(() => ["1", "2", "3", "4", "5", "6"], []);

  const { data: ctAll, isLoading: ctLoading } = useSWR(
    studCode && course && semester
      ? ["ct-all", studCode, course, semester]
      : null,
    async ([, id, crs, sem]) => {
      const urls = ctKeys.map(
        (cat) =>
          `https://namami-infotech.com/LIT/src/report/class_test_report.php?StudId=${encodeURIComponent(
            id,
          )}&Course=${encodeURIComponent(crs)}&Sem=${encodeURIComponent(sem)}&Category=${encodeURIComponent(cat)}`,
      );
      const results = await Promise.all(urls.map(fetchReportArray));
      return ctKeys.map((cat, i) => ({
        category: cat,
        rows: results[i] || [],
      }));
    },
  );

  const { data: cbtAll, isLoading: cbtLoading } = useSWR(
    studCode && course && semester
      ? ["cbt-all", studCode, course, semester]
      : null,
    async ([, id, crs, sem]) => {
      const urls = cbtKeys.map(
        (cat) =>
          `https://namami-infotech.com/LIT/src/report/cbt_report.php?StudId=${encodeURIComponent(
            id,
          )}&Course=${encodeURIComponent(crs)}&Sem=${encodeURIComponent(sem)}&Category=${encodeURIComponent(cat)}`,
      );
      const results = await Promise.all(urls.map(fetchReportArray));
      return cbtKeys.map((cat, i) => ({
        category: cat,
        rows: results[i] || [],
      }));
    },
  );

  const calcMarksTotals = (rows) => {
    let totalMax = 0;
    let totalObtained = 0;
    rows?.forEach((r) => {
      totalMax += Number.parseInt(r?.MaxMarks || 0, 10);
      totalObtained += Number.parseInt(r?.ObtainedMarks || 0, 10);
    });
    const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0;
    return { totalMax, totalObtained, pct };
  };

  const formatPct = (n) => `${(n || 0).toFixed(1)}%`;

  const generatedOn = useMemo(() => {
    const d = new Date();
    const day = d.getDate();
    const month = d.getMonth() + 1;
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }, []);

  const onDownloadPDF = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 1,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const imgs = clonedDoc.getElementsByTagName("img");
          Array.from(imgs).forEach((img) => {
            img.setAttribute("crossorigin", "anonymous");
          });
        },
      });
      const imgData = canvas.toDataURL("image/jpeg", 0.7);

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * pageWidth) / canvas.width;

      // let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(
        imgData,
        "JPEG",
        0,
        position,
        imgWidth,
        imgHeight,
        "",
        "FAST",
      );
      // heightLeft -= pageHeight;
      let y = 0;

      while (y < imgHeight) {
        pdf.addImage(
          imgData,
          "JPEG",
          0,
          -y, // 🔥 main fix
          imgWidth,
          imgHeight,
          "",
          "FAST",
        );

        y += pageHeight;

        if (y < imgHeight) {
          pdf.addPage();
        }
      }

      const fileName = `ReportCard_${studCode || studentId}_Sem${semester || ""}.pdf`;
      pdf.save(fileName);
    } catch (e) {
      console.error("[v0] PDF generation error:", e);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const loading =
    studentLoading ||
    assignmentLoading ||
    internalLoading ||
    vstLoading ||
    ctLoading ||
    cbtLoading;
  const hasError = !!studentError;

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
        <Button
          onClick={onDownloadPDF}
          disabled={loading || hasError || isGenerating}
          variant="contained"
          startIcon={<DownloadIcon />}
          sx={{
            backgroundColor: "#1976d2",
            "&:hover": {
              backgroundColor: "#1565c0",
            },
          }}
        >
          {isGenerating ? "Generating PDF..." : "Download Report Card"}
        </Button>
      </Box>

      {hasError && (
        <Paper sx={{ p: 3, border: "1px solid #d32f2f" }}>
          <Typography color="error" align="center">
            Failed to load student data. Please check the student ID.
          </Typography>
        </Paper>
      )}

      {loading && (
        <Paper sx={{ p: 4, textAlign: "center" }}>
          <Typography>Loading student report data...</Typography>
        </Paper>
      )}

      {!loading && !hasError && (
        <Paper
          ref={reportRef}
          id="reportCard"
          elevation={0}
          // sx={{
          //   p: 0,
          //   fontFamily: '"Courier New", Courier, monospace',
          //   background: "linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%)",
          //   border: "2px solid #333",
          //   position: "relative",
          //   overflow: "visible",
          //   // minHeight: "29.7cm",
          //   boxSizing: "border-box",
          // }}
          sx={{
            // 🔥 IMPORTANT
            minHeight: "297mm",
            p: "2mm", // thoda padding dena zaroori hai
            fontFamily: '"Courier New", Courier, monospace',
            background: "#fff",
            border: "1px solid #333",
            position: "relative",
            overflow: "visible",
            boxSizing: "border-box",
          }}
        >
          {/* Watermark Background */}
          <Box
            sx={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.03,
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Courier New' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ELIT%3C/text%3E%3C/svg%3E\")",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Official Letterhead Header */}
          <Box
            sx={{
              backgroundColor: "#f5f5f5",
              borderBottom: "3px double #333",
              p: 3,
              position: "relative",
              zIndex: 1,
            }}
          >
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                mb: 2,
              }}
            >
              <Box sx={{ textAlign: "left" }}>
                <Box
                  component="img"
                  src={
                    "https://lit-connect.vercel.app/static/media/images%20(1).0a5419d3ae0870e1e361.png"
                  }
                  alt="Institute Seal"
                  sx={{
                    width: 90,
                    height: 90,
                    objectFit: "contain",
                    filter: "grayscale(100%)",
                    border: "1px solid #999",
                    borderRadius: "50%",
                    padding: "4px",
                  }}
                  crossOrigin="anonymous"
                />
              </Box>

              <Box
                sx={{
                  textAlign: "center",
                  flex: 1,
                  px: 4,
                }}
              >
                <Typography
                  variant="h5"
                  sx={{
                    fontWeight: "bold",
                    letterSpacing: "1px",
                    color: "#2c3e50",
                    textTransform: "uppercase",
                    fontFamily: '"Georgia", serif',
                  }}
                >
                  Lakshya Institute of Technology
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#7f8c8d",
                    fontStyle: "italic",
                    mt: 0.5,
                  }}
                >
                  (Affiliated to Utkal University, Odisha)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#555",
                    mt: 1,
                    fontFamily: "Inter, Roboto, sans-serif",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    letterSpacing: "0.3px",
                  }}
                >
                  M4/46, Acharya Vihar, Bhubaneswar, Odisha 751013
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#555",
                    mt: 1,
                    fontFamily: "Inter, Roboto, sans-serif",
                    fontSize: "0.95rem",
                    lineHeight: 1.6,
                    letterSpacing: "0.3px",
                  }}
                >
                  Phone: 0674-2544690 | Email: info@litindia.ac.in
                </Typography>
              </Box>

              <Box sx={{ textAlign: "right" }}>
                <Box
                  sx={{
                    border: "2px solid #333",
                    padding: "8px",
                    display: "inline-block",
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{ display: "block", fontStyle: "italic" }}
                  >
                    Date: {generatedOn}
                  </Typography>
                </Box>
              </Box>
            </Box>

            {/* Decorative Line */}
            <Box
              sx={{
                height: "2px",
                background:
                  "linear-gradient(to right, transparent, #333, transparent)",
                margin: "10px 0",
              }}
            />

            <Typography
              variant="h4"
              align="center"
              sx={{
                fontWeight: "bold",
                textTransform: "uppercase",
                letterSpacing: "3px",
                color: "#2c3e50",
                textDecoration: "underline",
                mt: 2,
                fontFamily: '"Times New Roman", serif',
              }}
            >
              Report Card
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{
                color: "#555",
                mt: 1,
                fontFamily: "Inter, Roboto, sans-serif",
                fontSize: "0.95rem",
                lineHeight: 1.6,
                letterSpacing: "0.3px",
              }}
            >
              Academic Session: {student?.Session || "2024-2025"}
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={{ p: 4, position: "relative", zIndex: 1 }}>
            {/* Student Information Box */}
            <Box
              sx={{
                border: "2px solid #333",
                padding: "20px",
                marginBottom: "30px",
                backgroundColor: "#fafafa",
                position: "relative",
              }}
            >
              {/* Corner Decorations */}
              <Box
                sx={{
                  position: "absolute",
                  top: "-10px",
                  left: "20px",
                  backgroundColor: "#f5f5f5",
                  padding: "0 10px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                  fontSize: "15px",
                }}
              >
                STUDENT PARTICULARS
              </Box>
              {/* student bio data */}
              <Grid container spacing={3}>
                {/* <Grid item xs={6}>
                  <Typography
                    sx={{
                      color: "#555",
                      mt: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "0.95rem",
                      lineHeight: 1.6,
                      letterSpacing: "0.3px",
                    }}
                  >
                    <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                      Name:
                    </span>
                    {student?.CandidateName || "N/A"}
                  </Typography>
                  <Typography
                    sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}
                  >
                    <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                      Father's Name:
                    </span>
                    {student?.FatherName || student?.GuardianName || "-"}
                  </Typography>
                  <Typography
                    sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}
                  >
                    <span style={{ fontWeight: "bold", marginRight: "10px" }}>
                      Course:
                    </span>
                    {course || "N/A"}
                  </Typography>
                </Grid> */}
                <Grid item xs={6}>
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Name
                    </span>
                    : {student?.CandidateName || "N/A"}
                  </Typography>

                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Father's Name
                    </span>
                    : {student?.FatherName || student?.GuardianName || "-"}
                  </Typography>

                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Course
                    </span>
                    : {course || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Roll No
                    </span>
                    : {studCode || studentId || "N/A"}
                  </Typography>
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Semester
                    </span>
                    : {sem || student?.Sem || "N/A"}
                  </Typography>
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "18px",
                      color: "#444",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        minWidth: "140px",
                        color: "#222",
                      }}
                    >
                      Contact No
                    </span>
                    : {student?.StudentContactNo},{" "}
                    {student?.GuardianContactNo || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            <Box sx={{ mb: 2 }}>
              <AttendanceSummary EmpId={studentId} sem={sem} year={year} />
            </Box>
            {/* Internal Examination Results */}
            <Box sx={{ mb: 2 }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#333",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Internal Examination Results
              </Typography>

              {!internal || internal.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed #999",
                    padding: "20px",
                    textAlign: "center",
                    fontStyle: "italic",
                    color: "#666",
                  }}
                >
                  No internal examination data available for this semester.
                </Box>
              ) : (
                <>
                  <TableContainer
                    size="small"
                    sx={{
                      fontFamily: '"Courier New", monospace',
                      border: "1px solid #333",
                      "& .MuiTableCell-root": {
                        padding: "4px 8px",
                        fontSize: "16px",
                        lineHeight: 1.2,
                      },
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              fontSize: "14px",
                              textAlign: "center",
                            }}
                          >
                            Subject Code
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              fontSize: "14px",
                              textAlign: "center",
                            }}
                          >
                            Subject Name
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            Max Marks
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            Marks Obtained
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            Percentage
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "14px",
                            }}
                          >
                            Grade
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {internal.map((row, idx) => {
                          const max = Number.parseInt(row?.MaxMarks || 0, 10);
                          const got = Number.parseInt(
                            row?.ObtainedMarks || 0,
                            10,
                          );
                          const pct = max > 0 ? (got / max) * 100 : 0;
                          const grade = calculateGrade(pct);
                          return (
                            <TableRow key={idx} hover>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "14px",
                                }}
                              >
                                {row?.SubjectCode || "-"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "14px",
                                }}
                              >
                                {row?.Subject || "-"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "14px",
                                }}
                              >
                                {max}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  fontSize: "14px",
                                }}
                              >
                                {got}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "14px",
                                }}
                              >
                                {formatPct(pct)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "14px",
                                }}
                              >
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    fontSize: "14px",
                                    backgroundColor:
                                      grade === "A"
                                        ? "#e8f5e8"
                                        : grade === "B"
                                          ? "#e3f2fd"
                                          : grade === "C"
                                            ? "#fff8e1"
                                            : "#ffebee",
                                    border: "1px solid",
                                    borderColor:
                                      grade === "A"
                                        ? "#4caf50"
                                        : grade === "B"
                                          ? "#2196f3"
                                          : grade === "C"
                                            ? "#ff9800"
                                            : "#f44336",
                                    borderRadius: "2px",
                                    fontWeight: "bold",
                                  }}
                                >
                                  {grade}
                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summary Box */}
                  <Box
                    sx={{
                      border: "2px solid #333",
                      mt: 2,
                      px: 2,
                      py: 1,
                      backgroundColor: "#f9f9f9",
                      fontFamily: '"Courier New", monospace',
                    }}
                  >
                    <Grid container alignItems="center">
                      <Grid item xs={4} sx={{ textAlign: "center" }}>
                        <Typography
                          sx={{
                            fontFamily: '"Courier New", monospace',
                            fontWeight: "bold",
                          }}
                        >
                          Total Marks: {calcMarksTotals(internal).totalObtained}{" "}
                          / {calcMarksTotals(internal).totalMax}
                        </Typography>
                        {/* <Typography
                          variant="h6"
                          sx={{
                            fontFamily: '"Courier New", monospace',
                            fontWeight: "bold",
                          }}
                        >
                          {calcMarksTotals(internal).totalObtained} /{" "}
                          {calcMarksTotals(internal).totalMax}
                        </Typography> */}
                      </Grid>
                      <Grid item xs={4}>
                        <Typography
                          sx={{
                            fontFamily: '"Courier New", monospace',
                            fontWeight: "bold",
                          }}
                        >
                          Overall Percentage:{" "}
                          {formatPct(calcMarksTotals(internal).pct)}
                        </Typography>
                        {/* <Typography
                          variant="h6"
                          sx={{
                            fontFamily: '"Courier New", monospace',
                            fontWeight: "bold",
                            color: "#1976d2",
                          }}
                        >
                          {formatPct(calcMarksTotals(internal).pct)}
                        </Typography> */}
                      </Grid>
                      <Grid item xs={4}>
                        <Typography
                          sx={{
                            fontFamily: '"Courier New", monospace',
                            fontWeight: "bold",
                          }}
                        >
                          Final Grade:
                          {calculateGrade(calcMarksTotals(internal).pct)}
                        </Typography>
                        {/* <Box
                          sx={{
                            display: "inline-block",
                            padding: "4px 16px",
                            backgroundColor: "#333",
                            color: "white",
                            fontWeight: "bold",
                            fontSize: "18px",
                            borderRadius: "2px",
                          }}
                        >
                          {calculateGrade(calcMarksTotals(internal).pct)}
                        </Box> */}
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>

            {/* Class Tests Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#555",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                }}
              >
                Class Test Performance (CT1-CT6)
              </Typography>
              {!ctAll || ctAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#777",
                    mt: 3,
                  }}
                >
                  No class test data recorded.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {ctAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null;

                    return (
                      <Grid item xs={12} sm={6} md={6} key={section.category}>
                        <Box
                          sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            border: "1px solid #333",
                            overflow: "hidden",
                          }}
                        >
                          {/* Title */}
                          <Box
                            sx={{
                              background: "#f5f7fa",
                              px: 2,
                              py: 1,
                              // borderBottom: "1px solid #e0e0e0",
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>
                              {section.category}
                            </Typography>
                          </Box>
                          {/* Table */}
                          <TableContainer
                            size="small"
                            sx={{
                              fontFamily: '"Courier New", monospace',
                              // border: "1px solid #333",
                              "& .MuiTableCell-root": {
                                padding: "4px 8px",
                                fontSize: "16px",
                                lineHeight: 1.2,
                              },
                            }}
                          >
                            <Table size="small" sx={{ width: "100%" }}>
                              <TableHead>
                                <TableRow
                                  sx={{
                                    background: "#fafafa",
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Subject
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Max
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Obt
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    %
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                      fontSize: "14px",
                                    }}
                                  >
                                    Grade
                                  </TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {section.rows.map((row, index) => {
                                  const pct =
                                    (row.ObtainedMarks / row.MaxMarks) * 100;
                                  const grade = calculateGrade(pct);

                                  return (
                                    <TableRow
                                      key={row.Id}
                                      sx={{
                                        backgroundColor:
                                          index % 2 === 0 ? "#fff" : "#fafafa",
                                      }}
                                    >
                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",

                                          fontSize: "14px",
                                        }}
                                      >
                                        {row.Subject}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "14px",
                                        }}
                                      >
                                        {row.MaxMarks}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "14px",
                                        }}
                                      >
                                        {row.ObtainedMarks}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "14px",
                                        }}
                                      >
                                        {pct.toFixed(1)}%
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                          fontweight: "bold",
                                          fontSize: "14px",
                                          color:
                                            grade === "A"
                                              ? "#2e7d32"
                                              : grade === "B"
                                                ? "#ed6c02"
                                                : "#d32f2f",
                                        }}
                                      >
                                        {grade}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>

            {/* CBT Section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#555",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                }}
              >
                Pre Placement Training
              </Typography>

              {!cbtAll ||
              cbtAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#666",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  No CBT data recorded.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {cbtAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null;
                    return (
                      <Grid item xs={6} md={6} key={section.category}>
                        <Box
                          sx={{
                            background: "#fff",
                            borderRadius: "10px",
                            border: "1px solid #333",
                            overflow: "hidden",
                          }}
                        >
                          {/* Title */}
                          <Box
                            sx={{
                              background: "#f5f7fa",
                              px: 2,
                              py: 1,
                              // borderBottom: "1px solid #e0e0e0",
                            }}
                          >
                            <Typography sx={{ fontWeight: 600 }}>
                              {section.category}
                            </Typography>
                          </Box>
                          <TableContainer
                            sx={{
                              fontFamily: '"Courier New", monospace',
                              // border: "1px solid #333",
                              "& .MuiTableCell-root": {
                                padding: "4px 8px",
                                fontSize: "16px",
                                lineHeight: 1.2,
                              },
                            }}
                          >
                            <Table size="small" sx={{ Width: "100%" }}>
                              <TableHead>
                                <TableRow
                                  sx={{
                                    background: "#fafafa",
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Subject
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Max
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Obt
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    %
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      border: "1px solid #333",
                                      fontWeight: "bold",
                                    }}
                                  >
                                    Grade
                                  </TableCell>
                                </TableRow>
                              </TableHead>
                              <TableBody>
                                {section.rows.map((row, index) => {
                                  const pct =
                                    (row.ObtainedMarks / row.MaxMarks) * 100;
                                  const grade = calculateGrade(pct);

                                  return (
                                    <TableRow
                                      key={row.Id}
                                      sx={{
                                        backgroundColor:
                                          index % 2 === 0 ? "#fff" : "#fafafa",
                                      }}
                                    >
                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                        }}
                                      >
                                        {row.Subject}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                        }}
                                      >
                                        {row.MaxMarks}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                        }}
                                      >
                                        {row.ObtainedMarks}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                        }}
                                      >
                                        {pct.toFixed(1)}%
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                          color:
                                            grade === "A"
                                              ? "#2e7d32"
                                              : grade === "B"
                                                ? "#ed6c02"
                                                : "#d32f2f",
                                        }}
                                      >
                                        {grade}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Grid>
                    );
                  })}
                </Grid>
              )}
            </Box>

            {/* vst section */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#555",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                }}
              >
                Very Similar Tests
              </Typography>

              {!vst || vst.length === 0 ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#666",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  No vst data recorded.
                </Typography>
              ) : (
                <TableContainer
                  size="small"
                  sx={{
                    fontFamily: '"Courier New", monospace',
                    "& .MuiTableCell-root": {
                      padding: "4px 8px",
                      fontSize: "16px",
                      lineHeight: 1.2,
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Subject Code
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Subject Name
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Max Marks
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Marks Obtained
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Percentage
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Grade
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vst.map((row, idx) => {
                        const max = Number.parseInt(row?.MaxMarks || 0, 10);
                        const got = Number.parseInt(
                          row?.ObtainedMarks || 0,
                          10,
                        );
                        const pct = max > 0 ? (got / max) * 100 : 0;
                        const grade = calculateGrade(pct);
                        return (
                          <TableRow key={idx} hover>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {row?.SubjectCode || "-"}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {row?.Subject || "-"}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {max}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontWeight: "bold",
                              }}
                            >
                              {got}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {formatPct(pct)}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              <Box
                                sx={{
                                  display: "inline-block",
                                  padding: "2px 8px",
                                  backgroundColor:
                                    grade === "A"
                                      ? "#e8f5e8"
                                      : grade === "B"
                                        ? "#e3f2fd"
                                        : grade === "C"
                                          ? "#fff8e1"
                                          : "#ffebee",
                                  border: "1px solid",
                                  borderColor:
                                    grade === "A"
                                      ? "#4caf50"
                                      : grade === "B"
                                        ? "#2196f3"
                                        : grade === "C"
                                          ? "#ff9800"
                                          : "#f44336",
                                  borderRadius: "2px",
                                  fontWeight: "bold",
                                }}
                              >
                                {grade}
                              </Box>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
            {/* Assignment section */}
            <Box sx={{ mt: 4 }}>
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#555",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Courier New", monospace',
                  fontWeight: "bold",
                }}
              >
                Assignments
              </Typography>
              {!assignment || assignment.length === 0 ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#666",
                    fontFamily: '"Courier New", monospace',
                  }}
                >
                  No Assignment recorded.
                </Typography>
              ) : (
                <TableContainer
                  sx={{
                    fontFamily: '"Courier New", monospace',
                    "& .MuiTableCell-root": {
                      padding: "4px 8px",
                      fontSize: "16px",
                      lineHeight: 1.2,
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Month
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          sem
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          No Of Class
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Present Class
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #333",
                            fontWeight: "bold",
                            textAlign: "center",
                          }}
                        >
                          Percentage
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {assignment.map((assignment) => {
                        const pct =
                          (assignment.ObtainedMarks / assignment.MaxMarks) *
                          100;

                        return (
                          <TableRow key={assignment.Id}>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                fontWeight: "bold",
                                textAlign: "center",
                              }}
                            >
                              {assignment.Month}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                fontWeight: "bold",
                                textAlign: "center",
                              }}
                            >
                              {assignment.Semester}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {assignment.NoOfClasses}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {assignment.PresentClass}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                              }}
                            >
                              {pct.toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* Footer */}
            <Box
              sx={{
                mt: 2,
                pt: 1,
                borderTop: "2px solid #333",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: '"Courier New", monospace',
                  color: "#666",
                }}
              >
                This is a computer generated document. No signature is required.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: '"Courier New", monospace',
                  color: "#999",
                }}
              >
                Report ID: {studCode || studentId}-{semester || "NA"}-
                {generatedOn.replace(/\//g, "")}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  );
}
