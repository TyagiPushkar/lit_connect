import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  Alert,
} from "@mui/material";
import { useState, useEffect } from "react";
import axios from "axios";
import {
  format,
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  isSunday,
  parseISO,
} from "date-fns";

const AttendanceSummary = ({ EmpId, tenentId = "1", sem, year, course }) => {
  // console.log("AttendanceSummary Props:", { EmpId, tenentId, sem, year, course });
  const [summaryData, setSummaryData] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [holidayLoading, setHolidayLoading] = useState(false);
  const [error, setError] = useState(null);
  const [holidayError, setHolidayError] = useState(null);

  // Fetch holidays from API
  const fetchHolidays = async () => {
    setHolidayLoading(true);
    setHolidayError(null);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/holiday/view_holiday.php?Tenent_Id=${tenentId}`,
        { timeout: 10000 },
      );
      if (response.data.success && response.data.data) {
        setHolidays(response.data.data);
      } else {
        setHolidays([]);
        setHolidayError("No holiday data found");
      }
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setHolidayError("Failed to load holiday data");
      setHolidays([]);
    } finally {
      setHolidayLoading(false);
    }
  };

  // Get all months from July to current month
  const getAllMonthsFromJuly = (semester, session) => {
    const months = [];
    if (!semester || semester < 1) return months;
    const startYear = parseInt(session.split("-")[0]);
    let year;
    let startMonth, endMonth;
    if (semester % 2 === 1) {
      // Odd semester (Jul-Dec)
      year = startYear + Math.floor((semester - 1) / 2);
      startMonth = 6;
      endMonth = 11;
    } else {
      // Even semester (Jan-Jun)
      year = startYear + Math.floor(semester / 2);
      startMonth = 0;
      endMonth = 5;
    }
    for (let m = startMonth; m <= endMonth; m++) {
      months.push({
        month: m,
        year: year,
        name: new Date(year, m, 1).toLocaleString("default", { month: "long" }),
        startDate: new Date(year, m, 1),
        endDate: endOfMonth(new Date(year, m, 1)),
      });
    }
    return months;
  };

  // Calculate actual working days for a month (excluding Sundays and holidays)
  // const calculateWorkingDays = (monthData) => {
  //   const daysInMonth = eachDayOfInterval({
  //     start: startOfMonth(monthData.startDate),
  //     end: endOfMonth(monthData.startDate),
  //   });

  //   // Filter out Sundays
  //   let workingDays = daysInMonth.filter((day) => !isSunday(day));

  //   // Filter out holidays
  //   if (holidays.length > 0) {
  //     const holidayDates = holidays
  //       .map((holiday) => {
  //         try {
  //           return parseISO(holiday.date);
  //         } catch {
  //           return null;
  //         }
  //       })
  //       .filter(Boolean);

  //     workingDays = workingDays.filter((day) => {
  //       const dayFormatted = format(day, "yyyy-MM-dd");
  //       return !holidayDates.some(
  //         (holiday) => format(holiday, "yyyy-MM-dd") === dayFormatted,
  //       );
  //     });
  //   }

  //   return workingDays.length;
  // };

  //change by shahanshah
  const calculateWorkingDays = (monthData) => {
    const daysInMonth = eachDayOfInterval({
      start: startOfMonth(monthData.startDate),
      end: endOfMonth(monthData.startDate),
    });

    const normalizedCourse = String(course || "")
      .trim()
      .toLowerCase();
    const normalizedSem = String(sem || "").trim();

    const workingDays = daysInMonth.filter((day) => {
      // Sunday = non-working day
      if (isSunday(day)) {
        return false;
      }

      const currentDate = format(day, "yyyy-MM-dd");

      // Find holidays applicable to this student
      const isHoliday = holidays.some((holiday) => {
        if (!holiday.date) return false;

        const holidayDate = String(holiday.date).trim();

        // Date must match first
        if (holidayDate !== currentDate) {
          return false;
        }

        const holidayCourse = String(holiday.Course || "")
          .trim()
          .toLowerCase();

        const holidaySem = String(holiday.Sem || "").trim();

        /*
          Holiday matching rules:
  
          1. All + All
             => Everyone
  
          2. All + specific semester
             => All courses of that semester
  
          3. Specific course + All
             => All semesters of that course
  
          4. Specific course + specific semester
             => Exact student course + semester
        */

        const courseMatches =
          holidayCourse === "all" || holidayCourse === normalizedCourse;

        const semMatches =
          holidaySem.toLowerCase() === "all" || holidaySem === normalizedSem;

        return courseMatches && semMatches;
      });

      // If applicable holiday found => not a working day
      if (isHoliday) {
        return false;
      }

      return true;
    });

    return workingDays.length;
  };

  // const fetchAttendanceSummary = async () => {
  //   if (!EmpId) return;
  //   setLoading(true);
  //   setError(null);
  //   try {
  //     const months = getAllMonthsFromJuly();
  //     const summaryPromises = months.map(async (month) => {
  //       try {
  //         const response = await axios.get(
  //           `https://namami-infotech.com/LIT/src/attendance/view_attendance.php`,
  //           {
  //             params: { EmpId: EmpId },
  //             timeout: 10000,
  //           },
  //         );

  //         if (response.data.success && response.data.data) {
  //           const monthData = response.data.data.filter((activity) => {
  //             if (!activity.date) return false;

  //             try {
  //               const [day, monthStr, year] = activity.date.split("/");
  //               const activityDate = new Date(
  //                 Number.parseInt(year),
  //                 Number.parseInt(monthStr) - 1,
  //                 Number.parseInt(day),
  //               );

  //               return (
  //                 activityDate.getMonth() === month.month &&
  //                 activityDate.getFullYear() === month.year
  //               );
  //             } catch (error) {
  //               return false;
  //             }
  //           });

  //           const totalWorkingDays = calculateWorkingDays(month);
  //           const present = monthData.length;
  //           const absent = Math.max(0, totalWorkingDays - present);
  //           const percentage =
  //             totalWorkingDays > 0
  //               ? ((present / totalWorkingDays) * 100).toFixed(1)
  //               : 0;

  //           return {
  //             monthName: `${month.name} ${month.year}`,
  //             monthYear: `${month.year}-${String(month.month + 1).padStart(2, "0")}`,
  //             totalClasses: totalWorkingDays,
  //             present,
  //             absent,
  //             percentage: Number.parseFloat(percentage),
  //             sortKey: new Date(month.year, month.month).getTime(),
  //           };
  //         }
  //         return null;
  //       } catch (error) {
  //         console.error(`Error fetching data for ${month.name}:`, error);
  //         const totalWorkingDays = calculateWorkingDays(month);
  //         return {
  //           monthName: `${month.name} ${month.year}`,
  //           monthYear: `${month.year}-${String(month.month + 1).padStart(2, "0")}`,
  //           totalClasses: totalWorkingDays,
  //           present: 0,
  //           absent: totalWorkingDays,
  //           percentage: 0,
  //           error: true,
  //           sortKey: new Date(month.year, month.month).getTime(),
  //         };
  //       }
  //     });

  //     const results = await Promise.all(summaryPromises);
  //     const validResults = results.filter((result) => result !== null);

  //     validResults.sort((a, b) => b.sortKey - a.sortKey);

  //     setSummaryData(validResults);
  //   } catch (error) {
  //     console.error("Error fetching attendance summary:", error);
  //     setError("Failed to load attendance summary");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  //change by shahanshah
  const fetchAttendanceSummary = async () => {
    if (!EmpId) return;
    setLoading(true);
    setError(null);
    try {
      const months = getAllMonthsFromJuly(sem, year);
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/attendance/view_attendance.php`,
        {
          params: { EmpId },
          timeout: 10000,
        },
      );
      if (!response.data.success || !response.data.data) {
        setSummaryData([]);
        return;
      }
      const allAttendance = response.data.data;
      const today = new Date();
      const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

      const results = months.map((month) => {
        const monthYear = `${month.year}-${String(month.month + 1).padStart(2, "0")}`;
        const isFuture = monthYear > currentMonthKey;

        const monthAttendance = allAttendance.filter((activity) => {
          if (!activity.date) return false;
          try {
            const [day, monthStr, year] = activity.date.split("/");
            const activityDate = new Date(
              parseInt(year),
              parseInt(monthStr) - 1,
              parseInt(day),
            );
            return (
              activityDate.getMonth() === month.month &&
              activityDate.getFullYear() === month.year
            );
          } catch {
            return false;
          }
        });
        //  REMOVE DUPLICATE DATES
        const uniqueDates = new Set(monthAttendance.map((a) => a.date));
        const present = uniqueDates.size;
        const totalWorkingDays = isFuture ? 0 : calculateWorkingDays(month);
        const absent = isFuture ? 0 : Math.max(0, totalWorkingDays - present);
        const percentage =
          !isFuture && totalWorkingDays > 0
            ? ((present / totalWorkingDays) * 100).toFixed(1)
            : 0;
        return {
          monthName: `${month.name} ${month.year}`,
          monthYear,
          isFuture,
          totalClasses: isFuture ? 0 : totalWorkingDays,
          present: isFuture ? 0 : present,
          absent: isFuture ? 0 : absent,
          percentage: Number(percentage),
          sortKey: new Date(month.year, month.month).getTime(),
        };
      });
      results.sort((a, b) => b.sortKey - a.sortKey);
      setSummaryData(results);
    } catch (error) {
      console.error("Attendance Error:", error);
      setError("Failed to load attendance summary");
    } finally {
      setLoading(false);
    }
  };

  // Fetch holidays when component mounts or tenentId changes
  useEffect(() => {
    fetchHolidays();
  }, [tenentId]);

  // Fetch attendance summary when EmpId changes or holidays are loaded
  useEffect(() => {
    if (EmpId && holidays.length > 0) {
      fetchAttendanceSummary();
    }
  }, [EmpId, holidays.length, sem, year, course]);

  // const totalWorkingDays = summaryData.reduce(
  //   (sum, row) => sum + row.totalClasses,
  //   0,
  // );

  // const totalPresent = summaryData.reduce((sum, row) => sum + row.present, 0);
  // const totalAbsent = summaryData.reduce((sum, row) => sum + row.absent, 0);
  // const overallPercentage =
  //   summaryData.length > 0
  //     ? (
  //       summaryData.reduce((sum, row) => sum + row.percentage, 0) /
  //       summaryData.length
  //     ).toFixed(1)
  //     : 0;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const currentMonthKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}`;

  const eligibleRows = summaryData.filter(
    (row) => !row.isFuture && row.monthYear <= currentMonthKey,
  );

  const totalWorkingDays = eligibleRows.reduce(
    (sum, row) => sum + row.totalClasses,
    0,
  );

  const totalPresent = eligibleRows.reduce((sum, row) => sum + row.present, 0);

  const totalAbsent = Math.max(0, totalWorkingDays - totalPresent);

  const overallPercentage =
    totalWorkingDays > 0
      ? ((totalPresent / totalWorkingDays) * 100).toFixed(1)
      : "0.0";

  if (!EmpId) {
    return (
      <Box
        sx={{
          border: "1px dashed #111",
          padding: "20px",
          textAlign: "center",
          fontFamily: "Inter, Roboto, Arial, sans-serif",
          backgroundColor: "#fafafa",
        }}
      >
        <Typography variant="body2" color="text.secondary">
          Student ID required to view attendance summary
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        border: "1px solid #111",
        padding: "20px",
        marginBottom: "0px",
        backgroundColor: "#fafafa",
        fontFamily: "Inter, Roboto, Arial, sans-serif",
        position: "relative",
      }}
    >
      {/* Corner label */}
      <Box
        sx={{
          position: "absolute",
          top: "-12px",
          left: "20px",
          backgroundColor: "#f5f5f5",
          padding: "0 10px",
          fontFamily: '"Georgia", serif',
          fontWeight: "bold",
          fontSize: "20px",
          letterSpacing: "1px",
          color: "#111",
          border: "1px solid #111",
        }}
      >
        ATTENDANCE RECORD
      </Box>

      {/* Error Alerts */}
      {error && (
        <Alert
          severity="error"
          sx={{
            mb: 2,
            fontFamily: "Inter, Roboto, Arial, sans-serif",
            border: "1px solid #f44336",
          }}
        >
          {error}
        </Alert>
      )}

      {holidayError && (
        <Alert
          severity="warning"
          sx={{
            mb: 2,
            fontFamily: "Inter, Roboto, Arial, sans-serif",
            border: "1px solid #ff9800",
          }}
        >
          {holidayError}
        </Alert>
      )}

      {/* Loading States */}
      {(loading || holidayLoading) && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            py: 3,
            fontFamily: "Inter, Roboto, Arial, sans-serif",
          }}
        >
          <CircularProgress size={24} sx={{ mr: 2 }} />
          <Typography variant="body2" color="text.secondary">
            {holidayLoading
              ? "Loading academic calendar..."
              : "Loading attendance data..."}
          </Typography>
        </Box>
      )}

      {!(loading || holidayLoading) && summaryData.length > 0 ? (
        <>
          <Typography
            variant="h8"
            sx={{
              fontWeight: 600,
              mt: 2,
              mb: 2,
              color: "#111",
              fontFamily: "Inter, Roboto, Arial, sans-serif",
              letterSpacing: "0.5px",
              borderBottom: "2px solid #111",
              pb: 0.5,
              display: "inline-block",
              fontSize: "22px",
            }}
          >
            Monthly Attendance Summary (Latest 6 Months)
          </Typography>

          <Box sx={{ width: "100%", overflow: "hidden" }}>
            <TableContainer>
              <Table
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
                <TableHead>
                  <TableRow
                    sx={{ backgroundColor: "#f0f0f0" }}
                    className="pdf-block"
                  >
                    <TableCell
                      sx={{
                        fontWeight: "bold",
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
                      Total Class
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: "20px",
                      }}
                    >
                      Present
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: "20px",
                      }}
                    >
                      Absent
                    </TableCell>
                    <TableCell
                      sx={{
                        fontWeight: "bold",
                        textAlign: "center",
                        fontSize: "20px",
                      }}
                    >
                      Attend %
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {summaryData.slice(0, 6).map((row) => {
                    const isFuture = row.isFuture ?? (row.monthYear > currentMonthKey);
                    return (
                      <TableRow
                        key={row.monthYear}
                        className="pdf-block"
                        sx={{
                          "&:hover": {
                            backgroundColor: "rgba(0, 0, 0, 0.04)",
                          },
                        }}
                      >
                        <TableCell
                          sx={{
                            border: "1px solid #111",
                            fontWeight: "500",
                            fontSize: "20px",
                          }}
                        >
                          {row.monthName}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #111",
                            textAlign: "center",
                            fontWeight: "500",
                            fontSize: "20px",
                          }}
                        >
                          {isFuture ? "-" : row.totalClasses}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #111",
                            fontSize: "20px",
                            textAlign: "center",
                            color: isFuture ? "#000000" : "#2e7d32",
                            fontWeight: isFuture ? "500" : "bold",
                          }}
                        >
                          {isFuture ? "-" : row.present}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #111",
                            fontSize: "20px",
                            fontWeight: isFuture ? "500" : "bold",
                            textAlign: "center",
                            color: isFuture ? "#000000" : "#d32f2f",
                          }}
                        >
                          {isFuture ? "-" : row.absent}
                        </TableCell>
                        <TableCell
                          sx={{
                            border: "1px solid #111",
                            fontSize: "20px",
                            textAlign: "center",
                          }}
                        >
                          {isFuture ? (
                            "-"
                          ) : (
                            <Box
                              sx={{
                                display: "inline-block",
                                padding: "2px 12px",
                                fontSize: "20px",
                                backgroundColor:
                                  row.percentage >= 75
                                    ? "#e8f5e8"
                                    : row.percentage >= 60
                                      ? "#fff8e1"
                                      : "#ffebee",
                                border: "1px solid",
                                borderColor:
                                  row.percentage >= 75
                                    ? "#4caf50"
                                    : row.percentage >= 60
                                      ? "#ff9800"
                                      : "#f44336",
                                borderRadius: "2px",
                                fontWeight: "bold",
                                minWidth: "60px",
                              }}
                            >
                              {row.percentage}%
                            </Box>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableRow sx={{}} className="pdf-block">
                  <TableCell
                    sx={{
                      border: "1px solid #111",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    Total Average
                  </TableCell>

                  <TableCell
                    sx={{
                      border: "1px solid #111",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    {eligibleRows.length > 0 ? totalWorkingDays : "-"}
                  </TableCell>

                  <TableCell
                    sx={{
                      border: "1px solid #111",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    {eligibleRows.length > 0 ? totalPresent : "-"}
                  </TableCell>

                  <TableCell
                    sx={{
                      border: "1px solid #111",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    {eligibleRows.length > 0 ? totalAbsent : "-"}
                  </TableCell>

                  <TableCell
                    sx={{
                      border: "1px solid #111",
                      textAlign: "center",
                      fontWeight: "bold",
                      fontSize: "20px",
                    }}
                  >
                    {eligibleRows.length > 0 ? `${overallPercentage}%` : "-"}
                  </TableCell>
                </TableRow>
              </Table>
            </TableContainer>
          </Box>

          {/* Overall Summary */}
          {/* Legend */}
          <Box
            sx={{
              mt: 2,
              pt: 1,
              borderTop: "1px dashed #111",
              fontFamily: "Inter, Roboto, Arial, sans-serif",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                color: "#111",
                fontSize: "17px",
              }}
            >
              <strong>Note:</strong> Total Class Days exclude Sundays and
              declared institute holidays
            </Typography>
          </Box>
        </>
      ) : !(loading || holidayLoading) && summaryData.length === 0 ? (
        <Box
          sx={{
            textAlign: "center",
            py: 3,
            fontFamily: "Inter, Roboto, Arial, sans-serif",
          }}
        >
          <Typography
            variant="body2"
            sx={{ fontStyle: "italic", color: "#111", fontSize: "19px" }}
          >
            No attendance records found for this student
          </Typography>
          <Typography
            variant="caption"
            sx={{ display: "block", mt: 1, color: "#555", fontSize: "17px" }}
          >
            Attendance data may not be available for the current academic
            session
          </Typography>
        </Box>
      ) : null}
    </Box>
  );
};

// Add the missing Grid import

export default AttendanceSummary;
