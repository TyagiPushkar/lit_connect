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
  Fab,
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
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewTask() {
  const { empId } = useParams();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(max-width:1024px)");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedBy: "",
  });
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

  const [newTask, setNewTask] = useState({
    Title: "",
    Description: "",
    Priority: "Medium",
    DueDate: "",
    Status: "Pending",
    assignedToType: "self", // "self" or "other"
    assignedToEmpId: "",
    assignedToName: "",
  });

  // Extract unique values for filters
  const statusOptions = ["Pending", "In Progress", "Completed", "On Hold"];
  const priorityOptions = ["Low", "Medium", "High", "Critical"];
  const assignedByOptions = [
    ...new Set(tasks.map((task) => task.AssignedByName)),
  ];

  useEffect(() => {
    if (empId) {
      fetchTasks();
    }
  }, [empId]);

  useEffect(() => {
    if (newTask.assignedToType === "other" && empId) {
      fetchEmployees();
    }
  }, [newTask.assignedToType, empId]);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/tasklist/get_task.php?empId=${empId}`,
      );
      if (response.data.success) {
        setTasks(response.data.tasks || []);
      }
    } catch (err) {
      console.error("Failed to load tasks:", err);
      showSnackbar("Failed to load tasks", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/employee/list_employee_hod.php?Tenent_Id=1&EmpId=${empId}`,
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

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleAddTask = async () => {
    try {
      let assignedToEmpId,
        assignedToName,
        assignedByEmpId,
        assignedByName,
        assignedByType;

      if (newTask.assignedToType === "self") {
        // Self assignment
        assignedToEmpId = empId;
        assignedToName = "Self";
        assignedByEmpId = empId;
        assignedByName = "Self";
        assignedByType = "Self";
      } else {
        // Assign to other employee
        assignedToEmpId = newTask.assignedToEmpId;
        assignedToName = newTask.assignedToName;
        assignedByEmpId = empId;
        assignedByName = "Self";
        assignedByType = "HOD";
      }

      const taskPayload = {
        title: newTask.Title,
        description: newTask.Description,
        assignedToEmpId: assignedToEmpId,
        assignedToName: assignedToName,
        assignedByEmpId: assignedByEmpId,
        assignedByName: assignedByName,
        assignedByType: assignedByType,
        priority: newTask.Priority,
        dueDate: newTask.DueDate,
        status: newTask.Status,
      };

      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/tasklist/create_task.php",
        taskPayload,
      );

      if (response.data.success) {
        fetchTasks();
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
        fetchTasks();
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

  const filteredTasks = tasks.filter((task) => {
    return (
      (filters.status === "" || task.Status === filters.status) &&
      (filters.priority === "" || task.Priority === filters.priority) &&
      (filters.assignedBy === "" || task.AssignedByName === filters.assignedBy)
    );
  });

  const resetFilters = () => {
    setFilters({
      status: "",
      priority: "",
      assignedBy: "",
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

  // Optimized Mobile Task Card Component
  const TaskCard = ({ task }) => (
    <Card
      sx={{
        mb: 1.5,
        borderRadius: 2,
        position: "relative",
        overflow: "visible",
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        "&:active": {
          backgroundColor: "#f5f5f5",
        },
      }}
    >
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        {/* Header with Title and Status */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            mb: 1,
          }}
        >
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 600,
              fontSize: "0.95rem",
              lineHeight: 1.3,
              pr: 1,
              wordBreak: "break-word",
            }}
          >
            {task.Title}
          </Typography>
          <Chip
            label={task.Status}
            color={getStatusColor(task.Status)}
            size="small"
            sx={{
              height: 24,
              fontSize: "0.7rem",
              flexShrink: 0,
            }}
          />
        </Box>

        {/* Description (if exists) */}
        {task.Description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              fontSize: "0.8rem",
              mb: 1.5,
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              lineHeight: 1.3,
            }}
          >
            {task.Description}
          </Typography>
        )}

        {/* Details Row */}
        <Stack
          direction="row"
          spacing={1}
          alignItems="center"
          sx={{ mb: 1.5, flexWrap: "wrap", gap: 0.5 }}
        >
          <Chip
            label={task.Priority}
            color={getPriorityColor(task.Priority)}
            size="small"
            sx={{
              height: 22,
              fontSize: "0.7rem",
            }}
          />

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Avatar
              sx={{
                width: 22,
                height: 22,
                bgcolor: "#CC7A00",
                fontSize: "0.7rem",
              }}
            >
              {task.AssignedByName?.charAt(0) || "?"}
            </Avatar>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              {task.AssignedByName === "Self" ? "Self" : task.AssignedByName}
            </Typography>
          </Box>

          {task.AssignedToName && task.AssignedToName !== "Self" && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <AssignmentInd sx={{ fontSize: 14, color: "action.active" }} />
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.7rem" }}
              >
                to: {task.AssignedToName}
              </Typography>
            </Box>
          )}
        </Stack>

        {/* Footer with Dates and Actions */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1,
              flexWrap: "wrap",
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <Schedule
                sx={{
                  fontSize: 14,
                  color: isOverdue(task.DueDate)
                    ? "error.main"
                    : "action.active",
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  fontSize: "0.7rem",
                  color: isOverdue(task.DueDate)
                    ? "error.main"
                    : "text.secondary",
                  fontWeight: isOverdue(task.DueDate) ? 500 : 400,
                }}
              >
                {formatDate(task.DueDate)}
              </Typography>
            </Box>
            {isOverdue(task.DueDate) && task.Status !== "Completed" && (
              <Chip
                label="Overdue"
                size="small"
                color="error"
                sx={{ height: 18, fontSize: "0.6rem" }}
              />
            )}
          </Box>

          <IconButton
            size="small"
            onClick={() => openUpdateModal(task)}
            sx={{
              p: 0.5,
              backgroundColor: "#f0f0f0",
              "&:hover": { backgroundColor: "#e0e0e0" },
            }}
          >
            <Update sx={{ fontSize: 16 }} />
          </IconButton>
        </Box>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        p: isMobile ? 1 : 2,
        maxWidth: "100%",
        overflowX: "hidden",
        backgroundColor: "#f5f5f5",
        minHeight: "100vh",
      }}
    >
      {/* Header Section */}
      <Paper
        elevation={0}
        sx={{
          p: isMobile ? 1.5 : 2,
          mb: 2,
          borderRadius: 2,
          backgroundColor: "white",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: isMobile ? "column" : "row",
            justifyContent: "space-between",
            alignItems: isMobile ? "stretch" : "center",
            gap: isMobile ? 1.5 : 0,
          }}
        >
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Typography
              variant={isMobile ? "h6" : "h5"}
              sx={{
                fontWeight: "bold",
                color: "#333",
              }}
            >
              Task List
            </Typography>
            <Badge
              badgeContent={filteredTasks.length}
              color="primary"
              sx={{ display: { xs: "block", sm: "none" } }}
            >
              <ViewList />
            </Badge>
          </Box>

          {/* Filter Controls */}
          {!isMobile ? (
            <Stack direction="row" spacing={2} alignItems="center">
              <Stack direction="row" spacing={1} alignItems="center">
                <Tooltip title="Filters">
                  <FilterAlt color="action" />
                </Tooltip>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    name="status"
                    value={filters.status}
                    onChange={handleFilterChange}
                    label="Status"
                    size="small"
                  >
                    <MenuItem value="">All</MenuItem>
                    {statusOptions.map((status, index) => (
                      <MenuItem key={index} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={filters.priority}
                    onChange={handleFilterChange}
                    label="Priority"
                    size="small"
                  >
                    <MenuItem value="">All</MenuItem>
                    {priorityOptions.map((priority, index) => (
                      <MenuItem key={index} value={priority}>
                        {priority}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button
                  size="small"
                  variant="outlined"
                  onClick={resetFilters}
                  startIcon={<Close />}
                >
                  Reset
                </Button>
              </Stack>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenAddDialog(true)}
                sx={{
                  backgroundColor: "#1976d2",
                  "&:hover": { backgroundColor: "#1565c0" },
                }}
              >
                Add Task
              </Button>
            </Stack>
          ) : (
            // Mobile Header Controls
            <Stack direction="row" spacing={1}>
              <Button
                variant="outlined"
                startIcon={<FilterAlt />}
                onClick={() => setOpenFilterDrawer(true)}
                fullWidth
                size="small"
                sx={{
                  py: 1,
                  borderColor: "#ddd",
                  color: "#666",
                }}
              >
                Filters
              </Button>

              <Button
                variant="contained"
                startIcon={<Add />}
                onClick={() => setOpenAddDialog(true)}
                fullWidth
                size="small"
                sx={{ py: 1 }}
              >
                Add
              </Button>
            </Stack>
          )}
        </Box>

        {/* Active Filters Display for Mobile */}
        {isMobile && Object.values(filters).some((f) => f !== "") && (
          <Box sx={{ mt: 1.5, display: "flex", gap: 0.5, flexWrap: "wrap" }}>
            {filters.status && (
              <Chip
                label={`Status: ${filters.status}`}
                size="small"
                onDelete={() => setFilters({ ...filters, status: "" })}
                sx={{ height: 24 }}
              />
            )}
            {filters.priority && (
              <Chip
                label={`Priority: ${filters.priority}`}
                size="small"
                onDelete={() => setFilters({ ...filters, priority: "" })}
                sx={{ height: 24 }}
              />
            )}
          </Box>
        )}
      </Paper>

      {/* Filter Drawer for Mobile */}
      <Drawer
        anchor="bottom"
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
            maxHeight: "80vh",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Filters
            </Typography>
            <IconButton onClick={() => setOpenFilterDrawer(false)} size="small">
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                name="status"
                value={filters.status}
                onChange={handleFilterChange}
                label="Status"
              >
                <MenuItem value="">All Status</MenuItem>
                {statusOptions.map((status, index) => (
                  <MenuItem key={index} value={status}>
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
                <MenuItem value="">All Priorities</MenuItem>
                {priorityOptions.map((priority, index) => (
                  <MenuItem key={index} value={priority}>
                    {priority}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            {assignedByOptions.length > 0 && (
              <FormControl fullWidth size="small">
                <InputLabel>Assigned By</InputLabel>
                <Select
                  name="assignedBy"
                  value={filters.assignedBy}
                  onChange={handleFilterChange}
                  label="Assigned By"
                >
                  <MenuItem value="">All</MenuItem>
                  {assignedByOptions.map((name, index) => (
                    <MenuItem key={index} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            )}

            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  resetFilters();
                  setOpenFilterDrawer(false);
                }}
                fullWidth
                size="small"
              >
                Clear All
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpenFilterDrawer(false)}
                fullWidth
                size="small"
              >
                Apply
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Drawer>

      {/* Loading State */}
      {loading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="200px"
        >
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Task Count */}
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ mb: 1, display: "block" }}
          >
            Showing {filteredTasks.length} of {tasks.length} tasks
          </Typography>

          {/* Tasks Display - Cards for Mobile, Table for Desktop */}
          {isMobile || isTablet ? (
            // Mobile/Tablet Card View
            <Box>
              {filteredTasks.length === 0 ? (
                <Paper
                  sx={{
                    p: 3,
                    textAlign: "center",
                    borderRadius: 2,
                    backgroundColor: "white",
                  }}
                >
                  <FilterAlt
                    sx={{ fontSize: 40, mb: 1, opacity: 0.5, color: "#999" }}
                  />
                  <Typography
                    variant="body1"
                    gutterBottom
                    sx={{ fontWeight: 500 }}
                  >
                    No tasks found
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {Object.values(filters).some((f) => f !== "")
                      ? "Try changing your filters"
                      : "No tasks available"}
                  </Typography>
                </Paper>
              ) : (
                filteredTasks.map((task) => (
                  <TaskCard key={task.TaskId} task={task} />
                ))
              )}
            </Box>
          ) : (
            // Desktop Table View
            <TableContainer
              component={Paper}
              elevation={2}
              sx={{
                borderRadius: 2,
                overflow: "hidden",
              }}
            >
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: "#CC7A00" }}>
                    {[
                      "ID",
                      "Title",
                      "Description",
                      "Priority",
                      "Status",
                      "Due Date",
                      "Assigned By/To",
                      "Created",
                      "Actions",
                    ].map((header) => (
                      <TableCell
                        key={header}
                        sx={{
                          fontWeight: "bold",
                          color: "white",
                          py: 2,
                          fontSize: "0.875rem",
                        }}
                      >
                        {header}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredTasks.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} align="center" sx={{ py: 4 }}>
                        <Box sx={{ color: "text.secondary" }}>
                          <FilterAlt
                            sx={{ fontSize: 40, opacity: 0.5, mb: 1 }}
                          />
                          <Typography variant="body1">
                            No tasks found matching your filters
                          </Typography>
                        </Box>
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredTasks.map((task) => (
                      <TableRow
                        key={task.TaskId}
                        hover
                        sx={{ "&:hover": { backgroundColor: "#f9f9f9" } }}
                      >
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {task.TaskId}
                        </TableCell>
                        <TableCell
                          sx={{ fontWeight: "medium", fontSize: "0.875rem" }}
                        >
                          {task.Title}
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {task.Description || (
                            <Typography variant="caption" color="textSecondary">
                              No description
                            </Typography>
                          )}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.Priority}
                            color={getPriorityColor(task.Priority)}
                            size="small"
                            sx={{ fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={task.Status}
                            color={getStatusColor(task.Status)}
                            size="small"
                            sx={{ fontSize: "0.75rem" }}
                          />
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          <Box
                            sx={{
                              display: "flex",
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Schedule fontSize="small" color="action" />
                            {formatDate(task.DueDate)}
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: "flex",
                              flexDirection: "column",
                              gap: 0.5,
                            }}
                          >
                            <Box
                              sx={{
                                display: "flex",
                                alignItems: "center",
                                gap: 1,
                              }}
                            >
                              <Avatar
                                sx={{
                                  width: 24,
                                  height: 24,
                                  bgcolor: "#CC7A00",
                                  fontSize: "0.75rem",
                                }}
                              >
                                {task.AssignedByName?.charAt(0) || "?"}
                              </Avatar>
                              <Typography variant="body2">
                                {task.AssignedByName}
                              </Typography>
                            </Box>
                            {task.AssignedToName &&
                              task.AssignedToName !== "Self" && (
                                <Box
                                  sx={{
                                    display: "flex",
                                    alignItems: "center",
                                    gap: 1,
                                    ml: 0.5,
                                  }}
                                >
                                  <AssignmentInd
                                    sx={{
                                      fontSize: 16,
                                      color: "action.active",
                                    }}
                                  />
                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    to: {task.AssignedToName}
                                  </Typography>
                                </Box>
                              )}
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {formatDate(task.CreatedAt)}
                        </TableCell>
                        <TableCell>
                          <Tooltip title="Update Status">
                            <IconButton
                              size="small"
                              onClick={() => openUpdateModal(task)}
                              sx={{ color: "#1976d2" }}
                            >
                              <Update />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </>
      )}

      {/* Add Task Dialog - Mobile Optimized */}
      <Dialog
        open={openAddDialog}
        onClose={() => setOpenAddDialog(false)}
        maxWidth="sm"
        fullWidth
        fullScreen={isMobile}
        PaperProps={{
          sx: isMobile
            ? {
                margin: 0,
                maxHeight: "100%",
                borderRadius: 0,
              }
            : {},
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            py: isMobile ? 1.5 : 2,
            px: isMobile ? 2 : 3,
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Add New Task
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setOpenAddDialog(false)}
              sx={{ color: "white" }}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={isMobile ? 1.5 : 2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={newTask.Title}
                onChange={(e) =>
                  setNewTask({ ...newTask, Title: e.target.value })
                }
                required
                size="small"
                autoFocus
                placeholder="Enter task title"
                style={{marginTop:"20px"}}
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
                rows={isMobile ? 2 : 3}
                size="small"
                placeholder="Enter task description (optional)"
              />
            </Grid>

            {/* Assignment Type Selection */}
            <Grid item xs={12}>
              <FormControl component="fieldset" sx={{ width: "100%" }}>
                <FormLabel
                  component="legend"
                  sx={{ fontSize: "0.85rem", mb: 1 }}
                >
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
                  sx={{
                    display: "flex",
                    flexDirection: isMobile ? "column" : "row",
                    gap: isMobile ? 1 : 2,
                  }}
                >
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      flex: 1,
                      borderColor:
                        newTask.assignedToType === "self"
                          ? "primary.main"
                          : "divider",
                      bgcolor:
                        newTask.assignedToType === "self"
                          ? "primary.50"
                          : "transparent",
                    }}
                  >
                    <FormControlLabel
                      value="self"
                      control={<Radio size="small" />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Person fontSize="small" />
                          <Typography variant="body2">
                            Assign to Self
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: "100%" }}
                    />
                  </Paper>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 1,
                      flex: 1,
                      borderColor:
                        newTask.assignedToType === "other"
                          ? "primary.main"
                          : "divider",
                      bgcolor:
                        newTask.assignedToType === "other"
                          ? "primary.50"
                          : "transparent",
                    }}
                  >
                    <FormControlLabel
                      value="other"
                      control={<Radio size="small" />}
                      label={
                        <Box
                          sx={{ display: "flex", alignItems: "center", gap: 1 }}
                        >
                          <Group fontSize="small" />
                          <Typography variant="body2">
                            Assign to Department
                          </Typography>
                        </Box>
                      }
                      sx={{ m: 0, width: "100%" }}
                    />
                  </Paper>
                </RadioGroup>
              </FormControl>
            </Grid>

            {/* Employee Selection - Only shown when "other" is selected */}
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
                        size="small"
                        required
                        placeholder="Search by name or ID"
                        InputProps={{
                          ...params.InputProps,
                          startAdornment: (
                            <>
                              <InputAdornment position="start">
                                <Search fontSize="small" />
                              </InputAdornment>
                              {params.InputProps.startAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option) => (
                      <ListItem {...props} dense>
                        <ListItemAvatar>
                          <Avatar
                            sx={{ width: 32, height: 32, bgcolor: "#CC7A00" }}
                          >
                            {option.Name?.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={option.Name}
                          secondary={
                            <React.Fragment>
                              <Typography
                                component="span"
                                variant="body2"
                                color="text.primary"
                              >
                                {option.EmpId}
                              </Typography>
                              {option.Designation && ` • ${option.Designation}`}
                            </React.Fragment>
                          }
                        />
                      </ListItem>
                    )}
                    loading={loadingEmployees}
                    noOptionsText="No employees found"
                    isOptionEqualToValue={(option, value) =>
                      option.EmpId === value.EmpId
                    }
                    ListboxProps={{
                      sx: { maxHeight: 300 },
                    }}
                  />
                )}
              </Grid>
            )}

            <Grid item xs={isMobile ? 12 : 6}>
              <FormControl fullWidth size="small">
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.Priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Priority: e.target.value })
                  }
                  label="Priority"
                >
                  {priorityOptions.map((priority, index) => (
                    <MenuItem key={index} value={priority}>
                      {priority}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={isMobile ? 12 : 6}>
              <FormControl fullWidth size="small">
                <InputLabel>Status</InputLabel>
                <Select
                  value={newTask.Status}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Status: e.target.value })
                  }
                  label="Status"
                >
                  {statusOptions.map((status, index) => (
                    <MenuItem key={index} value={status}>
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
                size="small"
                inputProps={{
                  min: new Date().toISOString().split("T")[0],
                }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 3,
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Button
            onClick={() => setOpenAddDialog(false)}
            fullWidth={isMobile}
            variant={isMobile ? "outlined" : "text"}
            size={isMobile ? "medium" : "small"}
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
            size={isMobile ? "medium" : "small"}
            sx={{
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Add Task
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
          sx: isMobile
            ? {
                margin: 0,
                maxHeight: "100%",
                borderRadius: 0,
              }
            : {},
        }}
      >
        <DialogTitle
          sx={{
            bgcolor: "#1976d2",
            color: "white",
            py: isMobile ? 1.5 : 2,
            px: isMobile ? 2 : 3,
            fontSize: isMobile ? "1.1rem" : "1.25rem",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          Update Task Status
          {isMobile && (
            <IconButton
              size="small"
              onClick={() => setOpenUpdateDialog(false)}
              sx={{ color: "white" }}
            >
              <Close />
            </IconButton>
          )}
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          {selectedTask && (
            <Stack spacing={isMobile ? 2 : 3}>
              <Paper
                variant="outlined"
                sx={{ p: isMobile ? 1.5 : 2, bgcolor: "#f8f9fa" }}
              >
                <Typography
                  variant="subtitle2"
                  gutterBottom
                  sx={{ fontWeight: 600 }}
                >
                  {selectedTask.Title}
                </Typography>
                {selectedTask.Description && (
                  <Typography
                    variant="body2"
                    color="text.secondary"
                    sx={{ fontSize: "0.9rem", mb: 1 }}
                  >
                    {selectedTask.Description}
                  </Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", mt: 1 }}>
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
                  {selectedTask.AssignedToName &&
                    selectedTask.AssignedToName !== "Self" && (
                      <Chip
                        icon={<AssignmentInd />}
                        label={`Assigned to: ${selectedTask.AssignedToName}`}
                        size="small"
                        variant="outlined"
                      />
                    )}
                </Box>
              </Paper>

              <FormControl fullWidth size="small">
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
                rows={isMobile ? 2 : 3}
                size="small"
                placeholder="Add any comments about the status update..."
              />
            </Stack>
          )}
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 3,
            flexDirection: isMobile ? "column-reverse" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Button
            onClick={() => setOpenUpdateDialog(false)}
            fullWidth={isMobile}
            variant={isMobile ? "outlined" : "text"}
            size={isMobile ? "medium" : "small"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateTask}
            variant="contained"
            disabled={!updateData.status}
            fullWidth={isMobile}
            size={isMobile ? "medium" : "small"}
            sx={{
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Update Status
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
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
    </Box>
  );
}

export default ViewTask;
