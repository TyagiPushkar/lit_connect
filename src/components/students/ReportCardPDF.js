"use client"

import { useMemo, useRef, useState } from "react"
import useSWR from "swr"
import html2canvas from "html2canvas"
import jsPDF from "jspdf"
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
} from "@mui/material"
import DownloadIcon from '@mui/icons-material/Download'
import PrintIcon from '@mui/icons-material/Print'
import SchoolIcon from '@mui/icons-material/School'
import PersonIcon from '@mui/icons-material/Person'
import GradeIcon from '@mui/icons-material/Grade'
import DateRangeIcon from '@mui/icons-material/DateRange'
import AssessmentIcon from '@mui/icons-material/Assessment'
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

const calculateGrade = (percentage) => {
  if (percentage >= 80) return "A"
  if (percentage >= 60) return "B"
  if (percentage >= 45) return "C"
  return "D"
}

const calculateGPA = (percentage) => {
  if (percentage >= 80) return "4.0"
  if (percentage >= 60) return "3.0"
  if (percentage >= 45) return "2.0"
  return "1.0"
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

  const formatPct = (n) => `${(n || 0).toFixed(1)}%`

  const generatedOn = useMemo(() => {
    const d = new Date()
    const day = d.getDate()
    const month = d.getMonth() + 1
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  }, [])

  const onDownloadPDF = async () => {
    if (!reportRef.current) return
    setIsGenerating(true)
    try {
      const canvas = await html2canvas(reportRef.current, {
        scale: 3,
        useCORS: true,
        logging: false,
        backgroundColor: "#ffffff",
        onclone: (clonedDoc) => {
          const imgs = clonedDoc.getElementsByTagName("img")
          Array.from(imgs).forEach((img) => {
            img.setAttribute("crossorigin", "anonymous")
          })
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
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
        <Button
          onClick={onDownloadPDF}
          disabled={loading || hasError || isGenerating}
          variant="contained"
          startIcon={<DownloadIcon />}
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': {
              backgroundColor: '#1565c0'
            }
          }}
        >
          {isGenerating ? "Generating PDF..." : "Download Report Card"}
        </Button>
      </Box>

      {hasError && (
        <Paper sx={{ p: 3, border: '1px solid #d32f2f' }}>
          <Typography color="error" align="center">
            Failed to load student data. Please check the student ID.
          </Typography>
        </Paper>
      )}

      {loading && (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Loading student report data...</Typography>
        </Paper>
      )}

      {!loading && !hasError && (
        <Paper
          ref={reportRef}
          id="reportCard"
          elevation={0}
          sx={{ 
            p: 0,
            fontFamily: '"Courier New", Courier, monospace',
            background: 'linear-gradient(to bottom, #ffffff 0%, #f9f9f9 100%)',
            border: '2px solid #333',
            position: 'relative',
            overflow: 'visible',
            minHeight: '29.7cm',
            boxSizing: 'border-box'
          }}
        >
          {/* Watermark Background */}
          <Box sx={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            opacity: 0.03,
            backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ctext x=\'50%25\' y=\'50%25\' font-family=\'Courier New\' font-size=\'14\' text-anchor=\'middle\' dominant-baseline=\'middle\'%3ELIT%3C/text%3E%3C/svg%3E")',
            pointerEvents: 'none',
            zIndex: 0
          }} />

          {/* Official Letterhead Header */}
          <Box sx={{ 
            backgroundColor: '#f5f5f5',
            borderBottom: '3px double #333',
            p: 3,
            position: 'relative',
            zIndex: 1
          }}>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              mb: 2 
            }}>
              <Box sx={{ textAlign: 'left' }}>
                <Box
                  component="img"
                  src={"https://lit-connect.vercel.app/static/media/images%20(1).0a5419d3ae0870e1e361.png"}
                  alt="Institute Seal"
                  sx={{ 
                    width: 90, 
                    height: 90,
                    objectFit: 'contain',
                    filter: 'grayscale(100%)',
                    border: '1px solid #999',
                    borderRadius: '50%',
                    padding: '4px'
                  }}
                  crossOrigin="anonymous"
                />
              </Box>
              
              <Box sx={{ 
                textAlign: 'center',
                flex: 1,
                px: 4
              }}>
                <Typography variant="h5" sx={{ 
                  fontWeight: 'bold',
                  letterSpacing: '1px',
                  color: '#2c3e50',
                  textTransform: 'uppercase',
                  fontFamily: '"Georgia", serif'
                }}>
                  Lakshya Institute of Technology
                </Typography>
                <Typography variant="subtitle2" sx={{ 
                  color: '#7f8c8d',
                  fontStyle: 'italic',
                  mt: 0.5
                }}>
                  (Approved by AICTE, New Delhi & Affiliated to BPUT, Rourkela)
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#666',
                  mt: 1,
                  fontFamily: '"Courier New", monospace'
                }}>
                  Plot No. 239, Badagada, Bhubaneswar, Odisha - 751030
                </Typography>
                <Typography variant="body2" sx={{ 
                  color: '#666',
                  fontFamily: '"Courier New", monospace'
                }}>
                  Phone: 0674-2541234 | Email: info@lit.edu.in
                </Typography>
              </Box>
              
              <Box sx={{ textAlign: 'right' }}>
                <Box sx={{
                  border: '2px solid #333',
                  padding: '8px',
                  display: 'inline-block',
                  textAlign: 'center',
                  minWidth: '100px'
                }}>
                  
                  <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
                    Date: {generatedOn}
                  </Typography>
                </Box>
              </Box>
            </Box>
            
            {/* Decorative Line */}
            <Box sx={{
              height: '2px',
              background: 'linear-gradient(to right, transparent, #333, transparent)',
              margin: '10px 0'
            }} />
            
            <Typography variant="h4" align="center" sx={{
              fontWeight: 'bold',
              textTransform: 'uppercase',
              letterSpacing: '3px',
              color: '#2c3e50',
              textDecoration: 'underline',
              mt: 2,
              fontFamily: '"Times New Roman", serif'
            }}>
              Report Card
            </Typography>
            <Typography variant="h6" align="center" sx={{
              color: '#7f8c8d',
              fontStyle: 'italic',
              mt: 1,
              fontFamily: '"Courier New", monospace'
            }}>
              Academic Session: {student?.Session || "2024-2025"}
            </Typography>
          </Box>

          {/* Main Content */}
          <Box sx={{ p: 4, position: 'relative', zIndex: 1 }}>
            {/* Student Information Box */}
            <Box sx={{
              border: '2px solid #333',
              padding: '20px',
              marginBottom: '30px',
              backgroundColor: '#fafafa',
              position: 'relative'
            }}>
              {/* Corner Decorations */}
              <Box sx={{
                position: 'absolute',
                top: '-10px',
                left: '20px',
                backgroundColor: '#f5f5f5',
                padding: '0 10px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold',
                fontSize: '14px'
              }}>
                STUDENT PARTICULARS
              </Box>
              
              <Grid container spacing={3}>
                <Grid item xs={6}>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Name:</span>
                    {student?.CandidateName || "N/A"}
                  </Typography>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Father's Name:</span>
                    {student?.FatherName || student?.GuardianName || "-"}
                  </Typography>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Course:</span>
                    {course || "N/A"}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Roll No:</span>
                    {studCode || studentId || "N/A"}
                  </Typography>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Semester:</span>
                    {semester || "N/A"}
                  </Typography>
                  <Typography sx={{ mb: 1, fontFamily: '"Courier New", monospace' }}>
                    <span style={{ fontWeight: 'bold', marginRight: '10px' }}>Contact:</span>
                    {student?.Contact || student?.GuardianContactNo || "-"}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
<Box mb={4}>
  <AttendanceSummary EmpId={studentId} />
</Box>
            {/* Internal Examination Results */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{
                backgroundColor: '#333',
                color: 'white',
                padding: '8px 16px',
                display: 'inline-block',
                marginBottom: '15px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                Internal Examination Results
              </Typography>
              
              {!internal || internal.length === 0 ? (
                <Box sx={{
                  border: '1px dashed #999',
                  padding: '20px',
                  textAlign: 'center',
                  fontStyle: 'italic',
                  color: '#666'
                }}>
                  No internal examination data available for this semester.
                </Box>
              ) : (
                <>
                  <TableContainer sx={{
                    border: '1px solid #333',
                    fontFamily: '"Courier New", monospace'
                  }}>
                    <Table>
                      <TableHead>
                        <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Subject Code
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Subject Name
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Max Marks
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Marks Obtained
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Percentage
                          </TableCell>
                          <TableCell sx={{ border: '1px solid #333', fontWeight: 'bold', textAlign: 'center' }}>
                            Grade
                          </TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {internal.map((row, idx) => {
                          const max = Number.parseInt(row?.MaxMarks || 0, 10)
                          const got = Number.parseInt(row?.ObtainedMarks || 0, 10)
                          const pct = max > 0 ? (got / max) * 100 : 0
                          const grade = calculateGrade(pct)
                          return (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ border: '1px solid #333', textAlign: 'center' }}>
                                {row?.SubjectCode || "-"}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #333' }}>
                                {row?.Subject || "-"}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #333', textAlign: 'center' }}>
                                {max}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #333', textAlign: 'center', fontWeight: 'bold' }}>
                                {got}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #333', textAlign: 'center' }}>
                                {formatPct(pct)}
                              </TableCell>
                              <TableCell sx={{ border: '1px solid #333', textAlign: 'center' }}>
                                <Box sx={{
                                  display: 'inline-block',
                                  padding: '2px 8px',
                                  backgroundColor: 
                                    grade === 'A' ? '#e8f5e8' :
                                    grade === 'B' ? '#e3f2fd' :
                                    grade === 'C' ? '#fff8e1' : '#ffebee',
                                  border: '1px solid',
                                  borderColor: 
                                    grade === 'A' ? '#4caf50' :
                                    grade === 'B' ? '#2196f3' :
                                    grade === 'C' ? '#ff9800' : '#f44336',
                                  borderRadius: '2px',
                                  fontWeight: 'bold'
                                }}>
                                  {grade}
                                </Box>
                              </TableCell>
                            </TableRow>
                          )
                        })}
                      </TableBody>
                    </Table>
                  </TableContainer>

                  {/* Summary Box */}
                  <Box sx={{
                    border: '2px solid #333',
                    marginTop: '20px',
                    padding: '15px',
                    backgroundColor: '#f9f9f9'
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Typography sx={{ fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>
                          Total Marks:
                        </Typography>
                        <Typography variant="h6" sx={{ fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>
                          {calcMarksTotals(internal).totalObtained} / {calcMarksTotals(internal).totalMax}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography sx={{ fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>
                          Overall Percentage:
                        </Typography>
                        <Typography variant="h6" sx={{ 
                          fontFamily: '"Courier New", monospace', 
                          fontWeight: 'bold',
                          color: '#1976d2'
                        }}>
                          {formatPct(calcMarksTotals(internal).pct)}
                        </Typography>
                      </Grid>
                      <Grid item xs={4}>
                        <Typography sx={{ fontFamily: '"Courier New", monospace', fontWeight: 'bold' }}>
                          Final Grade:
                        </Typography>
                        <Box sx={{
                          display: 'inline-block',
                          padding: '4px 16px',
                          backgroundColor: '#333',
                          color: 'white',
                          fontWeight: 'bold',
                          fontSize: '18px',
                          borderRadius: '2px'
                        }}>
                          {calculateGrade(calcMarksTotals(internal).pct)}
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </>
              )}
            </Box>

            {/* Class Tests Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{
                backgroundColor: '#555',
                color: 'white',
                padding: '8px 16px',
                display: 'inline-block',
                marginBottom: '15px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold'
              }}>
                Class Test Performance (CT1-CT6)
              </Typography>
              
              {!ctAll || ctAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography sx={{ fontStyle: 'italic', color: '#666', fontFamily: '"Courier New", monospace' }}>
                  No class test data recorded.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {ctAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null
                    const totals = calcMarksTotals(section.rows)
                    const grade = calculateGrade(totals.pct)
                    return (
                      <Grid item xs={6} md={4} key={section.category}>
                        <Box sx={{
                          border: '1px solid #999',
                          padding: '12px',
                          backgroundColor: '#fff',
                          fontFamily: '"Courier New", monospace'
                        }}>
                          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                            {section.category}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">
                            Marks: {totals.totalObtained}/{totals.totalMax}
                          </Typography>
                          <Typography variant="body2">
                            Percentage: {formatPct(totals.pct)}
                          </Typography>
                          <Typography variant="body2" sx={{ mt: 1 }}>
                            Grade: <span style={{ fontWeight: 'bold' }}>{grade}</span>
                          </Typography>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </Box>

            {/* CBT Section */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" sx={{
                backgroundColor: '#555',
                color: 'white',
                padding: '8px 16px',
                display: 'inline-block',
                marginBottom: '15px',
                fontFamily: '"Courier New", monospace',
                fontWeight: 'bold'
              }}>
                Computer Based Tests
              </Typography>
              
              {!cbtAll || cbtAll.every((s) => !s.rows || s.rows.length === 0) ? (
                <Typography sx={{ fontStyle: 'italic', color: '#666', fontFamily: '"Courier New", monospace' }}>
                  No CBT data recorded.
                </Typography>
              ) : (
                <Grid container spacing={2}>
                  {cbtAll.map((section) => {
                    if (!section.rows || section.rows.length === 0) return null
                    const totals = calcMarksTotals(section.rows)
                    const grade = calculateGrade(totals.pct)
                    return (
                      <Grid item xs={6} md={4} key={section.category}>
                        <Box sx={{
                          border: '1px solid #999',
                          padding: '12px',
                          backgroundColor: '#fff',
                          fontFamily: '"Courier New", monospace'
                        }}>
                          <Typography sx={{ fontWeight: 'bold', mb: 1 }}>
                            CBT Test {section.category}
                          </Typography>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="body2">
                            Score: {totals.totalObtained}/{totals.totalMax}
                          </Typography>
                          <Typography variant="body2">
                            Percentage: {formatPct(totals.pct)}
                          </Typography>
                          <Box sx={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            backgroundColor: '#e8f5e8',
                            border: '1px solid #4caf50',
                            borderRadius: '2px',
                            mt: 1
                          }}>
                            Grade: {grade}
                          </Box>
                        </Box>
                      </Grid>
                    )
                  })}
                </Grid>
              )}
            </Box>

            

            {/* Footer */}
            <Box sx={{ 
              mt: 4, 
              pt: 2, 
              borderTop: '2px solid #333',
              textAlign: 'center'
            }}>
              <Typography variant="caption" sx={{ 
                fontFamily: '"Courier New", monospace',
                color: '#666'
              }}>
                This is a computer generated document. No signature is required.
              </Typography>
              <Typography variant="caption" sx={{ 
                display: 'block',
                fontFamily: '"Courier New", monospace',
                color: '#999',
                mt: 1
              }}>
                Report ID: {studCode || studentId}-{semester || "NA"}-{generatedOn.replace(/\//g, '')}
              </Typography>
            </Box>
          </Box>
        </Paper>
      )}
    </Box>
  )
}