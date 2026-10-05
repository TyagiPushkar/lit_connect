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
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import AttendanceSummary from "./AttendanceSummary";
import PrePlacementTraining from "../report/PrePlacementTraining";
import SkillsGrade from "../report/SkillsGrade";
// import PTMAttendancePDF from "../report/PTMAttendancePDF";

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
  // console.log("fetchReportArray", json);
  return json?.success && json?.data ? json.data : [];
};

const calculateGrade = (percentage) => {
  if (percentage >= 80) return "A";
  if (percentage >= 60) return "B";
  if (percentage >= 45) return "C";
  return "D";
};

const PASS_PERCENTAGE = 35;

const getResultStatus = (percentage, hasValidMarks = true) => {
  if (!hasValidMarks) return "-";
  return percentage >= PASS_PERCENTAGE ? "PASS" : "FAIL";
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

  const { data: semesterExam, isLoading: semesterExamLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/semester_exam_report.php?StudId=${encodeURIComponent(
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

  const { data: subjectsList } = useSWR(
    course && semester
      ? `https://namami-infotech.com/LIT/src/menu/subjects.php?Course=${encodeURIComponent(course)}&Sem=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  );

  const subjectCodeMap = useMemo(() => {
    const map = {};
    (subjectsList || []).forEach((s) => {
      map[s.Subject] = s.SubjectCode;
    });
    return map;
  }, [subjectsList]);

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

  const isAbsent = (row) =>
    String(row?.Status ?? "").toLowerCase() === "absent";

  const calcMarksTotals = (rows) => {
    let totalMax = 0;
    let totalObtained = 0;
    rows?.forEach((r) => {
      if (isAbsent(r)) return;
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
      const container = reportRef.current;
      const containerRect = container.getBoundingClientRect();
      const blocks = Array.from(container.querySelectorAll(".pdf-block"));

      const pdf = new jsPDF({
        orientation: "p",
        unit: "mm",
        format: "a4",
        compress: true,
      });
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const marginTop = 10; // mm
      const marginBottom = 10; // mm
      const contentH = pageH - marginTop - marginBottom;

      // Height of one PDF page in DOM pixels
      const pageH_dom = (containerRect.width * contentH) / pageW;

      // Get relative ranges of each block
      const blockRanges = blocks.map((block) => {
        const rect = block.getBoundingClientRect();
        return {
          top: rect.top - containerRect.top,
          bottom: rect.bottom - containerRect.top,
        };
      });

      const totalHeight = containerRect.height;
      const pageBreaks = [0];
      let currentY = 0;

      while (currentY < totalHeight) {
        let targetY = currentY + pageH_dom;
        if (targetY >= totalHeight) {
          pageBreaks.push(totalHeight);
          break;
        }

        // Adjust targetY so we don't break inside a block
        let adjusted = false;
        for (const block of blockRanges) {
          if (block.top + 2 < targetY && block.bottom - 2 > targetY) {
            if (block.top > currentY + 5) {
              targetY = block.top;
              adjusted = true;
              break;
            }
          }
        }

        if (adjusted) {
          let doubleCheck = true;
          while (doubleCheck) {
            doubleCheck = false;
            for (const block of blockRanges) {
              if (block.top + 2 < targetY && block.bottom - 2 > targetY) {
                if (block.top > currentY + 5) {
                  targetY = block.top;
                  doubleCheck = true;
                  break;
                }
              }
            }
          }
        }

        // Safety fallback to prevent infinite loops
        if (targetY <= currentY + 10) {
          targetY = currentY + pageH_dom;
        }

        pageBreaks.push(targetY);
        currentY = targetY;
      }

      // Generate the full canvas
      const canvas = await html2canvas(container, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
      });

      const scaleRatio = canvas.height / totalHeight;
      const canvasBreaks = pageBreaks.map((y) => y * scaleRatio);

      for (let i = 0; i < pageBreaks.length - 1; i++) {
        const yStartCanvas = canvasBreaks[i];
        const yEndCanvas = canvasBreaks[i + 1];
        const sliceHCanvas = yEndCanvas - yStartCanvas;

        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = sliceHCanvas;

        const ctx = sliceCanvas.getContext("2d");
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        ctx.drawImage(
          canvas,
          0,
          yStartCanvas,
          canvas.width,
          sliceHCanvas,
          0,
          0,
          canvas.width,
          sliceHCanvas,
        );

        if (i > 0) pdf.addPage();

        const pdfSliceH = (sliceHCanvas / canvas.width) * pageW;

        pdf.addImage(
          sliceCanvas.toDataURL("image/jpeg", 0.95),
          "JPEG",
          0,
          marginTop,
          pageW,
          pdfSliceH,
        );
      }

      pdf.save(`ReportCard_${studCode || studentId}_Sem${semester || ""}.pdf`);
    } catch (e) {
      console.error("PDF generation error:", e);
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
    cbtLoading ||
    semesterExamLoading;
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
          sx={{
            // 🔥 IMPORTANT
            minHeight: "297mm",
            p: "2mm", // thoda padding dena zaroori hai
            fontFamily: "Inter, Roboto, Arial, sans-serif",
            background: "#fff",
            border: "1px solid #111",
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
                "url(\"data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Ctext x='50%25' y='50%25' font-family='Arial, sans-serif' font-size='14' text-anchor='middle' dominant-baseline='middle'%3ELIT%3C/text%3E%3C/svg%3E\")",
              pointerEvents: "none",
              zIndex: 0,
            }}
          />

          {/* Official Letterhead Header */}
          <Box
            sx={{
              backgroundColor: "#fffcfcff",
              borderBottom: "3px double #111",
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

                    width: {
                      xs: 120,
                      sm: 150,
                      md: 180,
                    },
                    height: {
                      xs: 120,
                      sm: 150,
                      md: 180,
                    },
                    objectFit: "contain",
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
                    color: "#1a252f",
                    textTransform: "uppercase",
                    fontFamily: '"Georgia", serif',
                    fontSize: "30px",
                  }}
                >
                  Lakshya Institute of Technology
                </Typography>
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#2c3e50",
                    fontStyle: "italic",
                    fontSize: "20px",
                    mt: 0.5,
                  }}
                >
                  (Affiliated to Utkal University, Odisha)
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#111",
                    mt: 1,
                    fontFamily: "Inter, Roboto, sans-serif",
                    fontSize: "19px",
                    lineHeight: 1.6,
                    letterSpacing: "0.3px",
                  }}
                >
                  M4/46, Acharya Vihar, Bhubaneswar, Odisha 751013
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    color: "#111",
                    mt: 1,
                    fontFamily: "Inter, Roboto, sans-serif",
                    fontSize: "19px",
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
                    bgcolor: "transparent",
                    padding: "8px",
                    display: "inline-block",
                    textAlign: "center",
                    minWidth: "100px",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      display: "block",
                      fontStyle: "italic",
                      fontSize: "19px",
                      color: "#111",
                    }}
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
                  "linear-gradient(to right, transparent, #111, transparent)",
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
                color: "#1a252f",
                // textDecoration: "underline",
                mt: 2,
                fontFamily: '"Georgia", serif',
                fontSize: "38px",
              }}
            >
              Report Card
            </Typography>
            <Typography
              variant="h6"
              align="center"
              sx={{
                color: "#111",
                mt: 1,
                fontFamily: "Inter, Roboto, sans-serif",
                fontSize: "21px",
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
              className="pdf-block"
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
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                  fontSize: "20px",
                  color: "#111",
                }}
              >
                STUDENT PARTICULARS
              </Box>
              {/* student bio data */}
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      mb: 1,
                      fontFamily: "Inter, Roboto, sans-serif",
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
                      fontSize: "21px",
                      color: "#111",
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        minWidth: "140px",
                        color: "#000",
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
            <Box sx={{ mb: 2, pt: "15px" }} className="pdf-block">
              <AttendanceSummary EmpId={studentId} sem={sem} year={year} course={course} />
            </Box>

            {/* Semester Examination Results */}
            <Box sx={{ mb: 2 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  fontWeight: "bold",
                  display: "inline-block",
                  marginBottom: "15px",
                }}
              >
                SEMESTER EXAMINATION RESULTS
              </Typography>

              {!semesterExam || semesterExam.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed #999",
                    padding: "20px",
                    textAlign: "center",
                    fontStyle: "italic",
                    color: "#333",
                  }}
                >
                  No semester examination data available for this semester.
                </Box>
              ) : (
                <>
                  <TableContainer
                    size="small"
                    sx={{
                      border: "1px solid #111",
                      "& .MuiTableCell-root": {
                        padding: "6px 10px",
                        fontSize: "20px",
                        lineHeight: 1.3,
                        fontFamily: "Inter, Roboto, Arial, sans-serif",
                      },
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f0f0f0" }} className="pdf-block">
                          <TableCell sx={{ border: "1px solid #333", fontWeight: "bold", fontSize: "20px", textAlign: "center" }}>Academic Year</TableCell>
                          <TableCell sx={{ border: "1px solid #333", fontWeight: "bold", fontSize: "20px", textAlign: "center" }}>Branch</TableCell>
                          <TableCell sx={{ border: "1px solid #333", fontWeight: "bold", fontSize: "20px", textAlign: "center" }}>Semester</TableCell>
                          <TableCell sx={{ border: "1px solid #333", fontWeight: "bold", fontSize: "20px", textAlign: "center" }}>Percentage</TableCell>
                          <TableCell sx={{ border: "1px solid #333", fontWeight: "bold", fontSize: "20px", textAlign: "center" }}>Remarks</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(() => {
                          const totals = calcMarksTotals(internal);

                          const hasValid = totals.totalMax > 0;

                          const percentage = hasValid ? totals.pct : null;

                          const result = getResultStatus(percentage, hasValid);

                          return (
                            <TableRow className="pdf-block">
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                  textAlign: "center",
                                }}
                              >
                                {year || "-"}
                              </TableCell>

                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                  textAlign: "center",
                                }}
                              >
                                {course || "-"}
                              </TableCell>

                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                  textAlign: "center",
                                }}
                              >
                                {sem || "-"}
                              </TableCell>

                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                }}
                              >
                                {semesterExam?.[0]?.CGPA ?? "-"}
                              </TableCell>

                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                }}
                              >
                                {semesterExam?.[0]?.Remark ?? "-"}
                              </TableCell>
                            </TableRow>
                          );
                        })()}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </>
              )}
            </Box>
            {/* Internal Examination Results */}
            <Box sx={{ mb: 2 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                  textTransform: "uppercase",
                }}
              >
                Mid Term Examination Results
              </Typography>

              {!internal || internal.length === 0 ? (
                <Box
                  sx={{
                    border: "1px dashed #999",
                    padding: "20px",
                    textAlign: "center",
                    fontStyle: "italic",
                    color: "#333",
                  }}
                >
                  No internal examination data available for this semester.
                </Box>
              ) : (
                <>
                  <TableContainer
                    size="small"
                    sx={{
                      border: "1px solid #111",
                      "& .MuiTableCell-root": {
                        padding: "6px 10px",
                        fontSize: "20px",
                        lineHeight: 1.3,
                        fontFamily: "Inter, Roboto, Arial, sans-serif",
                        color: "#000000",
                        border: "1px solid #111",
                      },
                    }}
                  >
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: "#f0f0f0" }} className="pdf-block">
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              fontSize: "20px",
                              textAlign: "center",
                            }}
                          >
                            Subject Code
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              fontSize: "20px",
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
                              fontSize: "20px",
                            }}
                          >
                            Max Marks
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "20px",
                            }}
                          >
                            Marks Obtained
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "20px",
                            }}
                          >
                            Percentage
                          </TableCell>
                          <TableCell
                            sx={{
                              border: "1px solid #333",
                              fontWeight: "bold",
                              textAlign: "center",
                              fontSize: "20px",
                            }}
                          >
                            Grade
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {internal.map((row, idx) => {
                          const absent = isAbsent(row);
                          const max = Number.parseInt(row?.MaxMarks || 0, 10);
                          const got = absent
                            ? null
                            : Number.parseInt(row?.ObtainedMarks || 0, 10);
                          const pct =
                            !absent && max > 0 ? (got / max) * 100 : null;
                          const grade =
                            pct !== null ? calculateGrade(pct) : null;
                          return (
                            <TableRow key={idx} hover className="pdf-block">
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "20px",
                                }}
                              >
                                {subjectCodeMap[row?.Subject] ||
                                  row?.SubjectCode ||
                                  "-"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  fontSize: "20px",
                                }}
                              >
                                {row?.Subject || "-"}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "20px",
                                }}
                              >
                                {max}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontWeight: "bold",
                                  fontSize: "20px",
                                  color: absent ? "#f44336" : "inherit",
                                }}
                              >
                                {absent ? "AB" : got}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "20px",
                                }}
                              >
                                {absent ? "-" : formatPct(pct)}
                              </TableCell>
                              <TableCell
                                sx={{
                                  border: "1px solid #333",
                                  textAlign: "center",
                                  fontSize: "20px",
                                }}
                              >
                                {absent ? (
                                  "-"
                                ) : (
                                  <Box
                                    sx={{
                                      display: "inline-block",
                                      padding: "2px 8px",
                                      fontSize: "20px",
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
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summary Box */}
                  <Box
                    className="pdf-block"
                    sx={{
                      border: "1px solid #111",
                      mt: 2,
                      px: 2,
                      py: 1,
                      backgroundColor: "#f9f9f9",
                      fontFamily: "Inter, Roboto, Arial, sans-serif",
                    }}
                  >
                    <Grid container alignItems="center">
                      {(() => {
                        const totals = calcMarksTotals(internal);
                        const hasValid = totals.totalMax > 0;
                        return (
                          <>
                            <Grid item xs={4} sx={{ textAlign: "center" }}>
                              <Typography
                                sx={{
                                  fontFamily:
                                    "Inter, Roboto, Arial, sans-serif",
                                  fontWeight: "bold",
                                  color: "#000",
                                  fontSize: "20px",
                                }}
                              >
                                Total Marks:{" "}
                                {hasValid
                                  ? `${totals.totalObtained} / ${totals.totalMax}`
                                  : "-"}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography
                                sx={{
                                  fontFamily:
                                    "Inter, Roboto, Arial, sans-serif",
                                  fontWeight: "bold",
                                  color: "#000",
                                  fontSize: "20px",
                                }}
                              >
                                Overall Percentage:{" "}
                                {hasValid ? formatPct(totals.pct) : "-"}
                              </Typography>
                            </Grid>
                            <Grid item xs={4}>
                              <Typography
                                sx={{
                                  fontFamily:
                                    "Inter, Roboto, Arial, sans-serif",
                                  fontWeight: "bold",
                                  color: "#000",
                                  fontSize: "20px",
                                }}
                              >
                                Final Grade:{" "}
                                {hasValid ? calculateGrade(totals.pct) : "-"}
                              </Typography>
                            </Grid>
                          </>
                        );
                      })()}
                    </Grid>
                  </Box>
                </>
              )}
            </Box>

            {/* Class Tests Section */}
            <Box sx={{ mb: 4 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                }}
              >
                CLASS TEST PERFORMANCE (CT1-CT4)
              </Typography>
              {!ctAll || ctAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#111",
                    mt: 3,
                    fontFamily: "Inter, Roboto, Arial, sans-serif",
                  }}
                >
                  No class test data recorded.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  {ctAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null;

                    return (
                      <Box
                        key={section.category}
                        sx={{
                          width: "calc(50% - 8px)",
                          flexShrink: 0,
                          flexGrow: 0,
                          boxSizing: "border-box",
                        }}
                      >
                        <Box
                          className="pdf-block"
                          sx={{
                            background: "#fff",
                            borderRadius: "4px",
                            border: "1px solid #111",
                            overflow: "hidden",
                          }}
                        >
                          {/* Title */}
                          <Box
                            sx={{
                              background: "#f5f7fa",
                              px: 2,
                              py: 1,
                              borderBottom: "1px solid #111",
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: "#111",
                                fontFamily: "Inter, Roboto, Arial, sans-serif",
                                fontSize: "19px",
                              }}
                            >
                              {section.category}
                            </Typography>
                          </Box>
                          {/* Table */}
                          <TableContainer
                            size="small"
                            sx={{
                              border: "1px solid #111",
                              "& .MuiTableCell-root": {
                                padding: "6px 10px",
                                fontSize: "19px",
                                lineHeight: 1.3,
                                fontFamily: "Inter, Roboto, Arial, sans-serif",
                                color: "#000000",
                                border: "1px solid #111",
                              },
                            }}
                          >
                            <Table size="small" sx={{ width: "100%" }}>
                              <TableHead>
                                <TableRow
                                  className="pdf-block"
                                  sx={{
                                    background: "#fafafa",
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Subject
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Max
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Obt
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    %
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Grade
                                  </TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {section.rows.map((row, index) => {
                                  const absent = isAbsent(row);
                                  const pct = absent
                                    ? null
                                    : (row.ObtainedMarks / row.MaxMarks) * 100;
                                  const grade =
                                    pct !== null ? calculateGrade(pct) : null;

                                  return (
                                    <TableRow
                                      key={row.Id}
                                      className="pdf-block"
                                      sx={{
                                        backgroundColor:
                                          index % 2 === 0 ? "#fff" : "#fafafa",
                                      }}
                                    >
                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          fontSize: "19px",
                                        }}
                                      >
                                        {row.Subject}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "19px",
                                        }}
                                      >
                                        {row.MaxMarks}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "19px",
                                          color: absent ? "#f44336" : "inherit",
                                        }}
                                      >
                                        {absent ? "AB" : row.ObtainedMarks}
                                      </TableCell>

                                      <TableCell
                                        sx={{
                                          border: "1px solid #333",
                                          textAlign: "center",
                                          fontSize: "19px",
                                        }}
                                      >
                                        {absent ? "-" : `${pct.toFixed(1)}%`}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                          fontweight: "bold",
                                          fontSize: "19px",
                                          color: absent
                                            ? "#555"
                                            : grade === "A"
                                              ? "#2e7d32"
                                              : grade === "B"
                                                ? "#ed6c02"
                                                : "#d32f2f",
                                        }}
                                      >
                                        {absent ? "-" : grade}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>

            {/* vst section */}
            <Box sx={{ mb: 4 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                }}
              >
                VERY SIMILAR TESTS
              </Typography>

              {!vst || vst.length === 0 ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#111",
                    fontFamily: "Inter, Roboto, Arial, sans-serif",
                  }}
                >
                  No vst data recorded.
                </Typography>
              ) : (
                <TableContainer
                  size="small"
                  sx={{
                    border: "1px solid #111",
                    "& .MuiTableCell-root": {
                      padding: "6px 10px",
                      fontSize: "20px",
                      lineHeight: 1.3,
                      fontFamily: "Inter, Roboto, Arial, sans-serif",
                      color: "#000000",
                      border: "1px solid #111",
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }} className="pdf-block">
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Subject Code
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Subject Name
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Max Marks
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Marks Obtained
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Percentage
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Grade
                        </TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {vst.map((row, idx) => {
                        const absent = isAbsent(row);
                        const max = Number.parseInt(row?.MaxMarks || 0, 10);
                        const got = absent
                          ? null
                          : Number.parseInt(row?.ObtainedMarks || 0, 10);
                        const pct =
                          !absent && max > 0 ? (got / max) * 100 : null;
                        const grade = pct !== null ? calculateGrade(pct) : null;
                        return (
                          <TableRow key={idx} hover className="pdf-block">
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {subjectCodeMap[row?.Subject] ||
                                row?.SubjectCode ||
                                "-"}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {row?.Subject || "-"}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {max}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontWeight: "bold",
                                fontSize: "20px",
                                color: absent ? "#f44336" : "inherit",
                              }}
                            >
                              {absent ? "AB" : got}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {absent ? "-" : formatPct(pct)}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #333",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {absent ? (
                                "-"
                              ) : (
                                <Box
                                  sx={{
                                    display: "inline-block",
                                    padding: "2px 8px",
                                    fontSize: "20px",
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
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>

            {/* CBT Section  or pre Placement training*/}
            {/* 
            <Box sx={{ mb: 4 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                }}
              >
                CBT
              </Typography>

              {!cbtAll ||
                cbtAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#111",
                    fontFamily: "Inter, Roboto, Arial, sans-serif",
                  }}
                >
                  No CBT data recorded.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "16px",
                  }}
                >
                  {cbtAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null;
                    return (
                      <Box
                        key={section.category}
                        sx={{
                          width: "calc(50% - 8px)",
                          flexShrink: 0,
                          flexGrow: 0,
                          boxSizing: "border-box",
                        }}
                      >
                        <Box
                          className="pdf-block"
                          sx={{
                            background: "#fff",
                            borderRadius: "4px",
                            border: "1px solid #111",
                            overflow: "hidden",
                          }}
                        >
                          <Box
                            sx={{
                              background: "#f5f7fa",
                              px: 2,
                              py: 1,
                              borderBottom: "1px solid #111",
                            }}
                          >
                            <Typography
                              sx={{
                                fontWeight: 600,
                                color: "#111",
                                fontFamily: "Inter, Roboto, Arial, sans-serif",
                                fontSize: "19px",
                              }}
                            >
                              {section.category}
                            </Typography>
                          </Box>

                          <TableContainer
                            sx={{
                              border: "1px solid #111",
                              "& .MuiTableCell-root": {
                                padding: "6px 10px",
                                fontSize: "19px",
                                lineHeight: 1.3,
                                fontFamily: "Inter, Roboto, Arial, sans-serif",
                                color: "#000000",
                                border: "1px solid #111",
                              },
                            }}
                          >
                            <Table size="small" sx={{ width: "100%" }}>
                              <TableHead>
                                <TableRow
                                  className="pdf-block"
                                  sx={{
                                    background: "#fafafa",
                                  }}
                                >
                                  <TableCell
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Subject
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Max
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Obt
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    %
                                  </TableCell>
                                  <TableCell
                                    align="center"
                                    sx={{
                                      fontWeight: "bold",
                                      fontSize: "19px",
                                    }}
                                  >
                                    Grade
                                  </TableCell>
                                </TableRow>
                              </TableHead>

                              <TableBody>
                                {section.rows.map((row, index) => {
                                  const absent = isAbsent(row);
                                  const pct = absent
                                    ? null
                                    : (row.ObtainedMarks / row.MaxMarks) * 100;
                                  const grade =
                                    pct !== null ? calculateGrade(pct) : null;

                                  return (
                                    <TableRow
                                      key={row.Id}
                                      className="pdf-block"
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
                                          color: absent ? "#f44336" : "inherit",
                                        }}
                                      >
                                        {absent ? "AB" : row.ObtainedMarks}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                        }}
                                      >
                                        {absent ? "-" : `${pct.toFixed(1)}%`}
                                      </TableCell>

                                      <TableCell
                                        align="center"
                                        sx={{
                                          border: "1px solid #333",
                                          fontWeight: "bold",
                                          color: absent
                                            ? "#555"
                                            : grade === "A"
                                              ? "#2e7d32"
                                              : grade === "B"
                                                ? "#ed6c02"
                                                : "#d32f2f",
                                        }}
                                      >
                                        {absent ? "-" : grade}
                                      </TableCell>
                                    </TableRow>
                                  );
                                })}
                              </TableBody>
                            </Table>
                          </TableContainer>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              )}
            </Box>
            */}


            {/* pre placement training section */}
            <PrePlacementTraining
              studentId={studCode}
              course={course}
              semester={semester}
            />

            {/* Skills */}
            <SkillsGrade
              studentId={studCode}
              course={course}
              semester={semester}
            />

            {/* Assignment section */}
            <Box sx={{ mt: 4 }} className="pdf-block">
              <Typography
                variant="h6"
                sx={{
                  backgroundColor: "#2c3e50",
                  color: "white",
                  padding: "8px 16px",
                  display: "inline-block",
                  marginBottom: "15px",
                  fontFamily: '"Georgia", serif',
                  fontWeight: "bold",
                }}
              >
                ASSIGNMENT
              </Typography>
              {!assignment || assignment.length === 0 ? (
                <Typography
                  sx={{
                    fontStyle: "italic",
                    color: "#111",
                    fontFamily: "Inter, Roboto, Arial, sans-serif",
                  }}
                >
                  No Assignment recorded.
                </Typography>
              ) : (
                <TableContainer
                  sx={{
                    border: "1px solid #111",
                    "& .MuiTableCell-root": {
                      padding: "6px 10px",
                      fontSize: "20px",
                      lineHeight: 1.3,
                      fontFamily: "Inter, Roboto, Arial, sans-serif",
                      color: "#000000",
                      border: "1px solid #111",
                    },
                  }}
                >
                  <Table>
                    <TableHead>
                      <TableRow sx={{ backgroundColor: "#f0f0f0" }} className="pdf-block">
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Month
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          sem
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          No Of Class
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
                          }}
                        >
                          Present Class
                        </TableCell>
                        <TableCell
                          sx={{
                            fontWeight: "bold",
                            textAlign: "center",
                            fontSize: "20px",
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
                          <TableRow key={assignment.Id} className="pdf-block">
                            <TableCell
                              sx={{
                                border: "1px solid #111",
                                fontWeight: "bold",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {assignment.Month}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #111",
                                fontWeight: "bold",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {assignment.Semester}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #111",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {assignment.NoOfClasses}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #111",
                                textAlign: "center",
                                fontSize: "20px",
                              }}
                            >
                              {assignment.PresentClass}
                            </TableCell>
                            <TableCell
                              sx={{
                                border: "1px solid #111",
                                textAlign: "center",
                                fontSize: "20px",
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

            {/* <PTMAttendancePDF
              studentId={studCode || studentId}
              semester={semester}
            /> */}

            {/* Footer */}
            <Box
              className="pdf-block"
              sx={{
                mt: 2,
                pt: 1,
                borderTop: "2px solid #111",
                textAlign: "center",
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  fontFamily: "Inter, Roboto, Arial, sans-serif",
                  color: "#000000",
                  fontSize: "17px",
                  fontWeight: "bold",
                }}
              >
                This is a computer generated document. No signature is required.
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  fontFamily: "Inter, Roboto, Arial, sans-serif",
                  color: "#111111",
                  fontSize: "17px",
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
