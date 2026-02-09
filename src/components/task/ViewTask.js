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
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import axios from "axios";

function ViewTask() {
  const { empId } = useParams();
  const isMobile = useMediaQuery("(max-width:768px)");
  const isTablet = useMediaQuery("(max-width:1024px)");

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: "",
    priority: "",
    assignedBy: "",
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openFilterDrawer, setOpenFilterDrawer] = useState(false);
  const [taskToDelete, setTaskToDelete] = useState(null);
  const [taskToEdit, setTaskToEdit] = useState(null);
  const [newTask, setNewTask] = useState({
    Title: "",
    Description: "",
    Priority: "Medium",
    DueDate: "",
    Status: "Pending",
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
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (isMobile) {
      setOpenFilterDrawer(false); // Close drawer on mobile after selection
    }
  };

  const handleAddTask = async () => {
    try {
      const assignedByEmpId = empId;
      const assignedByName = "Self";

      const taskPayload = {
        title: newTask.Title,
        description: newTask.Description,
        assignedToEmpId: empId,
        assignedByEmpId: assignedByEmpId,
        assignedByName: assignedByName,
        assignedByType: "Self",
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
        });
      }
    } catch (err) {
      console.error("Failed to add task:", err);
    }
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

  // Mobile Task Card Component
  const TaskCard = ({ task }) => (
    <Card sx={{ mb: 2, boxShadow: 2 }}>
      <CardContent>
        <Stack spacing={1.5}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
            }}
          >
            <Typography
              variant="h6"
              sx={{ fontWeight: "bold", fontSize: "1rem" }}
            >
              {task.Title}
            </Typography>
            <Chip
              label={task.Status}
              color={getStatusColor(task.Status)}
              size="small"
              sx={{ fontSize: "0.7rem" }}
            />
          </Box>

          {task.Description && (
            <Typography variant="body2" color="text.secondary">
              {task.Description.length > 80
                ? `${task.Description.substring(0, 80)}...`
                : task.Description}
            </Typography>
          )}

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip
                label={task.Priority}
                color={getPriorityColor(task.Priority)}
                size="small"
                sx={{ fontSize: "0.7rem" }}
              />
              <Avatar
                sx={{
                  width: 28,
                  height: 28,
                  bgcolor: "#CC7A00",
                  fontSize: "0.8rem",
                }}
              >
                {task.AssignedByName?.charAt(0) || "?"}
              </Avatar>
            </Stack>

            <Typography variant="caption" color="text.secondary">
              {formatDate(task.DueDate)}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="caption" color="text.secondary">
              ID: {task.TaskId}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {formatDate(task.CreatedAt)}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );

  return (
    <Box
      sx={{
        p: isMobile ? 1 : 2,
        maxWidth: "100%",
        overflowX: "hidden",
      }}
    >
      {/* Header Section */}
      <Box
        sx={{
          display: "flex",
          flexDirection: isMobile ? "column" : "row",
          justifyContent: "space-between",
          alignItems: isMobile ? "stretch" : "center",
          mb: 3,
          gap: isMobile ? 2 : 0,
        }}
      >
        <Typography
          variant={isMobile ? "h5" : "h4"}
          sx={{
            fontWeight: "bold",
            color: "#333",
            mb: isMobile ? 1 : 0,
          }}
        >
          Task List
        </Typography>

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
          <Stack direction="row" spacing={1} justifyContent="space-between">
            <Button
              variant="outlined"
              startIcon={<FilterAlt />}
              onClick={() => setOpenFilterDrawer(true)}
              fullWidth
              sx={{ mr: 1 }}
            >
              Filters
            </Button>

            <Fab
              color="primary"
              onClick={() => setOpenAddDialog(true)}
              size="medium"
              sx={{
                boxShadow: 3,
                position: "relative",
              }}
            >
              <Add />
            </Fab>
          </Stack>
        )}
      </Box>

      {/* Filter Drawer for Mobile */}
      <Drawer
        anchor="bottom"
        open={openFilterDrawer}
        onClose={() => setOpenFilterDrawer(false)}
        PaperProps={{
          sx: {
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
            maxHeight: "80vh",
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
            <Typography variant="h6">Filters</Typography>
            <IconButton onClick={() => setOpenFilterDrawer(false)}>
              <Close />
            </IconButton>
          </Box>

          <Stack spacing={3}>
            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            <FormControl fullWidth>
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

            <Stack direction="row" spacing={2}>
              <Button
                variant="outlined"
                onClick={resetFilters}
                fullWidth
                startIcon={<Close />}
              >
                Clear Filters
              </Button>
              <Button
                variant="contained"
                onClick={() => setOpenFilterDrawer(false)}
                fullWidth
              >
                Apply Filters
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
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Showing {filteredTasks.length} of {tasks.length} tasks
          </Typography>

          {/* Tasks Display - Cards for Mobile, Table for Desktop */}
          {isMobile || isTablet ? (
            // Mobile/Tablet Card View
            <Box>
              {filteredTasks.length === 0 ? (
                <Box
                  display="flex"
                  flexDirection="column"
                  alignItems="center"
                  justifyContent="center"
                  minHeight="200px"
                  sx={{ color: "text.secondary" }}
                >
                  <FilterAlt sx={{ fontSize: 48, mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No tasks found
                  </Typography>
                  <Typography variant="body2" align="center">
                    {Object.values(filters).some((f) => f !== "")
                      ? "Try changing your filters"
                      : "No tasks available"}
                  </Typography>
                </Box>
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
                      "Assigned By",
                      "Created",
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
                              alignItems: "center",
                              gap: 1,
                            }}
                          >
                            <Avatar
                              sx={{
                                width: 28,
                                height: 28,
                                bgcolor: "#CC7A00",
                                fontSize: "0.875rem",
                              }}
                            >
                              {task.AssignedByName?.charAt(0) || "?"}
                            </Avatar>
                            <Typography variant="body2">
                              {task.AssignedByName}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell sx={{ fontSize: "0.875rem" }}>
                          {formatDate(task.CreatedAt)}
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
      >
        <DialogTitle
          sx={{
            bgcolor: "primary.main",
            color: "white",
            fontSize: isMobile ? "1.25rem" : "1.5rem",
          }}
        >
          Add New Task
        </DialogTitle>
        <DialogContent sx={{ p: isMobile ? 2 : 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Task Title"
                value={newTask.Title}
                onChange={(e) =>
                  setNewTask({ ...newTask, Title: e.target.value })
                }
                required
                size={isMobile ? "small" : "medium"}
                autoFocus
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
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
            <Grid item xs={isMobile ? 12 : 6}>
              <FormControl fullWidth>
                <InputLabel>Priority</InputLabel>
                <Select
                  value={newTask.Priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Priority: e.target.value })
                  }
                  label="Priority"
                  size={isMobile ? "small" : "medium"}
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
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={newTask.Status}
                  onChange={(e) =>
                    setNewTask({ ...newTask, Status: e.target.value })
                  }
                  label="Status"
                  size={isMobile ? "small" : "medium"}
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
                size={isMobile ? "small" : "medium"}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions
          sx={{
            p: isMobile ? 2 : 3,
            flexDirection: isMobile ? "column" : "row",
            gap: isMobile ? 1 : 0,
          }}
        >
          <Button
            onClick={() => setOpenAddDialog(false)}
            fullWidth={isMobile}
            variant={isMobile ? "outlined" : "text"}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddTask}
            variant="contained"
            disabled={!newTask.Title}
            fullWidth={isMobile}
            sx={{
              bgcolor: "#1976d2",
              "&:hover": { bgcolor: "#1565c0" },
            }}
          >
            Add Task
          </Button>
        </DialogActions>
      </Dialog>

      {/* Floating Action Button for Mobile */}
      {isMobile && !openAddDialog && (
        <Fab
          color="primary"
          onClick={() => setOpenAddDialog(true)}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: 1000,
            boxShadow: 4,
          }}
        >
          <Add />
        </Fab>
      )}
    </Box>
  );
}

export default ViewTask;
