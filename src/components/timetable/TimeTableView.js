"use client"

import { useEffect, useState } from "react"
import {
  Box,
  Grid,
  Typography,
  MenuItem,
  TextField,
  Paper,
  Autocomplete,
  Tooltip,
  IconButton,
  useTheme,
  useMediaQuery,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  Chip,
  Card,
  CardContent,
  Fade,
  Zoom,
} from "@mui/material"
import {
  Refresh as RefreshIcon,
  FilterAlt as FilterIcon,
  Download as DownloadIcon,
  Add as AddIcon,
  Close as CloseIcon,
  Schedule as ScheduleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Room as RoomIcon,
} from "@mui/icons-material"
import axios from "axios"

// Constants
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
const FULL_DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
const TIME_SLOTS = [
  "08:00",
  "09:00",
  "10:00",
  "11:00",
  "12:00",
  "13:00",
  "14:00",
  "15:00",
  "16:00",
  "17:00",
  "18:00",
  "19:00",
]
const COURSES = ["BCA", "BSc. CS(H)", "BSc. ITM(H)", "BSc. DS"]
const SEMESTERS = [1, 2, 3, 4, 5, 6]

// Modern color palette
const subjectColors = [
  "#667eea",
  "#764ba2",
  "#f093fb",
  "#f5576c",
  "#4facfe",
  "#43e97b",
  "#fa709a",
  "#fee140",
  "#a8edea",
  "#d299c2",
  "#89f7fe",
  "#66a6ff",
]

const ModernTimeTableView = () => {
  const theme = useTheme()
  const isMobile = useMediaQuery(theme.breakpoints.down("md"))

  // State
  const [course, setCourse] = useState("BCA")
  const [semester, setSemester] = useState("4")
  const [timetable, setTimetable] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [showFilters, setShowFilters] = useState(true)
  const [subjects, setSubjects] = useState([])
  const [openDialog, setOpenDialog] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [formData, setFormData] = useState({
    subject: "",
    faculty: "",
    room: "",
  })
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  })

  const fetchTimetable = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get(`https://namami-infotech.com/LIT/src/timetable/get_time_table.php`, {
        params: {
          Course: course,
          Sem: semester,
        },
        timeout: 10000,
      })

      if (res.data && res.data.data) {
        setTimetable(res.data.data)
        setLastUpdated(new Date())
        setSnackbar({
          open: true,
          message: "Timetable loaded successfully!",
          severity: "success",
        })
      } else {
        setTimetable([])
        setError("No timetable data available for the selected criteria.")
      }
    } catch (err) {
      console.error("Error fetching timetable:", err)
      setError("Failed to load timetable. Please try again later.")
      setTimetable([])
      setSnackbar({
        open: true,
        message: "Failed to load timetable data",
        severity: "error",
      })
    } finally {
      setLoading(false)
    }
  }

  const fetchSubjects = async () => {
    try {
      const res = await axios.get(`https://namami-infotech.com/LIT/src/menu/subjects.php`, {
        params: {
          Course: course,
          Sem: semester,
        },
      })

      if (res.data && res.data.success) {
        setSubjects(res.data.data.map((subject) => subject.Subject))
      }
    } catch (err) {
      console.error("Error fetching subjects:", err)
      setSubjects([])
    }
  }

  useEffect(() => {
    fetchTimetable()
    fetchSubjects()
  }, [course, semester])

  const getSlotContent = (day, time) => {
    const fullDay = FULL_DAYS[DAYS.indexOf(day)]
    const match = timetable.find((item) => item.day_of_week === fullDay && item.start_time.startsWith(time))

    if (!match) return null

    const colorIndex = subjects.indexOf(match.subject) % subjectColors.length
    const color = subjectColors[colorIndex]

    return {
      subject: match.subject,
      faculty: match.faculty,
      room: match.room || "N/A",
      color,
    }
  }

  const handleSlotClick = (day, time) => {
    setSelectedSlot({ day, time })
    const existing = getSlotContent(day, time)
    setFormData({
      subject: existing?.subject || "",
      faculty: existing?.faculty || "",
      room: existing?.room === "N/A" ? "" : existing?.room || "",
    })
    setOpenDialog(true)
  }

  const handleSubmit = async () => {
    if (!formData.subject || !formData.faculty) {
      setSnackbar({
        open: true,
        message: "Please fill in all required fields.",
        severity: "error",
      })
      return
    }

    try {
      const fullDay = FULL_DAYS[DAYS.indexOf(selectedSlot.day)]
      const payload = {
        course,
        semester,
        day_of_week: fullDay,
        start_time: `${selectedSlot.time}:00`,
        end_time: `${Number.parseInt(selectedSlot.time.split(":")[0]) + 1}:00:00`,
        subject: formData.subject,
        faculty: formData.faculty,
        room: formData.room,
      }

      const res = await axios.post("https://namami-infotech.com/LIT/src/timetable/add_time_table.php", payload, {
        headers: {
          "Content-Type": "application/json",
        },
      })

      if (res.data && res.data.success) {
        setSnackbar({
          open: true,
          message: "Timetable entry saved successfully!",
          severity: "success",
        })
        fetchTimetable()
        setOpenDialog(false)
        setFormData({ subject: "", faculty: "", room: "" })
      } else {
        throw new Error(res.data?.message || "Failed to save timetable entry")
      }
    } catch (err) {
      console.error("Error saving timetable:", err)
      setSnackbar({
        open: true,
        message: err.response?.data?.message || err.message || "Failed to save timetable entry",
        severity: "error",
      })
    }
  }

  const handleDelete = async () => {
    try {
      const fullDay = FULL_DAYS[DAYS.indexOf(selectedSlot.day)]
      const existing = timetable.find(
        (item) => item.day_of_week === fullDay && item.start_time.startsWith(selectedSlot.time),
      )

      if (existing) {
        const res = await axios.delete("https://namami-infotech.com/LIT/src/timetable/delete_time_table.php", {
          data: { timetable_id: existing.timetable_id },
        })

        if (res.data && res.data.success) {
          setSnackbar({
            open: true,
            message: "Timetable entry deleted successfully!",
            severity: "success",
          })
          fetchTimetable()
          setOpenDialog(false)
        } else {
          throw new Error(res.data?.message || "Failed to delete timetable entry")
        }
      }
    } catch (err) {
      console.error("Error deleting timetable:", err)
      setSnackbar({
        open: true,
        message: err.message || "Failed to delete timetable entry",
        severity: "error",
      })
    }
  }

  return (
    <Box
    >
      {/* Header */}
      <Card
        sx={{
          mb: 1,
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
        }}
      >
        <CardContent sx={{ p: { xs: 1.5, md: 2 }, "&:last-child": { pb: { xs: 1.5, md: 2 } } }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center" gap={1}>
              <ScheduleIcon sx={{ color: "#667eea", fontSize: 28 }} />
              <Typography
                variant={isMobile ? "h5" : "h4"}
                sx={{
                  fontWeight: 700,
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  backgroundClip: "text",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                Timetable
              </Typography>
            </Box>

            <Box display="flex" gap={0.5}>
              <Tooltip title="Refresh">
                <IconButton
                  size="small"
                  onClick={fetchTimetable}
                  disabled={loading}
                  sx={{
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    color: "white",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                >
                  <RefreshIcon fontSize="small" className={loading ? "animate-spin" : ""} />
                </IconButton>
              </Tooltip>

              <Tooltip title="Filters">
                <IconButton
                  size="small"
                  onClick={() => setShowFilters(!showFilters)}
                  sx={{
                    background: showFilters ? "linear-gradient(45deg, #667eea, #764ba2)" : "rgba(0,0,0,0.1)",
                    color: showFilters ? "white" : "inherit",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                >
                  <FilterIcon fontSize="small" />
                </IconButton>
              </Tooltip>

              <Tooltip title="Export">
                <IconButton
                  size="small"
                  sx={{
                    background: "linear-gradient(45deg, #43e97b, #38f9d7)",
                    color: "white",
                    "&:hover": { transform: "scale(1.1)" },
                  }}
                >
                  <DownloadIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Fade in={showFilters}>
            <Box display="flex" gap={1} flexWrap="wrap">
              <Autocomplete
                size="small"
                options={COURSES}
                value={course}
                onChange={(_, val) => setCourse(val)}
                renderInput={(params) => (
                  <TextField {...params} label="Course" variant="outlined" sx={{ minWidth: 120 }} />
                )}
                disableClearable
              />

              <TextField
                size="small"
                label="Semester"
                select
                value={semester}
                onChange={(e) => setSemester(e.target.value)}
                sx={{ minWidth: 100 }}
              >
                {SEMESTERS.map((sem) => (
                  <MenuItem key={sem} value={sem.toString()}>
                    Sem {sem}
                  </MenuItem>
                ))}
              </TextField>

              <Chip
                label={`${course} - Sem ${semester}`}
                sx={{
                  background: "linear-gradient(45deg, #667eea, #764ba2)",
                  color: "white",
                  fontWeight: 600,
                }}
              />
            </Box>
          </Fade>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      <Card
        sx={{
          background: "rgba(255,255,255,0.95)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255,255,255,0.2)",
          overflow: "hidden",
        }}
      >
        <Box sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: { xs: 700, md: "auto" }, p: 1 }}>
            {/* Header Row */}
            <Grid container spacing={0.5} mb={0.5}>
              <Grid item xs={1.5}>
                <Paper
                  sx={{
                    p: 1,
                    textAlign: "center",
                    background: "linear-gradient(45deg, #667eea, #764ba2)",
                    color: "white",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                  }}
                >
                  Time
                </Paper>
              </Grid>
              {DAYS.map((day, index) => (
                <Grid item xs={1.5} key={day}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      background: `linear-gradient(45deg, ${subjectColors[index]}, ${subjectColors[index + 1] || subjectColors[0]})`,
                      color: "white",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                    }}
                  >
                    {day}
                  </Paper>
                </Grid>
              ))}
            </Grid>

            {/* Time Slots */}
            {TIME_SLOTS.map((time) => (
              <Grid container spacing={0.5} mb={0.5} key={time}>
                <Grid item xs={1.5}>
                  <Paper
                    sx={{
                      p: 1,
                      textAlign: "center",
                      backgroundColor: "rgba(102, 126, 234, 0.1)",
                      fontWeight: 500,
                      fontSize: "0.75rem",
                      minHeight: 48,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {time}
                  </Paper>
                </Grid>

                {DAYS.map((day) => {
                  const slot = getSlotContent(day, time)

                  return (
                    <Grid item xs={1.5} key={day}>
                      <Zoom in timeout={300}>
                        <Paper
                          sx={{
                            p: 0.5,
                            minHeight: 48,
                            cursor: "pointer",
                            background: slot
                              ? `linear-gradient(135deg, ${slot.color}dd, ${slot.color})`
                              : "rgba(0,0,0,0.02)",
                            border: slot ? "none" : "1px dashed rgba(0,0,0,0.1)",
                            color: slot ? "white" : "rgba(0,0,0,0.4)",
                            transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                            position: "relative",
                            overflow: "hidden",
                            "&:hover": {
                              transform: "translateY(-2px)",
                              boxShadow: slot ? `0 8px 25px ${slot.color}40` : "0 4px 15px rgba(0,0,0,0.1)",
                              "&::before": {
                                opacity: 1,
                              },
                            },
                            "&::before": {
                              content: '""',
                              position: "absolute",
                              top: 0,
                              left: 0,
                              right: 0,
                              bottom: 0,
                              background: "linear-gradient(45deg, rgba(255,255,255,0.2), transparent)",
                              opacity: 0,
                              transition: "opacity 0.3s ease",
                            },
                          }}
                          onClick={() => handleSlotClick(day, time)}
                        >
                          <Box position="relative" zIndex={1}>
                            {slot ? (
                              <Box textAlign="center">
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontWeight: 700,
                                    fontSize: "0.7rem",
                                    display: "block",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {slot.subject.length > 12 ? slot.subject.substring(0, 12) + "..." : slot.subject}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "0.6rem",
                                    opacity: 0.9,
                                    display: "block",
                                  }}
                                >
                                  {slot.faculty.length > 10 ? slot.faculty.substring(0, 10) + "..." : slot.faculty}
                                </Typography>
                                <Typography
                                  variant="caption"
                                  sx={{
                                    fontSize: "0.6rem",
                                    opacity: 0.8,
                                  }}
                                >
                                  {slot.room}
                                </Typography>
                              </Box>
                            ) : (
                              <Box
                                display="flex"
                                alignItems="center"
                                justifyContent="center"
                                height="100%"
                                minHeight={36}
                              >
                                <AddIcon sx={{ fontSize: 16, opacity: 0.5 }} />
                              </Box>
                            )}
                          </Box>
                        </Paper>
                      </Zoom>
                    </Grid>
                  )
                })}
              </Grid>
            ))}
          </Box>
        </Box>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => setOpenDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            background: "linear-gradient(135deg, rgba(255,255,255,0.95), rgba(255,255,255,0.9))",
            backdropFilter: "blur(10px)",
          },
        }}
      >
        <DialogTitle
          sx={{
            background: "linear-gradient(45deg, #667eea, #764ba2)",
            color: "white",
            p: 2,
          }}
        >
          <Box display="flex" alignItems="center" gap={1}>
            <SchoolIcon />
            <Typography variant="h6" fontWeight={600}>
              {getSlotContent(selectedSlot?.day, selectedSlot?.time) ? "Edit Class" : "Add Class"}
            </Typography>
          </Box>
          <IconButton
            onClick={() => setOpenDialog(false)}
            sx={{
              position: "absolute",
              right: 8,
              top: 8,
              color: "white",
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 2 }}>
          <Box mb={2}>
            <Chip
              label={`${selectedSlot?.day} at ${selectedSlot?.time}`}
              sx={{
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                color: "white",
                fontWeight: 600,
              }}
            />
          </Box>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                select
                label="Subject"
                name="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <SchoolIcon sx={{ mr: 1, color: "#667eea" }} />,
                }}
              >
                {subjects.map((subject) => (
                  <MenuItem key={subject} value={subject}>
                    {subject}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Professor Name"
                name="faculty"
                value={formData.faculty}
                onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <PersonIcon sx={{ mr: 1, color: "#667eea" }} />,
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                label="Room"
                name="room"
                value={formData.room}
                onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                fullWidth
                size="small"
                InputProps={{
                  startAdornment: <RoomIcon sx={{ mr: 1, color: "#667eea" }} />,
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ p: 2, gap: 1 }}>
          {getSlotContent(selectedSlot?.day, selectedSlot?.time) && (
            <Button onClick={handleDelete} variant="outlined" color="error" sx={{ borderRadius: 2 }}>
              Delete
            </Button>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button onClick={() => setOpenDialog(false)} variant="outlined" sx={{ borderRadius: 2 }}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!formData.subject || !formData.faculty}
            sx={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              borderRadius: 2,
              fontWeight: 600,
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert
          severity={snackbar.severity}
          sx={{
            borderRadius: 2,
            fontWeight: 500,
          }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  )
}

export default ModernTimeTableView