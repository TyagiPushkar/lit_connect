"use client"

import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
import {
  Box,
  Button,
  Divider,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material"
import AttendanceSummary from "./AttendanceSummary"

const fetchJSON = async (url) => {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) throw new Error("Failed to fetch: " + url)
  return res.json()
}

const fetchStudent = async (url) => {
  const json = await fetchJSON(url)
  return json?.success && json?.data ? json.data : null
}

const fetchReportArray = async (url) => {
  const json = await fetchJSON(url)
  return json?.success && json?.data ? json.data : []
}

// Grade calculation function
const calculateGrade = (percentage) => {
  if (percentage >= 80) return "A"
  if (percentage >= 60) return "B"
  if (percentage >= 45) return "C"
  return "D"
}

export default function ReportCardPDF({ studentId }) {
  const [isGenerating, setIsGenerating] = useState(false)
  const reportRef = useRef(null)

  const {
    data: student,
    error: studentError,
    isLoading: studentLoading,
  } = useSWR(
    studentId ? `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}` : null,
    fetchStudent,
  )

  const course = student?.Course
  const semester = useMemo(() => {
    if (!student?.Sem) return undefined
    return String(student.Sem)
  }, [student])

  const studCode = student?.StudentID

  const { data: assignment, isLoading: assignmentLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/assignment_report.php?StudId=${encodeURIComponent(
          studCode,
        )}&Course=${encodeURIComponent(course)}&Semester=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  )

  const { data: internal, isLoading: internalLoading } = useSWR(
    studCode && course && semester
      ? `https://namami-infotech.com/LIT/src/report/internal_exam_report.php?StudId=${encodeURIComponent(
          studCode,
        )}&Course=${encodeURIComponent(course)}&Sem=${encodeURIComponent(semester)}`
      : null,
    fetchReportArray,
  )

  const ctKeys = useMemo(() => ["CT1", "CT2", "CT3", "CT4", "CT5", "CT6"], [])
  const cbtKeys = useMemo(() => ["1", "2", "3", "4", "5", "6"], [])

  const { data: ctAll, isLoading: ctLoading } = useSWR(
    studCode && course && semester ? ["ct-all", studCode, course, semester] : null,
    async ([, id, crs, sem]) => {
      const urls = ctKeys.map(
        (cat) =>
          `https://namami-infotech.com/LIT/src/report/class_test_report.php?StudId=${encodeURIComponent(
            id,
          )}&Course=${encodeURIComponent(crs)}&Sem=${encodeURIComponent(sem)}&Category=${encodeURIComponent(cat)}`,
      )
      const results = await Promise.all(urls.map(fetchReportArray))
      return ctKeys.map((cat, i) => ({ category: cat, rows: results[i] || [] }))
    },
  )

  const { data: cbtAll, isLoading: cbtLoading } = useSWR(
    studCode && course && semester ? ["cbt-all", studCode, course, semester] : null,
    async ([, id, crs, sem]) => {
      const urls = cbtKeys.map(
        (cat) =>
          `https://namami-infotech.com/LIT/src/report/cbt_report.php?StudId=${encodeURIComponent(
            id,
          )}&Course=${encodeURIComponent(crs)}&Sem=${encodeURIComponent(sem)}&Category=${encodeURIComponent(cat)}`,
      )
      const results = await Promise.all(urls.map(fetchReportArray))
      return cbtKeys.map((cat, i) => ({ category: cat, rows: results[i] || [] }))
    },
  )

  const calcMarksTotals = (rows) => {
    let totalMax = 0
    let totalObtained = 0
    rows?.forEach((r) => {
      totalMax += Number.parseInt(r?.MaxMarks || 0, 10)
      totalObtained += Number.parseInt(r?.ObtainedMarks || 0, 10)
    })
    const pct = totalMax > 0 ? (totalObtained / totalMax) * 100 : 0
    return { totalMax, totalObtained, pct }
  }

  const calcAttendanceTotals = (rows) => {
    let totalClasses = 0
    let totalPresent = 0
    rows?.forEach((r) => {
      totalClasses += Number.parseInt(r?.NoOfClasses || 0, 10)
      totalPresent += Number.parseInt(r?.PresentClass || 0, 10)
    })
    const pct = totalClasses > 0 ? (totalPresent / totalClasses) * 100 : 0
    return { totalClasses, totalPresent, pct }
  }

  const formatPct = (n) => `${(n || 0).toFixed(1)}%`

  const attendanceSummary = useMemo(() => {
    if (!assignment || assignment.length === 0) return []
    return assignment.map((r) => {
      const classes = Number.parseInt(r?.NoOfClasses || 0, 10)
      const present = Number.parseInt(r?.PresentClass || 0, 10)
      const pct = classes > 0 ? (present / classes) * 100 : 0
      return {
        month: r?.Month || "",
        totalClasses: classes,
        present,
        absent: Math.max(0, classes - present),
        pct,
      }
    })
  }, [assignment])

  const generatedOn = useMemo(() => {
    const d = new Date()
    const day = d.getDate()
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const guardian = student?.GuardianName || student?.Guardian || student?.FatherName || student?.ParentName || "-"

  const contact = student?.Contact || student?.GuardianContactNo || student?.Phone || student?.GuardianMobile || "-"

  const onDownloadPDF = async () => {
    if (!reportRef.current) return
    setIsGenerating(true)
    try {
      // Increase scale for better resolution and larger text
      const canvas = await html2canvas(reportRef.current, {
        scale: 3, // Increased from 2 to 3 for larger text
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const imgs = clonedDoc.getElementsByTagName("img")
          Array.from(imgs).forEach((img) => {
            img.setAttribute("crossorigin", "anonymous")
          })
          
          // Apply PDF-specific styles for larger text
          const reportElement = clonedDoc.getElementById('reportCard')
          if (reportElement) {
            reportElement.style.fontSize = '14px'; // Base font size increase
          }
        },
      })
      const imgData = canvas.toDataURL("image/png")

      const pdf = new jsPDF("p", "mm", "a4")
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()

      const imgWidth = pageWidth
      const imgHeight = (canvas.height * pageWidth) / canvas.width

      let heightLeft = imgHeight
      let position = 0

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
      heightLeft -= pageHeight

      while (heightLeft > 0) {
        position = -imgHeight + heightLeft
        pdf.addPage()
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight)
        heightLeft -= pageHeight
      }

      const fileName = `ReportCard_${studCode || studentId}_Sem${semester || ""}.pdf`
      pdf.save(fileName)
    } catch (e) {
      console.error("[v0] PDF generation error:", e)
      alert("Failed to generate PDF. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const loading = studentLoading || assignmentLoading || internalLoading || ctLoading || cbtLoading
  const hasError = !!studentError

  return (
    <Box display="flex" flexDirection="column" gap={2}>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography variant="h5" fontWeight={600}>
            Student Report Card
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Download as PDF for records and sharing
          </Typography>
        </Box>
        <Button
          onClick={onDownloadPDF}
          disabled={loading || hasError || isGenerating}
          variant="contained"
          aria-label="Download Report Card as PDF"
        >
          {isGenerating ? "Generating..." : "Download PDF"}
        </Button>
      </Box>

      {hasError && (
        <Paper variant="outlined" sx={{ p: 2, borderColor: "error.light", bgcolor: "error.lighter" }}>
          <Typography variant="body2" color="error.main">
            Failed to load student data.
          </Typography>
        </Paper>
      )}

      {loading && (
        <Paper variant="outlined" sx={{ p: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Loading data...
          </Typography>
        </Paper>
      )}

      {/* Report Content */}
      {!loading && !hasError && (
        <Paper
          ref={reportRef}
          id="reportCard"
          elevation={0}
          variant="outlined"
          sx={{ 
            p: 3,
            // Increased font sizes for PDF
            fontSize: { xs: '14px', sm: '16px' },
            '& .MuiTypography-body2': {
              fontSize: { xs: '14px', sm: '16px' },
            },
            '& .MuiTypography-body1': {
              fontSize: { xs: '15px', sm: '17px' },
            },
            '& .MuiTypography-subtitle1': {
              fontSize: { xs: '16px', sm: '18px' },
            },
            '& .MuiTypography-h6': {
              fontSize: { xs: '18px', sm: '20px' },
            },
            '& .MuiTableCell-root': {
              fontSize: { xs: '14px', sm: '16px' },
              py: 1.5, // Increased padding for better readability
            },
          }}
          aria-label="Report Card Content"
        >
          {/* Header / Identity */}
          <Box display="flex" alignItems="flex-start" justifyContent="space-between" gap={2}>
            <Box>
              <Typography variant="h6" fontWeight={700} sx={{ fontSize: { xs: '18px', sm: '22px' } }}>
                LAKSHYA INSTITUTE OF TECHNOLOGY
              </Typography>
              <Typography variant="subtitle1" sx={{ mt: 0.5 }} fontWeight={600}>
                STUDENT REPORT CARD
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Generated on:{" "}
                <Typography component="span" fontWeight={600}>
                  {generatedOn}
                </Typography>
              </Typography>
            </Box>
            <Box
              component="img"
              src={"https://lit-connect.vercel.app/static/media/images%20(1).0a5419d3ae0870e1e361.png"}
              alt="Institute logo"
              sx={{ width: 80, height: 80, borderRadius: 1, objectFit: "contain" }} // Increased logo size
              crossOrigin="anonymous"
            />
          </Box>

          {/* Student Information */}
          <Box mt={3}>
            <Typography variant="subtitle1" fontWeight={600}>
              STUDENT INFORMATION
            </Typography>
            <Box mt={1}>
              <Typography variant="body2">
                Name:{" "}
                <Typography component="span" fontWeight={600}>
                  {student?.CandidateName || "N/A"}
                </Typography>
              </Typography>
              <Typography variant="body2">
                Student ID:{" "}
                <Typography component="span" fontWeight={600}>
                  {studCode || studentId || "N/A"}
                </Typography>
              </Typography>
              <Typography variant="body2">
                Course:{" "}
                <Typography component="span" fontWeight={600}>
                  {course || "N/A"}
                </Typography>
              </Typography>
              <Typography variant="body2">
                Semester:{" "}
                <Typography component="span" fontWeight={600}>
                  {semester || "N/A"}
                </Typography>
              </Typography>
              <Typography variant="body2">
                Guardian:{" "}
                <Typography component="span" fontWeight={600}>
                  {guardian}
                </Typography>
              </Typography>
              <Typography variant="body2">
                Contact:{" "}
                <Typography component="span" fontWeight={600}>
                  {contact}
                </Typography>
              </Typography>
            </Box>
          </Box>

          <AttendanceSummary EmpId={studentId} />

          {/* Academic Performance Summary */}
          <Box mt={4}>
            <Typography variant="subtitle1" fontWeight={600}>
              ACADEMIC PERFORMANCE SUMMARY
            </Typography>
            <Box mt={1}>
              {(() => {
                const { totalMax, totalObtained, pct } = calcMarksTotals(internal || [])
                return (
                  <Typography variant="body2">
                    Internal Exams:{" "}
                    <Typography component="span" fontWeight={600}>
                      {totalObtained}
                    </Typography>
                    /
                    <Typography component="span" fontWeight={600}>
                      {totalMax}
                    </Typography>{" "}
                    (
                    <Typography component="span" fontWeight={600}>
                      {formatPct(pct)}
                    </Typography>
                    )
                  </Typography>
                )
              })()}
            </Box>
          </Box>

          {/* Internal Exam */}
          <Box mt={4}>
            <Typography variant="subtitle1" fontWeight={600}>
              INTERNAL EXAM DETAILS
            </Typography>
            {!internal || internal.length === 0 ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No internal exam data available.
              </Typography>
            ) : (
              <>
                <Paper variant="outlined" sx={{ mt: 1, overflowX: "auto" }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell sx={{ fontSize: '15px', fontWeight: 600 }}>Subject</TableCell>
                        <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Marks</TableCell>
                        <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Percentage</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {internal.map((row, idx) => {
                        const max = Number.parseInt(row?.MaxMarks || 0, 10)
                        const got = Number.parseInt(row?.ObtainedMarks || 0, 10)
                        const pct = max > 0 ? (got / max) * 100 : 0
                        return (
                          <TableRow key={idx}>
                            <TableCell sx={{ fontSize: '14px' }}>{row?.Subject || "-"}</TableCell>
                            <TableCell align="center" sx={{ fontSize: '14px' }}>
                              {got} / {max}
                            </TableCell>
                            <TableCell align="center" sx={{ fontSize: '14px' }}>{formatPct(pct)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </Paper>
                <Box mt={1} display="flex" justifyContent="flex-end">
                  {(() => {
                    const { totalMax, totalObtained, pct } = calcMarksTotals(internal || [])
                    return (
                      <Typography variant="body2" color="text.secondary">
                        Total:{" "}
                        <Typography component="span" fontWeight={600}>
                          {totalObtained}
                        </Typography>{" "}
                        /{" "}
                        <Typography component="span" fontWeight={600}>
                          {totalMax}
                        </Typography>{" "}
                        (
                        <Typography component="span" fontWeight={600}>
                          {formatPct(pct)}
                        </Typography>
                        )
                      </Typography>
                    )
                  })()}
                </Box>
              </>
            )}
          </Box>

          {/* Class Test (CT1..CT6) */}
          <Box mt={4}>
            <Typography variant="subtitle1" fontWeight={600}>
              Class Tests (CT)
            </Typography>
            {!ctAll || ctAll.every((s) => !s.rows || s.rows.length === 0) ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No class test data available.
              </Typography>
            ) : (
              <Box mt={1} display="flex" flexDirection="column" gap={2}>
                {ctAll.map((section) => {
                  if (!section.rows || section.rows.length === 0) return null
                  const totals = calcMarksTotals(section.rows)
                  return (
                    <Paper key={section.category} variant="outlined">
                      <Box borderBottom="1px solid" borderColor="divider" px={2} py={1.25}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '16px' }}>
                          {section.category}
                        </Typography>
                      </Box>
                      <Box overflow="auto">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '15px', fontWeight: 600 }}>Subject</TableCell>
                              <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Marks</TableCell>
                              <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Percentage</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {section.rows.map((row, idx) => {
                              const max = Number.parseInt(row?.MaxMarks || 0, 10)
                              const got = Number.parseInt(row?.ObtainedMarks || 0, 10)
                              const pct = max > 0 ? (got / max) * 100 : 0
                              return (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontSize: '14px' }}>{row?.Subject || "-"}</TableCell>
                                  <TableCell align="center" sx={{ fontSize: '14px' }}>
                                    {got} / {max}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: '14px' }}>{formatPct(pct)}</TableCell>
                                </TableRow>
                              )
                            })}
                            <TableRow selected>
                              <TableCell sx={{ fontWeight: 600, fontSize: '15px' }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {totals.totalObtained} / {totals.totalMax}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {formatPct(totals.pct)}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            )}
          </Box>

          {/* CBT (1..6) */}
          <Box mt={4}>
            <Typography variant="subtitle1" fontWeight={600}>
              CBT
            </Typography>
            {!cbtAll || cbtAll.every((s) => !s.rows || s.rows.length === 0) ? (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                No CBT data available.
              </Typography>
            ) : (
              <Box mt={1} display="flex" flexDirection="column" gap={2}>
                {cbtAll.map((section) => {
                  if (!section.rows || section.rows.length === 0) return null
                  const totals = calcMarksTotals(section.rows)
                  const totalGrade = calculateGrade(totals.pct)
                  return (
                    <Paper key={section.category} variant="outlined">
                      <Box borderBottom="1px solid" borderColor="divider" px={2} py={1.25}>
                        <Typography variant="body2" fontWeight={600} sx={{ fontSize: '16px' }}>
                          CBT {section.category}
                        </Typography>
                      </Box>
                      <Box overflow="auto">
                        <Table size="small">
                          <TableHead>
                            <TableRow>
                              <TableCell sx={{ fontSize: '15px', fontWeight: 600 }}>Subject</TableCell>
                              <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Marks</TableCell>
                              <TableCell align="center" sx={{ fontSize: '15px', fontWeight: 600 }}>Grade</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {section.rows.map((row, idx) => {
                              const max = Number.parseInt(row?.MaxMarks || 0, 10)
                              const got = Number.parseInt(row?.ObtainedMarks || 0, 10)
                              const pct = max > 0 ? (got / max) * 100 : 0
                              const grade = calculateGrade(pct)
                              return (
                                <TableRow key={idx}>
                                  <TableCell sx={{ fontSize: '14px' }}>{row?.Subject || "-"}</TableCell>
                                  <TableCell align="center" sx={{ fontSize: '14px' }}>
                                    {got} / {max}
                                  </TableCell>
                                  <TableCell align="center" sx={{ fontSize: '14px', fontWeight: 600 }}>
                                    {grade}
                                  </TableCell>
                                </TableRow>
                              )
                            })}
                            <TableRow selected>
                              <TableCell sx={{ fontWeight: 600, fontSize: '15px' }}>Total</TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {totals.totalObtained} / {totals.totalMax}
                              </TableCell>
                              <TableCell align="center" sx={{ fontWeight: 600, fontSize: '15px' }}>
                                {totalGrade}
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </Box>
                    </Paper>
                  )
                })}
              </Box>
            )}
          </Box>

          {/* Grade Legend */}
          <Box mt={3} p={2} sx={{ backgroundColor: 'grey.50', borderRadius: 1 }}>
            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
              Grade Legend:
            </Typography>
            <Box display="flex" gap={3} flexWrap="wrap">
              <Typography variant="body2">
                <strong>A:</strong> 80-100%
              </Typography>
              <Typography variant="body2">
                <strong>B:</strong> 60-79%
              </Typography>
              <Typography variant="body2">
                <strong>C:</strong> 45-59%
              </Typography>
              <Typography variant="body2">
                <strong>D:</strong> Below 45%
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          {/* Footer note */}
          <Box textAlign="center">
            <Typography variant="body2" color="text.secondary" fontWeight={600} sx={{ fontSize: '16px' }}>
              Official Report Card - Lakshya Institute Of Technology
            </Typography>
          </Box>
        </Paper>
      )}
    </Box>
  )
}