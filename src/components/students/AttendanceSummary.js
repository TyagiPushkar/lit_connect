import React from "react"
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Grid
} from "@mui/material"
import { useState, useEffect } from "react"
import axios from "axios"
import { format, eachDayOfInterval, startOfMonth, endOfMonth, isSunday, parseISO } from "date-fns"

const AttendanceSummary = ({ EmpId, tenentId = "1" }) => {
  const [summaryData, setSummaryData] = useState([])
  const [holidays, setHolidays] = useState([])
  const [loading, setLoading] = useState(false)
  const [holidayLoading, setHolidayLoading] = useState(false)
  const [error, setError] = useState(null)
  const [holidayError, setHolidayError] = useState(null)

  // Fetch holidays from API
  const fetchHolidays = async () => {
    setHolidayLoading(true)
    setHolidayError(null)
    
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/holiday/view_holiday.php?Tenent_Id=${tenentId}`,
        { timeout: 10000 }
      )
      
      if (response.data.success && response.data.data) {
        setHolidays(response.data.data)
      } else {
        setHolidays([])
        setHolidayError("No holiday data found")
      }
    } catch (error) {
      console.error("Error fetching holidays:", error)
      setHolidayError("Failed to load holiday data")
      setHolidays([])
    } finally {
      setHolidayLoading(false)
    }
  }

  // Get all months from July to current month
  const getAllMonthsFromJuly = () => {
    const months = []
    const currentDate = new Date()
    const currentYear = currentDate.getFullYear()
    
    // Start from July of current year
    let startMonth = 6 // July (0-indexed)
    let startYear = currentYear
    
    // If current month is before July, start from July of previous year
    if (currentDate.getMonth() < 6) {
      startYear = currentYear - 1
    }
    
    const endDate = new Date(currentYear, currentDate.getMonth(), 1)
    let date = new Date(startYear, startMonth, 1)
    
    while (date <= endDate) {
      months.push({
        month: date.getMonth(),
        year: date.getFullYear(),
        name: date.toLocaleString('default', { month: 'long' }),
        yearShort: date.getFullYear().toString().slice(-2),
        startDate: new Date(date),
        endDate: endOfMonth(date)
      })
      date = new Date(date.getFullYear(), date.getMonth() + 1, 1)
    }
    
    return months.reverse() // Show latest first
  }

  // Calculate actual working days for a month (excluding Sundays and holidays)
  const calculateWorkingDays = (monthData) => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(monthData.startDate),
      end: endOfMonth(monthData.startDate)
    })
    
    // Filter out Sundays
    let workingDays = daysInMonth.filter(day => !isSunday(day))
    
    // Filter out holidays
    if (holidays.length > 0) {
      const holidayDates = holidays.map(holiday => {
        try {
          return parseISO(holiday.date)
        } catch {
          return null
        }
      }).filter(Boolean)
      
      workingDays = workingDays.filter(day => {
        const dayFormatted = format(day, 'yyyy-MM-dd')
        return !holidayDates.some(holiday => 
          format(holiday, 'yyyy-MM-dd') === dayFormatted
        )
      })
    }
    
    return workingDays.length
  }

  const fetchAttendanceSummary = async () => {
    if (!EmpId) return

    setLoading(true)
    setError(null)

    try {
      const months = getAllMonthsFromJuly()
      const summaryPromises = months.map(async (month) => {
        try {
          const response = await axios.get(
            `https://namami-infotech.com/LIT/src/attendance/view_attendance.php`,
            { 
              params: { EmpId: EmpId },
              timeout: 10000
            }
          )

          if (response.data.success && response.data.data) {
            const monthData = response.data.data.filter(activity => {
              if (!activity.date) return false
              
              try {
                const [day, monthStr, year] = activity.date.split('/')
                const activityDate = new Date(Number.parseInt(year), Number.parseInt(monthStr) - 1, Number.parseInt(day))
                
                return activityDate.getMonth() === month.month && 
                       activityDate.getFullYear() === month.year
              } catch (error) {
                return false
              }
            })

            const totalWorkingDays = calculateWorkingDays(month)
            const present = monthData.length
            const absent = Math.max(0, totalWorkingDays - present)
            const percentage = totalWorkingDays > 0 ? ((present / totalWorkingDays) * 100).toFixed(1) : 0

            return {
              monthName: `${month.name} ${month.year}`,
              monthYear: `${month.year}-${String(month.month + 1).padStart(2, '0')}`,
              totalClasses: totalWorkingDays,
              present,
              absent,
              percentage: Number.parseFloat(percentage),
              sortKey: new Date(month.year, month.month).getTime(),
            }
          }
          return null
        } catch (error) {
          console.error(`Error fetching data for ${month.name}:`, error)
          const totalWorkingDays = calculateWorkingDays(month)
          return {
            monthName: `${month.name} ${month.year}`,
            monthYear: `${month.year}-${String(month.month + 1).padStart(2, '0')}`,
            totalClasses: totalWorkingDays,
            present: 0,
            absent: totalWorkingDays,
            percentage: 0,
            error: true,
            sortKey: new Date(month.year, month.month).getTime(),
          }
        }
      })

      const results = await Promise.all(summaryPromises)
      const validResults = results.filter(result => result !== null)
      
      validResults.sort((a, b) => b.sortKey - a.sortKey)
      
      setSummaryData(validResults)
    } catch (error) {
      console.error("Error fetching attendance summary:", error)
      setError("Failed to load attendance summary")
    } finally {
      setLoading(false)
    }
  }

  // Fetch holidays when component mounts or tenentId changes
  useEffect(() => {
    fetchHolidays()
  }, [tenentId])

  // Fetch attendance summary when EmpId changes or holidays are loaded
  useEffect(() => {
    if (EmpId && holidays.length >= 0) {
      fetchAttendanceSummary()
    }
  }, [EmpId, holidays])

  if (!EmpId) {
    return (
      <Box sx={{
        border: '1px dashed #999',
        padding: '20px',
        textAlign: 'center',
        fontFamily: '"Courier New", monospace',
        backgroundColor: '#fafafa'
      }}>
        <Typography variant="body2" color="text.secondary">
          Student ID required to view attendance summary
        </Typography>
      </Box>
    )
  }

  return (
    <Box sx={{
      border: '2px solid #333',
      padding: '20px',
      marginBottom: '30px',
      backgroundColor: '#fafafa',
      fontFamily: '"Courier New", monospace',
      position: 'relative'
    }}>
      {/* Corner label */}
      <Box sx={{
        position: 'absolute',
        top: '-10px',
        left: '20px',
        backgroundColor: '#f5f5f5',
        padding: '0 10px',
        fontFamily: '"Courier New", monospace',
        fontWeight: 'bold',
        fontSize: '14px',
        letterSpacing: '1px'
      }}>
        ATTENDANCE RECORD
      </Box>

      {/* Error Alerts */}
      {error && (
        <Alert severity="error" sx={{ 
          mb: 2, 
          fontFamily: '"Courier New", monospace',
          border: '1px solid #f44336'
        }}>
          {error}
        </Alert>
      )}
      
      {holidayError && (
        <Alert severity="warning" sx={{ 
          mb: 2, 
          fontFamily: '"Courier New", monospace',
          border: '1px solid #ff9800'
        }}>
          {holidayError}
        </Alert>
      )}

      {/* Loading States */}
      {(loading || holidayLoading) && (
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          py: 3,
          fontFamily: '"Courier New", monospace'
        }}>
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {holidayLoading ? "Loading academic calendar..." : "Loading attendance data..."}
          </Typography>
        </Box>
      )}

      {!(loading || holidayLoading) && summaryData.length > 0 ? (
        <>
          <Typography variant="subtitle1" sx={{ 
            fontWeight: 'bold', 
            mb: 2,
            textDecoration: 'underline',
            fontFamily: '"Courier New", monospace'
          }}>
            Monthly Attendance Summary (July to Current Month)
          </Typography>

          <TableContainer>
            <Table size="small" sx={{ 
              fontFamily: '"Courier New", monospace',
              border: '1px solid #333'
            }}>
              <TableHead>
                <TableRow sx={{ backgroundColor: '#f0f0f0' }}>
                  <TableCell sx={{ 
                    border: '1px solid #333', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    Academic Month
                  </TableCell>
                  <TableCell sx={{ 
                    border: '1px solid #333', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    Total Working Days
                  </TableCell>
                  <TableCell sx={{ 
                    border: '1px solid #333', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    Days Present
                  </TableCell>
                  <TableCell sx={{ 
                    border: '1px solid #333', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    Days Absent
                  </TableCell>
                  <TableCell sx={{ 
                    border: '1px solid #333', 
                    fontWeight: 'bold',
                    textAlign: 'center',
                    padding: '8px'
                  }}>
                    Attendance Percentage
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {summaryData.slice(0, 6).map((row) => (
                  <TableRow 
                    key={row.monthYear}
                    sx={{ 
                      '&:hover': {
                        backgroundColor: 'rgba(0, 0, 0, 0.04)'
                      }
                    }}
                  >
                    <TableCell sx={{ 
                      border: '1px solid #333',
                      padding: '8px',
                      fontWeight: '500'
                    }}>
                      {row.monthName}
                    </TableCell>
                    <TableCell sx={{ 
                      border: '1px solid #333',
                      padding: '8px',
                      textAlign: 'center',
                      fontWeight: '500'
                    }}>
                      {row.totalClasses}
                    </TableCell>
                    <TableCell sx={{ 
                      border: '1px solid #333',
                      padding: '8px',
                      textAlign: 'center',
                      color: '#2e7d32',
                      fontWeight: 'bold'
                    }}>
                      {row.present}
                    </TableCell>
                    <TableCell sx={{ 
                      border: '1px solid #333',
                      padding: '8px',
                      textAlign: 'center',
                      color: '#d32f2f'
                    }}>
                      {row.absent}
                    </TableCell>
                    <TableCell sx={{ 
                      border: '1px solid #333',
                      padding: '8px',
                      textAlign: 'center'
                    }}>
                      <Box sx={{
                        display: 'inline-block',
                        padding: '2px 12px',
                        backgroundColor: 
                          row.percentage >= 75 ? '#e8f5e8' :
                          row.percentage >= 60 ? '#fff8e1' : '#ffebee',
                        border: '1px solid',
                        borderColor: 
                          row.percentage >= 75 ? '#4caf50' :
                          row.percentage >= 60 ? '#ff9800' : '#f44336',
                        borderRadius: '2px',
                        fontWeight: 'bold',
                        minWidth: '60px'
                      }}>
                        {row.percentage}%
                      </Box>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Overall Summary */}
          {summaryData.length > 0 && (
            <Box sx={{ 
              mt: 3, 
              pt: 2, 
              borderTop: '1px solid #333',
              backgroundColor: '#f5f5f5',
              padding: '15px',
              borderRadius: '2px'
            }}>
              <Grid container spacing={2}>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" sx={{ fontFamily: '"Courier New", monospace' }}>
                    <strong>Total Months:</strong> {summaryData.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" sx={{ fontFamily: '"Courier New", monospace' }}>
                    <strong>Total Holidays:</strong> {holidays.length}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" sx={{ fontFamily: '"Courier New", monospace' }}>
                    <strong>Student ID:</strong> {EmpId}
                  </Typography>
                </Grid>
                <Grid item xs={6} md={3}>
                  <Typography variant="body2" sx={{ 
                    fontFamily: '"Courier New", monospace',
                    color: '#1976d2',
                    fontWeight: 'bold'
                  }}>
                    <strong>Latest:</strong> {summaryData[0]?.percentage}%
                  </Typography>
                </Grid>
              </Grid>
            </Box>
          )}

          {/* Legend */}
          <Box sx={{ 
            mt: 2, 
            pt: 1, 
            borderTop: '1px dashed #999',
            fontFamily: '"Courier New", monospace'
          }}>
            <Typography variant="caption" sx={{ display: 'block', mb: 0.5 }}>
              <strong>Note:</strong> Working days exclude Sundays and declared institute holidays
            </Typography>
            <Typography variant="caption" sx={{ display: 'block', fontStyle: 'italic' }}>
              Academic year follows July to June cycle
            </Typography>
          </Box>
        </>
      ) : !(loading || holidayLoading) && summaryData.length === 0 ? (
        <Box sx={{ 
          textAlign: 'center', 
          py: 3,
          fontFamily: '"Courier New", monospace'
        }}>
          <Typography variant="body2" sx={{ fontStyle: 'italic', color: '#666' }}>
            No attendance records found for this student
          </Typography>
          <Typography variant="caption" sx={{ display: 'block', mt: 1, color: '#999' }}>
            Attendance data may not be available for the current academic session
          </Typography>
        </Box>
      ) : null}
    </Box>
  )
}

// Add the missing Grid import

export default AttendanceSummary