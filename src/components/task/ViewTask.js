import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  Grid,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Tooltip,
  Chip,
  Avatar,
  Drawer,
  Card,
  CardContent,
  Stack,
  useMediaQuery,
  DialogContentText,
  Divider,
  Alert,
  Snackbar,
  Badge,
  Autocomplete,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormLabel,
  InputAdornment,
  ListItem,
  ListItemAvatar,
  ListItemText,
  List,
  Tab,
  Tabs,
  AppBar,
  Toolbar,
  Container,
  Fade,
  Zoom,
  Slide,
  Grow,
} from "@mui/material";
import {
  Add,
  FilterAlt,
  Close,
  Delete,
  Edit,
  CheckCircle,
  Schedule,
  PriorityHigh,
  Sort,
  Menu as MenuIcon,
  ViewList,
  Update,
  MoreVert,
  CalendarToday,
  Person,
  Description,
  AssignmentInd,
  Group,
  PersonAdd,
  Search,
  Dashboard,
  Assignment,
  People,
  TrendingUp,
  AssignmentTurnedIn,
  HourglassEmpty,
  Warning,
  KeyboardArrowDown,
  KeyboardArrowUp,
  School,
  Book,
  Class,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import axios from "axios";
import { styled } from "@mui/material/styles";

// Styled components for professional look
const StyledTab = styled(Tab)(({ theme }) => ({
  textTransform: "none",
  fontWeight: 600,
  fontSize: "0.95rem",
  minHeight: 48,
  "&.Mui-selected": {
    color: theme.palette.primary.main,
  },
}));

const StatsCard = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
  transition: "transform 0.2s, box-shadow 0.2s",
  "&:hover": {
    transform: "translateY(-2px)",
    boxShadow: "0 6px 25px rgba(0,0,0,0.12)",
  },
}));

const TaskCardStyled = styled(Card)(({ theme }) => ({
  borderRadius: 16,
  boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
  transition: "all 0.2s",
  border: "1px solid rgba(0,0,0,0.04)",
  "&:hover": {
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
    borderColor: theme.palette.primary.light,
  },
}));

function ViewTask() {
  const { empId } = useParams();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(max-width:1024px)");

  // Tab state
  const [currentTab, setCurrentTab] = useState(0);

  // Data states
  const [personalTasks, setPersonalTasks] = useState([]);
  const [teamTasks, setTeamTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [teamMembers, setTeamMembers] = useState([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedBy: "",
    assignedTo: "",
  });

  // UI states
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [updateData, setUpdateData] = useState({
    status: "",
    remarks: "",
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: "",
    severity: "success",
  });
  const [expandedTask, setExpandedTask] = useState(null);

  // New task state
  const [newTask, setNewTask] = useState({
    Title: "",
    Description: "",
    Priority: "Medium",
    DueDate: "",
    Status: "Pending",
    assignedToType: "self", // "self", "team", "other"
    assignedToEmpId: "",
    assignedToName: "",
    assignedToTeam: "",
  });

  // Options
  const statusOptions = ["Pending", "In Progress", "Completed", "On Hold"];
  const priorityOptions = ["Low", "Medium", "High", "Critical"];

  useEffect(() => {
    if (empId) {
      fetchAllTasks();
      fetchTeamMembers();
    }
  }, [empId]);

  useEffect(() => {
    if (newTask.assignedToType !== "self") {
      fetchAllEmployees();
    }
  }, [newTask.assignedToType, empId]);

  const fetchAllTasks = async () => {
    setLoading(true);
    try {
      // Fetch personal tasks (assigned to self)
      const personalResponse = await axios.get(
        `https://namami-infotech.com/LIT/src/tasklist/get_task.php?empId=${empId}`,
      );

      // Fetch team tasks (assigned by HOD to team members)
      const teamResponse = await axios.get(
        `https://namami-infotech.com/LIT/src/tasklist/get_team_tasks.php?hodId=${empId}`,
      );

      if (personalResponse.data.success) {
        setPersonalTasks(personalResponse.data.tasks || []);
      }

      if (teamResponse.data.success) {
        setTeamTasks(teamResponse.data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      showSnackbar("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchAllEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=1`,
      );
      if (response.data.success) {
        setEmployees(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load employees:", err);
      showSnackbar("Failed to load employees list", "error");
    } finally {
      setLoadingEmployees(false);
    }
  };

  const fetchTeamMembers = async () => {
    setLoadingTeam(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/employee/list_employee_hod.php?Tenent_Id=1&EmpId=${empId}`,
      );
      if (response.data.success) {
        setTeamMembers(response.data.data || []);
      }
    } catch (err) {
      console.error("Failed to load team members:", err);
    } finally {
      setLoadingTeam(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setCurrentTab(newValue);
    resetFilters();
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTask = async () => {
    try {
      let assignedToEmpId, assignedToName, assignedByEmpId, assignedByName;

      switch (newTask.assignedToType) {
        case "self":
          assignedToEmpId = empId;
          assignedToName = "Self";
          assignedByEmpId = empId;
          assignedByName = "Self";
          break;

        case "team":
          // Assign to multiple team members - we'll handle this differently
          assignedToEmpId = "TEAM";
          assignedToName = "Team Members";
          assignedByEmpId = empId;
          assignedByName = "Self";
          break;

        case "other":
          assignedToEmpId = newTask.assignedToEmpId;
          assignedToName = newTask.assignedToName;
          assignedByEmpId = empId;
          assignedByName = "Self";
          break;

        default:
          assignedToEmpId = empId;
          assignedToName = "Self";
          assignedByEmpId = empId;
          assignedByName = "Self";
      }

      const taskPayload = {
        title: newTask.Title,
        description: newTask.Description,
        assignedToEmpId: assignedToEmpId,
        assignedToName: assignedToName,
        assignedByEmpId: assignedByEmpId,
        assignedByName: assignedByName,
        assignedByType: newTask.assignedToType === "team" ? "HOD" : "Self",
        priority: newTask.Priority,
        dueDate: newTask.DueDate,
        status: newTask.Status,
      };

      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/tasklist/create_task.php",
        taskPayload,
      );

      if (response.data.success) {
        fetchAllTasks();
        setOpenAddDialog(false);
        setNewTask({
          Title: "",
          Description: "",
          Priority: "Medium",
          DueDate: "",
          Status: "Pending",
          assignedToType: "self",
          assignedToEmpId: "",
          assignedToName: "",
          assignedToTeam: "",
        });
        showSnackbar("Task added successfully", "success");
      }
    } catch (err) {
      console.error("Failed to add task:", err);
      showSnackbar("Failed to add task", "error");
    }
  };

  const handleUpdateTask = async () => {
    if (!selectedTask) return;

    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/tasklist/task_action.php",
        {
          taskId: selectedTask.TaskId,
          status: updateData.status,
          remarks: updateData.remarks,
        },
      );

      if (response.data.success) {
        fetchAllTasks();
        setOpenUpdateDialog(false);
        setSelectedTask(null);
        setUpdateData({ status: "", remarks: "" });
        showSnackbar("Task updated successfully", "success");
      } else {
        showSnackbar(response.data.message || "Failed to update task", "error");
      }
    } catch (err) {
      console.error("Failed to update task:", err);
      showSnackbar("Failed to update task", "error");
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const openUpdateModal = (task) => {
    setSelectedTask(task);
    setUpdateData({
      status: task.Status,
      remarks: "",
    });
    setOpenUpdateDialog(true);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "Critical":
        return "error";
      case "High":
        return "warning";
      case "Medium":
        return "info";
      case "Low":
        return "success";
      default:
        return "default";
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Completed":
        return "success";
      case "In Progress":
        return "info";
      case "Pending":
        return "warning";
      case "On Hold":
        return "error";
      default:
        return "default";
    }
  };

  const getTasksForCurrentTab = () => {
    return currentTab === 0 ? personalTasks : teamTasks;
  };

  const filteredTasks = getTasksForCurrentTab().filter((task) => {
    return (
      (filters.status === "" || task.Status === filters.status) &&
      (filters.priority === "" || task.Priority === filters.priority) &&
      (filters.assignedBy === "" ||
        task.AssignedByName === filters.assignedBy) &&
      (filters.assignedTo === "" || task.AssignedToName === filters.assignedTo)
    );
  });

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      assignedBy: "",
      assignedTo: "",
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "No due date";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      ...(date.getFullYear() !== new Date().getFullYear() && {
        year: "numeric",
      }),
    });
  };

  const isOverdue = (dueDate) => {
    if (!dueDate) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate);
    due.setHours(0, 0, 0, 0);
    return due < today;
  };

  const getTaskStats = (tasks) => {
    return {
      total: tasks.length,
      completed: tasks.filter((t) => t.Status === "Completed").length,
      inProgress: tasks.filter((t) => t.Status === "In Progress").length,
      pending: tasks.filter((t) => t.Status === "Pending").length,
      onHold: tasks.filter((t) => t.Status === "On Hold").length,
      overdue: tasks.filter(
        (t) => isOverdue(t.DueDate) && t.Status !== "Completed",
      ).length,
    };
  };

  const personalStats = getTaskStats(personalTasks);
  const teamStats = getTaskStats(teamTasks);

  // Professional Task Card Component
  const ProfessionalTaskCard = ({ task, onUpdate }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <TaskCardStyled>
        <CardContent sx={{ p: 2 }}>
          {/* Header */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box
              sx={{ display: "flex", alignItems: "center", gap: 1, flex: 1 }}
            >
              <Avatar
                sx={{
                  width: 40,
                  height: 40,
                  bgcolor: task.Priority === "Critical" ? "#d32f2f" : "#CC7A00",
                  fontSize: "1rem",
                }}
              >
                {task.Title?.charAt(0)}
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography
                  variant="subtitle1"
                  sx={{ fontWeight: 600, lineHeight: 1.2 }}
                >
                  {task.Title}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Task ID: {task.TaskId}
                </Typography>
              </Box>
            </Box>
            <IconButton size="small" onClick={() => setExpanded(!expanded)}>
              {expanded ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
            </IconButton>
          </Box>

          {/* Quick Info */}
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mb: 1.5 }}>
            <Chip
              label={task.Priority}
              color={getPriorityColor(task.Priority)}
              size="small"
              sx={{ height: 24, fontSize: "0.75rem" }}
            />
            <Chip
              label={task.Status}
              color={getStatusColor(task.Status)}
              size="small"
              sx={{ height: 24, fontSize: "0.75rem" }}
            />
            {isOverdue(task.DueDate) && task.Status !== "Completed" && (
              <Chip
                icon={<Warning sx={{ fontSize: 14 }} />}
                label="Overdue"
                size="small"
                color="error"
                sx={{ height: 24, fontSize: "0.75rem" }}
              />
            )}
          </Box>

          {/* Due Date */}
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              mb: 1.5,
              p: 1,
              bgcolor: "#f8f9fa",
              borderRadius: 2,
            }}
          >
            <CalendarToday sx={{ fontSize: 16, color: "text.secondary" }} />
            <Typography
              variant="body2"
              sx={{
                color: isOverdue(task.DueDate) ? "error.main" : "text.primary",
                fontWeight: isOverdue(task.DueDate) ? 600 : 400,
              }}
            >
              Due: {formatDate(task.DueDate)}
            </Typography>
          </Box>

          {/* Assignment Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Person sx={{ fontSize: 16, color: "text.secondary" }} />
              <Typography variant="body2" color="text.secondary">
                By: {task.AssignedByName}
              </Typography>
            </Box>
            {task.AssignedToName && task.AssignedToName !== "Self" && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Group sx={{ fontSize: 16, color: "text.secondary" }} />
                <Typography variant="body2" color="text.secondary">
                  To: {task.AssignedToName}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Expandable Content */}
          <Collapse in={expanded}>
            <Box sx={{ mt: 2 }}>
              {task.Description && (
                <Paper
                  variant="outlined"
                  sx={{ p: 1.5, mb: 2, bgcolor: "#fafafa" }}
                >
                  <Typography variant="body2" color="text.secondary">
                    {task.Description}
                  </Typography>
                </Paper>
              )}

              <Box sx={{ display: "flex", gap: 1 }}>
                <Button
                  fullWidth
                  variant="contained"
                  size="small"
                  startIcon={<Update />}
                  onClick={() => onUpdate(task)}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  Update Status
                </Button>
              </Box>
            </Box>
          </Collapse>

          {/* Action Button (when not expanded) */}
          {!expanded && (
            <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
              <Button
                size="small"
                startIcon={<Update />}
                onClick={() => onUpdate(task)}
                sx={{ color: "#1976d2" }}
              >
                Update
              </Button>
            </Box>
          )}
        </CardContent>
      </TaskCardStyled>
    );
  };

  // Statistics Cards Component
  const StatisticsCards = ({ stats, title }) => (
    <Grid container spacing={2} sx={{ mb: 3 }}>
      <Grid item xs={6} sm={4} md={2}>
        <StatsCard>
          <CardContent sx={{ textAlign: "center", p: 2 }}>
            <Assignment sx={{ fontSize: 32, color: "#1976d2", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.total}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Total Tasks
            </Typography>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={6} sm={4} md={2}>
        <StatsCard>
          <CardContent sx={{ textAlign: "center", p: 2 }}>
            <AssignmentTurnedIn
              sx={{ fontSize: 32, color: "#2e7d32", mb: 1 }}
            />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.completed}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Completed
            </Typography>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={6} sm={4} md={2}>
        <StatsCard>
          <CardContent sx={{ textAlign: "center", p: 2 }}>
            <HourglassEmpty sx={{ fontSize: 32, color: "#ed6c02", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.inProgress}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In Progress
            </Typography>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={6} sm={4} md={2}>
        <StatsCard>
          <CardContent sx={{ textAlign: "center", p: 2 }}>
            <Schedule sx={{ fontSize: 32, color: "#9c27b0", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.pending}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Pending
            </Typography>
          </CardContent>
        </StatsCard>
      </Grid>

      <Grid item xs={6} sm={4} md={2}>
        <StatsCard>
          <CardContent sx={{ textAlign: "center", p: 2 }}>
            <Warning sx={{ fontSize: 32, color: "#d32f2f", mb: 1 }} />
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              {stats.overdue}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Overdue
            </Typography>
          </CardContent>
        </StatsCard>
      </Grid>
    </Grid>
  );

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "#f5f7fa",
      }}
    >
      {/* App Bar for Mobile */}
      {isMobile && (
        <AppBar
          position="sticky"
          color="default"
          elevation={0}
          sx={{
            bgcolor: "white",
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            <Typography
              variant="h6"
              sx={{ flex: 1, fontWeight: 600, color: "#333" }}
            >
              Task Manager
            </Typography>
            <Badge badgeContent={filteredTasks.length} color="primary">
              <Assignment />
            </Badge>
          </Toolbar>
        </AppBar>
      )}

      <Container maxWidth="xl" sx={{ py: isMobile ? 2 : 3 }}>
        {/* Tabs */}
        <Paper
          elevation={0}
          sx={{
            mb: 3,
            borderRadius: 2,
            overflow: "hidden",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Tabs
            value={currentTab}
            onChange={handleTabChange}
            variant={isMobile ? "fullWidth" : "standard"}
            indicatorColor="primary"
            textColor="primary"
            sx={{
              bgcolor: "white",
              "& .MuiTab-root": {
                py: 2,
              },
            }}
          >
            <StyledTab
              icon={<Person />}
              iconPosition="start"
              label="My Tasks"
              sx={{ fontSize: isMobile ? "0.85rem" : "0.95rem" }}
            />
            <StyledTab
              icon={<Group />}
              iconPosition="start"
              label="Team Tasks"
              sx={{ fontSize: isMobile ? "0.85rem" : "0.95rem" }}
            />
          </Tabs>
        </Paper>

        {/* Statistics */}
        <Fade in timeout={500}>
          <Box>
            <StatisticsCards
              stats={currentTab === 0 ? personalStats : teamStats}
              title={currentTab === 0 ? "Personal Tasks" : "Team Tasks"}
            />
          </Box>
        </Fade>

        {/* Header Section */}
        <Paper
          elevation={0}
          sx={{
            p: isMobile ? 2 : 3,
            mb: 3,
            borderRadius: 2,
            bgcolor: "white",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Box
            sx={{
              display: "flex",
              flexDirection: isMobile ? "column" : "row",
              justifyContent: "space-between",
              alignItems: isMobile ? "stretch" : "center",
              gap: isMobile ? 2 : 0,
            }}
          >
            <Box>
              <Typography
                variant={isMobile ? "h6" : "h5"}
                sx={{ fontWeight: 700, color: "#333", mb: 0.5 }}
              >
                {currentTab === 0 ? "My Tasks" : "Team Tasks"}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {currentTab === 0
                  ? "Tasks assigned to you"
                  : "Tasks assigned to your team members"}
              </Typography>
            </Box>

            {/* Desktop Controls */}
            {!isMobile && (
              <Stack direction="row" spacing={2} alignItems="center">
                <Button
                  variant="outlined"
                  startIcon={<FilterAlt />}
                  onClick={() => setOpenFilterDrawer(true)}
                >
                  Filters
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenAddDialog(true)}
                  sx={{
                    bgcolor: "#1976d2",
                    "&:hover": { bgcolor: "#1565c0" },
                  }}
                >
                  Add Task
                </Button>
              </Stack>
            )}

            {/* Mobile Controls */}
            {isMobile && (
              <Stack direction="row" spacing={1}>
                <Button
                  variant="outlined"
                  startIcon={<FilterAlt />}
                  onClick={() => setOpenFilterDrawer(true)}
                  fullWidth
                  size="small"
                >
                  Filter
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenAddDialog(true)}
                  fullWidth
                  size="small"
                >
                  Add
                </Button>
              </Stack>
            )}
          </Box>

          {/* Active Filters Display */}
          {Object.values(filters).some((f) => f !== "") && (
            <Box
              sx={{
                mt: 2,
                pt: 2,
                borderTop: "1px solid",
                borderColor: "divider",
                display: "flex",
                gap: 1,
                flexWrap: "wrap",
              }}
            >
              {filters.status && (
                <Chip
                  label={`Status: ${filters.status}`}
                  size="small"
                  onDelete={() => setFilters({ ...filters, status: "" })}
                  sx={{ height: 28 }}
                />
              )}
              {filters.priority && (
                <Chip
                  label={`Priority: ${filters.priority}`}
                  size="small"
                  onDelete={() => setFilters({ ...filters, priority: "" })}
                  sx={{ height: 28 }}
                />
              )}
              {filters.assignedTo && (
                <Chip
                  label={`Assigned To: ${filters.assignedTo}`}
                  size="small"
                  onDelete={() => setFilters({ ...filters, assignedTo: "" })}
                  sx={{ height: 28 }}
                />
              )}
              <Button size="small" onClick={resetFilters} sx={{ ml: "auto" }}>
                Clear All
              </Button>
            </Box>
          )}
        </Paper>

        {/* Filter Drawer */}
        <Drawer
          anchor={isMobile ? "bottom" : "right"}
          open={openFilterDrawer}
          onClose={() => setOpenFilterDrawer(false)}
          PaperProps={{
            sx: {
              width: isMobile ? "100%" : 320,
              maxHeight: isMobile ? "80vh" : "100%",
              borderTopLeftRadius: isMobile ? 20 : 0,
              borderTopRightRadius: isMobile ? 20 : 0,
            },
          }}
        >
          <Box sx={{ p: 3 }}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                mb: 3,
              }}
            >
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                Filter Tasks
              </Typography>
              <IconButton onClick={() => setOpenFilterDrawer(false)}>
                <Close />
              </IconButton>
            </Box>

            <Stack spacing={2.5}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={filters.status}
                  onChange={handleFilterChange}
                  label="Status"
                >
                  <MenuItem value="">All Status</MenuItem>
                  {statusOptions.map((status) => (
                    <MenuItem key={status} value={status}>
                      {status}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  name="priority"
                  value={filters.priority}
                  onChange={handleFilterChange}
                  label="Priority"
                >
                  <MenuItem value="">All Priority</MenuItem>
                  {priorityOptions.map((priority) => (
                    <MenuItem key={priority} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {currentTab === 1 && (
                <FormControl fullWidth size="small">
                  <InputLabel>Assigned To</InputLabel>
                  <Select
                    name="assignedTo"
                    value={filters.assignedTo}
                    onChange={handleFilterChange}
                    label="Assigned To"
                  >
                    <MenuItem value="">All Members</MenuItem>
                    {teamMembers.map((member) => (
                      <MenuItem key={member.EmpId} value={member.Name}>
                        {member.Name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              <Button
                variant="contained"
                onClick={() => setOpenFilterDrawer(false)}
                sx={{ mt: 2 }}
              >
                Apply Filters
              </Button>

              <Button variant="text" onClick={resetFilters}>
                Reset Filters
              </Button>
            </Stack>
          </Box>
        </Drawer>

        {/* Tasks List */}
        <Fade in timeout={800}>
          <Box>
            {loading ? (
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  minHeight: 300,
                }}
              >
                <CircularProgress />
              </Box>
            ) : filteredTasks.length === 0 ? (
              <Paper
                sx={{
                  p: 6,
                  textAlign: "center",
                  borderRadius: 4,
                  bgcolor: "white",
                }}
              >
                <Assignment sx={{ fontSize: 80, color: "#e0e0e0", mb: 2 }} />
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                  No Tasks Found
                </Typography>
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mb: 3 }}
                >
                  {Object.values(filters).some((f) => f !== "")
                    ? "Try adjusting your filters"
                    : currentTab === 0
                      ? "You don't have any tasks yet"
                      : "No team tasks available"}
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<Add />}
                  onClick={() => setOpenAddDialog(true)}
                >
                  Create New Task
                </Button>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {filteredTasks.map((task) => (
                  <Grid item xs={12} key={task.TaskId}>
                    <Grow in timeout={500}>
                      <Box>
                        <ProfessionalTaskCard
                          task={task}
                          onUpdate={openUpdateModal}
                        />
                      </Box>
                    </Grow>
                  </Grid>
                ))}
              </Grid>
            )}
          </Box>
        </Fade>

        {/* Add Task Dialog */}
        <Dialog
          open={openAddDialog}
          onClose={() => setOpenAddDialog(false)}
          maxWidth="md"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "primary.main",
              color: "white",
              py: 2,
              px: 3,
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Add />
              Create New Task
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Task Title"
                  value={newTask.Title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Title: e.target.value })
                  }
                  required
                  variant="outlined"
                  placeholder="Enter task title"
                  sx={{ mt: 1 }}
                />
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Description"
                  value={newTask.Description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Description: e.target.value })
                  }
                  multiline
                  rows={3}
                  variant="outlined"
                  placeholder="Enter task description (optional)"
                />
              </Grid>

              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormLabel component="legend" sx={{ mb: 1 }}>
                    Assign To
                  </FormLabel>
                  <RadioGroup
                    row={!isMobile}
                    value={newTask.assignedToType}
                    onChange={(e) => {
                      setNewTask({
                        ...newTask,
                        assignedToType: e.target.value,
                        assignedToEmpId: "",
                        assignedToName: "",
                      });
                    }}
                  >
                    <FormControlLabel
                      value="self"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Person fontSize="small" />
                          <Typography>Assign to Self</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="team"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Group fontSize="small" />
                          <Typography>Assign to Team</Typography>
                        </Box>
                      }
                    />
                    <FormControlLabel
                      value="other"
                      control={<Radio />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <PersonAdd fontSize="small" />
                          <Typography>Assign to Specific Person</Typography>
                        </Box>
                      }
                    />
                  </RadioGroup>
                </FormControl>
              </Grid>

              {newTask.assignedToType === "team" && (
                <Grid item xs={12}>
                  <Alert severity="info" sx={{ mb: 2 }}>
                    This task will be assigned to all team members
                  </Alert>
                  <Box
                    sx={{
                      maxHeight: 200,
                      overflow: "auto",
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 1,
                      p: 1,
                    }}
                  >
                    <List dense>
                      {teamMembers.map((member) => (
                        <ListItem key={member.EmpId}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "#CC7A00" }}>
                              {member.Name?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={member.Name}
                            secondary={`${member.EmpId} • ${member.Designation || "Team Member"}`}
                          />
                        </ListItem>
                      ))}
                    </List>
                  </Box>
                </Grid>
              )}

              {newTask.assignedToType === "other" && (
                <Grid item xs={12}>
                  {loadingEmployees ? (
                    <Box
                      sx={{ display: "flex", justifyContent: "center", py: 2 }}
                    >
                      <CircularProgress size={24} />
                    </Box>
                  ) : (
                    <Autocomplete
                      fullWidth
                      options={employees}
                      getOptionLabel={(option) =>
                        typeof option === "string"
                          ? option
                          : `${option.Name} (${option.EmpId})`
                      }
                      value={
                        employees.find(
                          (emp) => emp.EmpId === newTask.assignedToEmpId,
                        ) || null
                      }
                      onChange={(event, newValue) => {
                        setNewTask({
                          ...newTask,
                          assignedToEmpId: newValue?.EmpId || "",
                          assignedToName: newValue?.Name || "",
                        });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="Select Employee"
                          required
                          placeholder="Search by name or ID"
                          InputProps={{
                            ...params.InputProps,
                            startAdornment: (
                              <>
                                <InputAdornment position="start">
                                  <Search />
                                </InputAdornment>
                                {params.InputProps.startAdornment}
                              </>
                            ),
                          }}
                        />
                      )}
                      renderOption={(props, option) => (
                        <ListItem {...props}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: "#CC7A00" }}>
                              {option.Name?.charAt(0)}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={option.Name}
                            secondary={
                              <>
                                <Typography component="span" variant="body2">
                                  {option.EmpId}
                                </Typography>
                                {option.Designation &&
                                  ` • ${option.Designation}`}
                              </>
                            }
                          />
                        </ListItem>
                      )}
                      loading={loadingEmployees}
                      noOptionsText="No employees found"
                    />
                  )}
                </Grid>
              )}

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    value={newTask.Priority}
                    onChange={(e) =>
                      setNewTask({ ...newTask, Priority: e.target.value })
                    }
                    label="Priority"
                  >
                    {priorityOptions.map((priority) => (
                      <MenuItem key={priority} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={newTask.Status}
                    onChange={(e) =>
                      setNewTask({ ...newTask, Status: e.target.value })
                    }
                    label="Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Due Date"
                  type="date"
                  value={newTask.DueDate}
                  onChange={(e) =>
                    setNewTask({ ...newTask, DueDate: e.target.value })
                  }
                  InputLabelProps={{ shrink: true }}
                  inputProps={{
                    min: new Date().toISOString().split("T")[0],
                  }}
                />
              </Grid>
            </Grid>
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={() => setOpenAddDialog(false)}
              variant="outlined"
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAddTask}
              variant="contained"
              disabled={
                !newTask.Title ||
                (newTask.assignedToType === "other" && !newTask.assignedToEmpId)
              }
              fullWidth={isMobile}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
              }}
            >
              Create Task
            </Button>
          </DialogActions>
        </Dialog>

        {/* Update Task Dialog */}
        <Dialog
          open={openUpdateDialog}
          onClose={() => setOpenUpdateDialog(false)}
          maxWidth="sm"
          fullWidth
          fullScreen={isMobile}
          PaperProps={{
            sx: {
              borderRadius: isMobile ? 0 : 3,
            },
          }}
        >
          <DialogTitle
            sx={{
              bgcolor: "#1976d2",
              color: "white",
              py: 2,
              px: 3,
              fontSize: "1.25rem",
              fontWeight: 600,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Update />
              Update Task Status
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 3 }}>
            {selectedTask && (
              <Stack spacing={3}>
                <Paper
                  variant="outlined"
                  sx={{ p: 2, bgcolor: "#f8f9fa", borderRadius: 2 }}
                >
                  <Typography
                    variant="subtitle1"
                    sx={{ fontWeight: 600, mb: 1 }}
                  >
                    {selectedTask.Title}
                  </Typography>
                  {selectedTask.Description && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 2 }}
                    >
                      {selectedTask.Description}
                    </Typography>
                  )}
                  <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                    <Chip
                      label={selectedTask.Priority}
                      color={getPriorityColor(selectedTask.Priority)}
                      size="small"
                    />
                    <Chip
                      label={selectedTask.Status}
                      color={getStatusColor(selectedTask.Status)}
                      size="small"
                    />
                    <Chip
                      icon={<CalendarToday />}
                      label={`Due: ${formatDate(selectedTask.DueDate)}`}
                      size="small"
                      variant="outlined"
                    />
                  </Box>
                </Paper>

                <FormControl fullWidth>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={updateData.status}
                    onChange={(e) =>
                      setUpdateData({ ...updateData, status: e.target.value })
                    }
                    label="New Status"
                  >
                    {statusOptions.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Remarks (Optional)"
                  value={updateData.remarks}
                  onChange={(e) =>
                    setUpdateData({ ...updateData, remarks: e.target.value })
                  }
                  multiline
                  rows={3}
                  placeholder="Add any comments about the status update..."
                />
              </Stack>
            )}
          </DialogContent>

          <DialogActions sx={{ p: 3, gap: 1 }}>
            <Button
              onClick={() => setOpenUpdateDialog(false)}
              variant="outlined"
              fullWidth={isMobile}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateTask}
              variant="contained"
              disabled={!updateData.status}
              fullWidth={isMobile}
              sx={{
                bgcolor: "#1976d2",
                "&:hover": { bgcolor: "#1565c0" },
              }}
            >
              Update Status
            </Button>
          </DialogActions>
        </Dialog>

        {/* Snackbar */}
        <Snackbar
          open={snackbar.open}
          autoHideDuration={4000}
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
        >
          <Alert
            onClose={() => setSnackbar({ ...snackbar, open: false })}
            severity={snackbar.severity}
            sx={{ width: "100%" }}
          >
            {snackbar.message}
          </Alert>
        </Snackbar>
      </Container>
    </Box>
  );
}

// Collapse component for expandable content
function Collapse({ in: inProp, children }) {
  return (
    <Box
      sx={{
        display: inProp ? "block" : "none",
        animation: inProp ? "fadeIn 0.3s ease-in" : "none",
        "@keyframes fadeIn": {
          from: { opacity: 0, transform: "translateY(-10px)" },
          to: { opacity: 1, transform: "translateY(0)" },
        },
      }}
    >
      {children}
    </Box>
  );
}

export default ViewTask;
