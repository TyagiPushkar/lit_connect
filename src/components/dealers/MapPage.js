"use client"

import React, { useEffect, useState } from "react"
import {
  TextField,
  Button,
  FormControl,
  Autocomplete,
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  Card,
  CardContent,
  CardHeader,
  Grid,
  Chip,
  Avatar,
  Divider,
  Paper,
  IconButton,
  Tooltip,
  useTheme,
  useMediaQuery,
  Alert,
  CircularProgress,
  ListItemAvatar,
  Stack,
} from "@mui/material"
import {
  LocationOn,
  AccessTime,
  DirectionsCar,
  Business,
  Person,
  CalendarToday,
  Timeline,
  MyLocation,
  Route,
  Schedule,
  TrendingUp,
  Refresh,
  Map as MapIcon,
  ListAlt,
  Analytics,
} from "@mui/icons-material"
import { motion } from "framer-motion"
import axios from "axios"
import { useAuth } from "../auth/AuthContext"
import VisitMap from "./VisitMap"

// Compact Stats Card Component
const StatsCard = ({ icon, title, value, subtitle, color, trend }) => {
  const theme = useTheme()

  return (
    <Card
      component={motion.div}
      whileHover={{
        translateY: -2,
        boxShadow: theme.shadows[4],
        transition: { duration: 0.2 },
      }}
      sx={{
        height: "100%",
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(135deg, ${color}08 0%, ${color}03 100%)`,
        minHeight: 80,
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Avatar 
            sx={{ 
              bgcolor: `${color}15`, 
              color: color, 
              width: 40, 
              height: 40,
              fontSize: '1rem'
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary" noWrap>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color={color} noWrap>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  )
}

// Timeline Item Component
const TimelineItem = ({ visit, index, isFirst, isLast, attendanceData }) => {
  const theme = useTheme()
  const isAttendance = visit.type === "attendance"

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <ListItem
        sx={{
          px: 1,
          py: 1,
          borderLeft: `3px solid ${
            isAttendance
              ? isFirst
                ? theme.palette.success.main
                : theme.palette.error.main
              : theme.palette.primary.main
          }`,
          mb: 1,
          backgroundColor: 'background.paper',
          borderRadius: 1,
          '&:hover': {
            backgroundColor: 'action.hover',
          }
        }}
      >
        <ListItemAvatar sx={{ minWidth: 40 }}>
          <Avatar
            sx={{
              bgcolor: isAttendance
                ? isFirst
                  ? theme.palette.success.main
                  : theme.palette.error.main
                : theme.palette.primary.main,
              width: 32,
              height: 32,
              fontSize: '0.8rem'
            }}
          >
            {isAttendance ? (
              isFirst ? (
                <MyLocation fontSize="small" />
              ) : (
                <Schedule fontSize="small" />
              )
            ) : (
              <Business fontSize="small" />
            )}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            <Typography variant="subtitle2" fontWeight="medium" noWrap>
              {isAttendance
                ? isFirst
                  ? "Check In"
                  : "Check Out"
                : `${visit.CompanyName || "Visit"}`}
            </Typography>
          }
          secondary={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
              <AccessTime fontSize="small" sx={{ fontSize: '0.8rem', color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary">
                {isAttendance
                  ? isFirst
                    ? attendanceData?.firstIn || "N/A"
                    : attendanceData?.lastOut || "N/A"
                  : new Date(visit.VisitTime).toLocaleTimeString()}
              </Typography>
            </Box>
          }
        />
        <Chip
          label={isAttendance ? (isFirst ? "IN" : "OUT") : `#${index}`}
          size="small"
          color={isAttendance ? (isFirst ? "success" : "error") : "primary"}
          variant="outlined"
          sx={{ height: 24, fontSize: '0.7rem' }}
        />
      </ListItem>
    </motion.div>
  )
}

function MapPage() {
  const [visits, setVisits] = useState([])
  const [attendanceData, setAttendanceData] = useState(null)
  const { user } = useAuth()
  const [mapCenter, setMapCenter] = useState({ lat: 28.6139, lng: 77.209 })
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [markers, setMarkers] = useState([])
  const [employees, setEmployees] = useState([])
  const [selectedEmpId, setSelectedEmpId] = useState(user.role === "HR" ? "" : user.emp_id)
  const [totalDistance, setTotalDistance] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [viewMode, setViewMode] = useState("map")

  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // Fetch employees for HR role
  useEffect(() => {
    if (user.role === "HR") {
      const fetchEmployees = async () => {
        try {
          const response = await axios.get(
            `https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
          )
          if (response.data.success) {
            setEmployees(response.data.data)
          }
        } catch (error) {
          console.error("Error fetching employee list:", error.message)
        }
      }
      fetchEmployees()
    }
  }, [user.role, user.tenent_id])

  // Update map center and calculate total distance when markers change
  useEffect(() => {
    if (markers.length > 0) {
      const avgLat = markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length
      const avgLng = markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length
      setMapCenter({ lat: avgLat, lng: avgLng })

      let totalKm = 0
      for (let i = 1; i < markers.length; i++) {
        const prev = markers[i - 1]
        const curr = markers[i]
        totalKm += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng)
      }
      setTotalDistance(totalKm.toFixed(2))
    }
  }, [markers])

  // Fetch attendance data for the selected date
  const fetchAttendanceData = async (empId, date) => {
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/attendance/view_attendance.php?EmpId=${empId}`,
      )
      if (response.data.success && response.data.data.length > 0) {
        const formattedDate = date.toLocaleDateString("en-GB")
        const dayAttendance = response.data.data.find((day) => day.date === formattedDate)
        return dayAttendance || null
      }
      return null
    } catch (error) {
      console.error("Error fetching attendance data:", error)
      return null
    }
  }

  // Fetch visits and attendance data
  const fetchData = async () => {
    if (!selectedEmpId) {
      setError("Please select an employee")
      return
    }

    setLoading(true)
    setError("")

    try {
      const formattedDate = selectedDate.toISOString().substr(0, 10)

      // Fetch visits
      const visitsResponse = await axios.get(
        `https://namami-infotech.com/LIT/src/visit/view_visit.php?empId=${selectedEmpId}&date=${formattedDate}`,
      )

      // Fetch attendance data
      const attendance = await fetchAttendanceData(selectedEmpId, selectedDate)
      setAttendanceData(attendance)

      const allMarkers = []
      const combinedTimeline = []

      // Add attendance check-in as first marker if available
      if (attendance && attendance.firstInLocation && attendance.firstInLocation !== "N/A") {
        const [lat, lng] = attendance.firstInLocation.split(",").map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          allMarkers.push({
            lat,
            lng,
            label: "IN",
            type: "checkin",
            companyName: "Check In",
            dealerName: "Office Location",
            visitTime: attendance.firstIn,
          })
          combinedTimeline.push({
            type: "attendance",
            isFirst: true,
            time: attendance.firstIn,
          })
        }
      }

      // Add visit markers
      if (visitsResponse.data.success && visitsResponse.data.data.length > 0) {
        const visitData = visitsResponse.data.data
        visitData.forEach((visit, index) => {
          const [lat, lng] = visit.VisitLatLong.split(",").map(Number)
          if (!isNaN(lat) && !isNaN(lng)) {
            allMarkers.push({
              lat,
              lng,
              label: `${index + 1}`,
              type: "visit",
              companyName: visit.CompanyName,
              dealerName: visit.DealerName,
              visitTime: new Date(visit.VisitTime).toLocaleString(),
            })
          }
        })
        setVisits(visitData)
        combinedTimeline.push(...visitData)
      } else {
        setVisits([])
      }

      // Add attendance check-out as last marker if available
      if (attendance && attendance.lastOutLocation && attendance.lastOutLocation !== "N/A") {
        const [lat, lng] = attendance.lastOutLocation.split(",").map(Number)
        if (!isNaN(lat) && !isNaN(lng)) {
          allMarkers.push({
            lat,
            lng,
            label: "OUT",
            type: "checkout",
            companyName: "Check Out",
            dealerName: "Office Location",
            visitTime: attendance.lastOut,
          })
          combinedTimeline.push({
            type: "attendance",
            isFirst: false,
            time: attendance.lastOut,
          })
        }
      }

      setMarkers(allMarkers)
    } catch (err) {
      console.error("Error fetching data:", err)
      setError("Failed to fetch data. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleDateChange = (event) => {
    setSelectedDate(new Date(event.target.value))
  }

  // Function to calculate distance between two lat/lng points
  function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371
    const dLat = ((lat2 - lat1) * Math.PI) / 180
    const dLon = ((lon2 - lon1) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  // Calculate working hours
  const calculateWorkingHours = () => {
    if (!attendanceData || !attendanceData.firstIn || !attendanceData.lastOut) return "N/A"
    return attendanceData.workingHours || "N/A"
  }

  // Create timeline data combining attendance and visits
  const createTimelineData = () => {
    const timeline = []

    if (attendanceData && attendanceData.firstIn !== "N/A") {
      timeline.push({
        type: "attendance",
        isFirst: true,
        time: attendanceData.firstIn,
      })
    }

    visits.forEach((visit, index) => {
      timeline.push({
        ...visit,
        type: "visit",
        index: index + 1,
      })
    })

    if (attendanceData && attendanceData.lastOut !== "N/A") {
      timeline.push({
        type: "attendance",
        isFirst: false,
        time: attendanceData.lastOut,
      })
    }

    return timeline
  }

  const timelineData = createTimelineData()

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 3, mb: 3, borderRadius: 2 }}>
        <Box sx={{ display: "flex", flexDirection: { xs: 'column', md: 'row' }, justifyContent: "space-between", alignItems: { xs: 'stretch', md: 'center' }, gap: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#8d0638ff">
            Field Activity Tracker
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 1, alignSelf: { xs: 'stretch', md: 'center' } }}>
            <Button
              variant={viewMode === "map" ? "contained" : "outlined"}
              onClick={() => setViewMode("map")}
              size="small"
              startIcon={<MapIcon />}
              sx={{ flex: 1 }}
            >
              Map
            </Button>
            <Button
              variant={viewMode === "list" ? "contained" : "outlined"}
              onClick={() => setViewMode("list")}
              size="small"
              startIcon={<ListAlt />}
              sx={{ flex: 1 }}
            >
              List
            </Button>
          </Box>
        </Box>

        {/* Filters */}
        <Grid container spacing={2} alignItems="center" sx={{ mt: 2 }}>
          {user.role === "HR" && (
            <Grid item xs={12} sm={6} md={4}>
              <Autocomplete
                size="small"
                options={employees}
                getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
                value={employees.find((emp) => emp.EmpId === selectedEmpId) || null}
                onChange={(event, newValue) => {
                  setSelectedEmpId(newValue ? newValue.EmpId : "")
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Select Employee"
                    variant="outlined"
                    fullWidth
                  />
                )}
              />
            </Grid>
          )}

          <Grid item xs={12} sm={6} md={3}>
            <TextField
              size="small"
              type="date"
              value={selectedDate.toISOString().substr(0, 10)}
              onChange={handleDateChange}
              variant="outlined"
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={6} md={2}>
            <Button
              variant="contained"
              onClick={fetchData}
              disabled={loading || !selectedEmpId}
              fullWidth
              startIcon={loading ? <CircularProgress size={16} /> : <Analytics />}
              size="small"
            >
              {loading ? "Loading..." : "Analyze"}
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Compact Stats Cards */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<Business />}
            title="Total Visits"
            value={visits.length}
            color={theme.palette.primary.main}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<DirectionsCar />}
            title="Distance"
            value={`${totalDistance} km`}
            color={theme.palette.info.main}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<AccessTime />}
            title="Work Hours"
            value={calculateWorkingHours()}
            color={theme.palette.success.main}
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<Timeline />}
            title="Activities"
            value={timelineData.length}
            color={theme.palette.warning.main}
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Grid container spacing={2}>
        {/* Map/Timeline View */}
        <Grid item xs={12} lg={8}>
          <Paper elevation={1} sx={{ borderRadius: 2, height: 500 }}>
            {viewMode === "map" ? (
              <Box sx={{ height: "100%" }}>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="h6">Route Map</Typography>
                </Box>
                <Box sx={{ height: "calc(100% - 60px)", borderRadius: 1 }}>
                  <VisitMap markers={markers} mapCenter={mapCenter} />
                </Box>
              </Box>
            ) : (
              <Box sx={{ height: "100%" }}>
                <Box sx={{ p: 2, pb: 1 }}>
                  <Typography variant="h6">Activity Timeline</Typography>
                </Box>
                <List sx={{ height: "calc(100% - 60px)", overflow: "auto", p: 1 }}>
                  {timelineData.map((item, index) => (
                    <TimelineItem
                      key={index}
                      visit={item}
                      index={index}
                      isFirst={item.type === "attendance" && item.isFirst}
                      isLast={item.type === "attendance" && !item.isFirst}
                      attendanceData={attendanceData}
                    />
                  ))}
                  {timelineData.length === 0 && (
                    <Box sx={{ textAlign: "center", py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No activities found
                      </Typography>
                    </Box>
                  )}
                </List>
              </Box>
            )}
          </Paper>
        </Grid>

        {/* Summary Panel */}
        <Grid item xs={12} lg={4}>
          <Stack spacing={2}>
            {/* Attendance Summary */}
            {attendanceData && (
              <Card elevation={1}>
                <CardHeader
                  title="Attendance"
                  titleTypographyProps={{ variant: 'h6' }}
                  avatar={
                    <Avatar sx={{ bgcolor: theme.palette.success.main, width: 32, height: 32 }}>
                      <Schedule fontSize="small" />
                    </Avatar>
                  }
                  sx={{ pb: 1 }}
                />
                <CardContent sx={{ pt: 0 }}>
                  <Grid container spacing={1}>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" color="success.main" fontWeight="medium">
                          {attendanceData.firstIn || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check In
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid item xs={6}>
                      <Box sx={{ textAlign: "center" }}>
                        <Typography variant="body1" color="error.main" fontWeight="medium">
                          {attendanceData.lastOut || "N/A"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Check Out
                        </Typography>
                      </Box>
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            )}

            {/* Visit Details */}
            <Card elevation={1}>
              <CardHeader
                title="Visits"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 32, height: 32 }}>
                    <Business fontSize="small" />
                  </Avatar>
                }
                sx={{ pb: 1 }}
              />
              <List dense sx={{ maxHeight: 200, overflow: "auto" }}>
                {visits.map((visit, index) => (
                  <ListItem key={index} sx={{ px: 2, py: 0.5 }}>
                    <ListItemAvatar sx={{ minWidth: 32 }}>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, width: 24, height: 24, fontSize: '0.8rem' }}>
                        {index + 1}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Typography variant="body2" noWrap>
                          {visit.CompanyName}
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {new Date(visit.VisitTime).toLocaleTimeString()}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
                {visits.length === 0 && (
                  <ListItem>
                    <ListItemText
                      primary="No visits recorded"
                      primaryTypographyProps={{ variant: 'body2', color: 'text.secondary' }}
                    />
                  </ListItem>
                )}
              </List>
            </Card>

            {/* Route Summary */}
            <Card elevation={1}>
              <CardHeader
                title="Route Summary"
                titleTypographyProps={{ variant: 'h6' }}
                avatar={
                  <Avatar sx={{ bgcolor: theme.palette.info.main, width: 32, height: 32 }}>
                    <Route fontSize="small" />
                  </Avatar>
                }
                sx={{ pb: 1 }}
              />
              <CardContent sx={{ pt: 0 }}>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Distance:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {totalDistance} km
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
                  <Typography variant="body2" color="text.secondary">
                    Stops:
                  </Typography>
                  <Typography variant="body2" fontWeight="medium">
                    {markers.length}
                  </Typography>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: 'center' }}>
                  <Typography variant="body2" color="text.secondary">
                    Efficiency:
                  </Typography>
                  <Chip
                    label={visits.length > 3 ? "High" : visits.length > 1 ? "Medium" : "Low"}
                    color={visits.length > 3 ? "success" : visits.length > 1 ? "warning" : "error"}
                    size="small"
                    sx={{ height: 20, fontSize: '0.6rem' }}
                  />
                </Box>
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </Box>
  )
}

export default MapPage