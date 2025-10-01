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
  IconButton,
  Pagination,
  Stack,
} from "@mui/material"
import { TrendingUp, CalendarToday, Refresh } from "@mui/icons-material"
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
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 12

  // Fetch holidays from API
  const fetchHolidays = async () => {
    setHolidayLoading(true)
    setHolidayError(null)
    
    try {
      console.log("Fetching holidays for Tenent_Id:", tenentId)
      
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/holiday/view_holiday.php?Tenent_Id=${tenentId}`,
        { timeout: 10000 }
      )
      
      console.log("Holidays API Response:", response.data)
      
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
                // Parse date in dd/MM/yyyy format
                const [day, monthStr, year] = activity.date.split('/')
                const activityDate = new Date(Number.parseInt(year), Number.parseInt(monthStr) - 1, Number.parseInt(day))
                
                return activityDate.getMonth() === month.month && 
                       activityDate.getFullYear() === month.year
              } catch (error) {
                return false
              }
            })

            // Calculate actual working days (excluding Sundays and holidays)
            const totalWorkingDays = calculateWorkingDays(month)
            const present = monthData.length
            const absent = Math.max(0, totalWorkingDays - present) // Ensure non-negative
            const percentage = totalWorkingDays > 0 ? ((present / totalWorkingDays) * 100).toFixed(1) : 0

            return {
              monthName: `${month.name} ${month.year}`,
              monthYear: `${month.year}-${String(month.month + 1).padStart(2, '0')}`,
              totalClasses: totalWorkingDays,
              present,
              absent,
              percentage: Number.parseFloat(percentage),
              sortKey: new Date(month.year, month.month).getTime(),
              holidayCount: holidays.filter(holiday => {
                try {
                  const holidayDate = parseISO(holiday.date)
                  return holidayDate.getMonth() === month.month && 
                         holidayDate.getFullYear() === month.year
                } catch {
                  return false
                }
              }).length
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
            holidayCount: holidays.filter(holiday => {
              try {
                const holidayDate = parseISO(holiday.date)
                return holidayDate.getMonth() === month.month && 
                       holidayDate.getFullYear() === month.year
              } catch {
                return false
              }
            }).length
          }
        }
      })

      const results = await Promise.all(summaryPromises)
      const validResults = results.filter(result => result !== null)
      
      // Sort by date descending (newest first)
      validResults.sort((a, b) => b.sortKey - a.sortKey)
      
      setSummaryData(validResults)
      setCurrentPage(1) // Reset to first page when data changes
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
    if (EmpId && holidays.length >= 0) { // Check if holidays are loaded (even if empty array)
      fetchAttendanceSummary()
    }
  }, [EmpId, holidays])

  const getPercentageColor = (percentage) => {
    if (percentage >= 90) return "success.main"
    if (percentage >= 75) return "warning.main"
    return "error.main"
  }

  // Refresh all data
  const refreshData = () => {
    fetchHolidays()
    if (EmpId) {
      fetchAttendanceSummary()
    }
  }

  // Pagination calculations
  const totalPages = Math.ceil(summaryData.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedData = summaryData.slice(startIndex, startIndex + itemsPerPage)

  const handlePageChange = (event, value) => {
    setCurrentPage(value)
  }

  if (!EmpId) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          Please select an employee to view summary
        </Typography>
      </Paper>
    )
  }

  return (
    <Paper sx={{ p: 2, borderRadius: 2, boxShadow: 2 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Box display="flex" alignItems="center" gap={1}>
          <TrendingUp color="primary" />
          <Typography variant="h6" fontWeight="bold">
            Attendance Summary
          </Typography>
        </Box>
        
        <Box display="flex" alignItems="center" gap={1}>
          {summaryData.length > 0 && (
            <Typography variant="caption" color="text.secondary">
              Page {currentPage} of {totalPages}
            </Typography>
          )}
          <IconButton 
            size="small" 
            onClick={refreshData} 
            disabled={loading || holidayLoading}
            title="Refresh data"
          >
            <Refresh fontSize="small" />
          </IconButton>
        </Box>
      </Box>

      {/* Error Alerts */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      
      {holidayError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setHolidayError(null)}>
          {holidayError}
        </Alert>
      )}

      {/* Loading States */}
      {(loading || holidayLoading) && (
        <Box display="flex" justifyContent="center" alignItems="center" py={3} gap={2}>
          <CircularProgress size={30} />
          <Typography variant="body2" color="text.secondary">
            {holidayLoading ? "Loading holidays..." : "Loading attendance data..."}
          </Typography>
        </Box>
      )}

      {!(loading || holidayLoading) && (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: "#CC7A00" }}>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>
                    Month
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>
                    Total Classes
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>
                    Present
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>
                    Absent
                  </TableCell>
                  <TableCell align="center" sx={{ color: "white", fontWeight: "bold", fontSize: "0.75rem" }}>
                    Attendance %
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {paginatedData.map((row, index) => (
                  <TableRow 
                    key={row.monthYear}
                    sx={{ 
                      '&:last-child td, &:last-child th': { border: 0 },
                      backgroundColor: row.error ? 'error.light' : 'transparent',
                      '&:hover': {
                        backgroundColor: row.error ? 'error.light' : 'action.hover'
                      }
                    }}
                  >
                    <TableCell 
                      component="th" 
                      scope="row"
                      sx={{ fontSize: "0.75rem", fontWeight: "medium" }}
                    >
                      <Box display="flex" alignItems="center" gap={1}>
                        <CalendarToday sx={{ fontSize: 16, color: "primary.main" }} />
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {row.monthName}
                          </Typography>
                          {row.holidayCount > 0 && (
                            <Typography variant="caption" color="warning.main">
                              {row.holidayCount} holiday{row.holidayCount > 1 ? 's' : ''}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell align="center" sx={{ fontSize: "0.75rem", fontWeight: "medium" }}>
                      {row.totalClasses}
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontSize: "0.75rem", 
                        fontWeight: "bold",
                        color: "success.main"
                      }}
                    >
                      {row.present}
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontSize: "0.75rem",
                        color: "error.main",
                        fontWeight: "medium"
                      }}
                    >
                      {row.absent}
                    </TableCell>
                    <TableCell 
                      align="center" 
                      sx={{ 
                        fontSize: "0.75rem",
                        fontWeight: "bold",
                        color: getPercentageColor(row.percentage)
                      }}
                    >
                      {row.percentage}%
                    </TableCell>
                  </TableRow>
                ))}
                
                {summaryData.length === 0 && !loading && !holidayLoading && (
                  <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 3 }}>
                      <Typography variant="body2" color="text.secondary">
                        No attendance data found
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Pagination */}
          {summaryData.length > itemsPerPage && (
            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={currentPage}
                onChange={handlePageChange}
                color="primary"
                size="small"
                showFirstButton
                showLastButton
              />
            </Box>
          )}
        </>
      )}

      {/* Footer with quick stats */}
      {summaryData.length > 0 && (
        <Box sx={{ mt: 2, pt: 1, borderTop: 1, borderColor: 'divider' }}>
          <Typography variant="caption" color="text.secondary">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, summaryData.length)} of {summaryData.length} months • 
            Student ID: <strong>{EmpId}</strong> • 
            Total No. of Classes days exclude Sundays and {holidays.length} holiday{holidays.length !== 1 ? 's' : ''}
          </Typography>
        </Box>
      )}
    </Paper>
  )
}

export default AttendanceSummary