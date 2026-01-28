"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  TablePagination,
  IconButton,
  Button,
  Card,
  CardContent,
  Grid,
  Chip,
  Avatar,
  useTheme,
  useMediaQuery,
  Alert,
  TextField,
  InputAdornment,
  Stack,
  Divider,
  Tooltip,
  Menu,
  MenuItem,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Fab,
  Zoom,
  alpha,
} from "@mui/material";
import {
  Check,
  Cancel,
  Search,
  FilterList,
  Download,
  Refresh,
  EventAvailable,
  Person,
  CalendarToday,
  Schedule,
  Description,
  MoreVert,
  Visibility,
  Edit,
  Delete,
  Add,
  TrendingUp,
  AccessTime,
  Category,
} from "@mui/icons-material";
import { motion, AnimatePresence } from "framer-motion";
import { format, parseISO, isValid, differenceInDays } from "date-fns";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import ApplyLeave from "./ApplyLeave";

// Enhanced Compact Stats Card Component
const StatsCard = ({ icon, title, value, color, subtitle, trend }) => {
  const theme = useTheme();

  return (
    <Card
      component={motion.div}
      whileHover={{
        translateY: -3,
        boxShadow: theme.shadows[6],
        transition: { duration: 0.2 },
      }}
      sx={{
        height: "100%",
        borderLeft: `3px solid ${color}`,
        background: `linear-gradient(135deg, ${alpha(color, 0.08)} 0%, ${alpha(color, 0.04)} 100%)`,
        borderRadius: 2,
        transition: "all 0.3s ease",
      }}
    >
      <CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight="500"
              gutterBottom
              sx={{ fontSize: "0.75rem" }}
            >
              {title}
            </Typography>
            <Typography
              variant="h6"
              fontWeight="bold"
              color={color}
              sx={{ fontSize: "1.25rem", lineHeight: 1.2 }}
            >
              {value}
            </Typography>
            {subtitle && (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ fontSize: "0.7rem" }}
              >
                {subtitle}
              </Typography>
            )}
          </Box>
          <Avatar
            sx={{
              bgcolor: `${alpha(color, 0.1)}`,
              color: color,
              width: 36,
              height: 36,
              fontSize: "1rem",
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
            <TrendingUp
              fontSize="small"
              sx={{ color: "success.main", mr: 0.5, fontSize: "0.9rem" }}
            />
            <Typography
              variant="caption"
              color="success.main"
              fontWeight="600"
              sx={{ fontSize: "0.7rem" }}
            >
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Leave Card for Mobile View
const LeaveCard = ({ leave, employee, onStatusChange, isHR, index }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);
  const [expanded, setExpanded] = useState(false);

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  const calculateDays = () => {
    try {
      const start = parseISO(leave.StartDate);
      const end = parseISO(leave.EndDate);
      return differenceInDays(end, start) + 1;
    } catch {
      return 0;
    }
  };

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status) => {
    onStatusChange(leave.Id, status);
    handleMenuClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.1 }}
    >
      <Card
        sx={{
          mb: 2,
          borderLeft: `3px solid ${theme.palette[getStatusColor(leave.Status)].main}`,
          borderRadius: 2,
          "&:hover": {
            boxShadow: theme.shadows[4],
            transform: "translateY(-2px)",
            transition: "all 0.2s ease-in-out",
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              mb: 1.5,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Avatar
                sx={{
                  bgcolor: theme.palette.primary.main,
                  mr: 1.5,
                  width: 32,
                  height: 32,
                  fontSize: "0.9rem",
                }}
              >
                <Person fontSize="small" />
              </Avatar>
              <Box>
                <Typography
                  variant="subtitle1"
                  fontWeight="600"
                  gutterBottom
                  sx={{ fontSize: "0.9rem" }}
                >
                  {employee?.Name || "Unknown Employee"}
                </Typography>
                <Chip
                  label={leave.Status}
                  color={getStatusColor(leave.Status)}
                  size="small"
                  sx={{ height: 24, fontSize: "0.7rem" }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton
                  size="small"
                  color="primary"
                  sx={{ fontSize: "0.8rem" }}
                >
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              {isHR && leave.Status === "Pending" && (
                <>
                  <IconButton size="small" onClick={handleMenuClick}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                  <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                  >
                    <MenuItem onClick={() => handleStatusChange("Approved")}>
                      <Check
                        sx={{ mr: 1, color: "success.main", fontSize: "1rem" }}
                      />
                      Approve
                    </MenuItem>
                    <MenuItem onClick={() => handleStatusChange("Rejected")}>
                      <Cancel
                        sx={{ mr: 1, color: "error.main", fontSize: "1rem" }}
                      />
                      Reject
                    </MenuItem>
                  </Menu>
                </>
              )}
            </Box>
          </Box>

          <Grid container spacing={1.5} sx={{ mb: 1.5 }}>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <CalendarToday
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: theme.palette.info.main,
                    fontSize: "0.8rem",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Duration
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ fontSize: "0.8rem" }}
              >
                {calculateDays()} day{calculateDays() !== 1 ? "s" : ""}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Category
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: theme.palette.secondary.main,
                    fontSize: "0.8rem",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Type
                </Typography>
              </Box>
              <Typography
                variant="body2"
                fontWeight="medium"
                sx={{ fontSize: "0.8rem" }}
              >
                {leave.Category}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Schedule
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: theme.palette.warning.main,
                    fontSize: "0.8rem",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Dates
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontSize: "0.8rem" }}>
                {formatDate(leave.StartDate)} - {formatDate(leave.EndDate)}
              </Typography>
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Description
                  fontSize="small"
                  sx={{
                    mr: 0.5,
                    color: theme.palette.text.secondary,
                    fontSize: "0.8rem",
                  }}
                />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{ fontSize: "0.7rem" }}
                >
                  Reason
                </Typography>
              </Box>
              <Typography
                variant="body2"
                sx={{ fontStyle: "italic", fontSize: "0.8rem" }}
              >
                {leave.Reason}
              </Typography>
            </Grid>
          </Grid>

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ fontSize: "0.7rem" }}
            >
              Applied: {leave.CreatedAt}
            </Typography>
            {isHR && leave.Status === "Pending" && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<Check />}
                  onClick={() => onStatusChange(leave.Id, "Approved")}
                  sx={{ fontSize: "0.7rem", py: 0.25, px: 1 }}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => onStatusChange(leave.Id, "Rejected")}
                  sx={{ fontSize: "0.7rem", py: 0.25, px: 1 }}
                >
                  Reject
                </Button>
              </Box>
            )}
          </Box>
        </CardContent>
      </Card>
    </motion.div>
  );
};

function ViewLeave() {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [expanded, setExpanded] = useState(false);

  const [leaves, setLeaves] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("table"); // 'table' or 'cards'
  const [applyLeaveOpen, setApplyLeaveOpen] = useState(false);

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await axios.get(
          "https://namami-infotech.com/LIT/src/employee/list_employee.php",
          {
            params: { Tenent_Id: user.tenent_id },
          },
        );

        if (response.data.success) {
          setEmployees(response.data.data);
        } else {
          setError(response.data.message);
        }
      } catch (error) {
        setError("Error fetching employee data");
        console.error("Error:", error);
      }
    };

    fetchEmployees();
  }, [user.tenent_id]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchLeaves();
    }
  }, [employees]);

  const fetchLeaves = async () => {
    if (!user || !user.emp_id) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params =
        user.role === "HR" ? { role: user.role } : { empId: user.emp_id };
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/leave/get_leave.php",
        {
          params,
        },
      );

      if (response.data.success) {
        const filteredLeaves = response.data.data.filter((leave) =>
          employees.some((emp) => emp.EmpId === leave.EmpId),
        );
        setLeaves(filteredLeaves);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Error fetching leave data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchLeaves();
    setRefreshing(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/leave/approve_leave.php",
        {
          id,
          status: newStatus,
        },
      );

      if (response.data.success) {
        setLeaves(
          leaves.map((leave) =>
            leave.Id === id ? { ...leave, Status: newStatus } : leave,
          ),
        );
        fetchLeaves();
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Error updating leave status");
      console.error("Error:", error);
    }
  };

  const exportToCsv = () => {
    const csvRows = [
      [
        "Employee Name",
        "Start Date",
        "End Date",
        "Category",
        "Reason",
        "Status",
        "Applied On",
      ],
    ];

    filteredLeaves.forEach(
      ({ EmpId, StartDate, EndDate, Category, Reason, Status, CreatedAt }) => {
        const employee = employees.find((emp) => emp.EmpId === EmpId);
        const employeeName = employee ? employee.Name : "Unknown";
        csvRows.push([
          employeeName,
          formatDate(StartDate),
          formatDate(EndDate),
          Category,
          Reason,
          Status,
          CreatedAt,
        ]);
      },
    );

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute(
      "download",
      `leaves_${format(new Date(), "yyyy-MM-dd")}.csv`,
    );
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter leaves based on search and status
  const filteredLeaves = leaves.filter((leave) => {
    const employee = employees.find((emp) => emp.EmpId === leave.EmpId);
    const employeeName = employee ? employee.Name.toLowerCase() : "";

    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      leave.Reason.toLowerCase().includes(searchTerm.toLowerCase()) ||
      leave.Category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "" || leave.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalLeaves = leaves.length;
  const pendingLeaves = leaves.filter(
    (leave) => leave.Status === "Pending",
  ).length;
  const approvedLeaves = leaves.filter(
    (leave) => leave.Status === "Approved",
  ).length;
  const rejectedLeaves = leaves.filter(
    (leave) => leave.Status === "Rejected",
  ).length;

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case "approved":
        return "success";
      case "rejected":
        return "error";
      case "pending":
        return "warning";
      default:
        return "default";
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "50vh",
        }}
      >
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Paper
        elevation={1}
        sx={{ p: 2, mb: 2, borderRadius: 2, background: "white" }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Typography variant="h5" fontWeight="bold" color="#CC7A00">
            Leave Management
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton
                onClick={handleRefresh}
                disabled={refreshing}
                size="small"
              >
                {refreshing ? (
                  <CircularProgress size={18} />
                ) : (
                  <Refresh fontSize="small" />
                )}
              </IconButton>
            </Tooltip>
            <Button
              variant="outlined"
              startIcon={<Download />}
              onClick={exportToCsv}
              size="small"
            >
              Export CSV
            </Button>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Grid container spacing={1.5} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="Search by employee name, reason, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Search color="action" fontSize="small" />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={3}>
            <TextField
              select
              fullWidth
              label="Filter by Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              size="small"
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Approved">Approved</MenuItem>
              <MenuItem value="Rejected">Rejected</MenuItem>
            </TextField>
          </Grid>
          
        </Grid>
      </Paper>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Compact Stats Cards */}
     

      {/* Main Content */}
      <Paper elevation={1} sx={{ borderRadius: 2, background: "white" }}>
        {viewMode === "cards" || isMobile ? (
          // Card View
          <Box sx={{ p: 1.5 }}>
            <Typography
              variant="subtitle1"
              fontWeight="600"
              gutterBottom
              sx={{ fontSize: "0.9rem" }}
            >
              Leave Applications ({filteredLeaves.length})
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <AnimatePresence>
              {filteredLeaves
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((leave, index) => {
                  const employee = employees.find(
                    (emp) => emp.EmpId === leave.EmpId,
                  );
                  return (
                    <LeaveCard
                      key={leave.Id}
                      leave={leave}
                      employee={employee}
                      onStatusChange={handleStatusChange}
                      isHR={user.role === "HR"}
                      index={index}
                    />
                  );
                })}
            </AnimatePresence>
            {filteredLeaves.length === 0 && (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No leave applications found
                </Typography>
              </Box>
            )}
          </Box>
        ) : (
          // Table View
          <TableContainer>
            <Table sx={{ minWidth: 650 }} size="small">
              <TableHead sx={{ bgcolor: "#CC7A00" }}>
                <TableRow>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Person sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      Employee
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarToday sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      Dates
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <AccessTime sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      Leave Days
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Category sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      Category
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Description sx={{ mr: 0.5, fontSize: "0.9rem" }} />
                      Reason
                    </Box>
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "0.8rem",
                      py: 1,
                    }}
                  >
                    Status
                  </TableCell>
                  {/* <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center" }}>
            <Schedule sx={{ mr: 0.5, fontSize: '0.9rem' }} />
            Applied
          </Box>
        </TableCell> */}
                  {user.role === "HR" && (
                    <TableCell
                      sx={{
                        color: "white",
                        fontWeight: "bold",
                        fontSize: "0.8rem",
                        py: 1,
                      }}
                    >
                      Actions
                    </TableCell>
                  )}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredLeaves
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((leave, index) => {
                      const employee = employees.find(
                        (emp) => emp.EmpId === leave.EmpId,
                      );
                      const employeeName = employee ? employee.Name : "Unknown";

                      // Calculate leave days
                      const calculateLeaveDays = (startDate, endDate) => {
                        const start = new Date(startDate);
                        const end = new Date(endDate);
                        const timeDiff = end.getTime() - start.getTime();
                        const dayDiff =
                          Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1; // +1 to include both start and end dates
                        return dayDiff;
                      };

                      const leaveDays = calculateLeaveDays(
                        leave.StartDate,
                        leave.EndDate,
                      );

                      return (
                        <motion.tr
                          key={leave.Id}
                          component={TableRow}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ delay: index * 0.03 }}
                          sx={{
                            "&:hover": {
                              bgcolor: alpha(theme.palette.primary.main, 0.04),
                            },
                          }}
                        >
                          <TableCell sx={{ py: 1 }}>
                            <Box sx={{ display: "flex", alignItems: "center" }}>
                              <Avatar
                                sx={{
                                  mr: 1.5,
                                  width: 28,
                                  height: 28,
                                  bgcolor: theme.palette.primary.main,
                                  fontSize: "0.8rem",
                                }}
                              >
                                <Person fontSize="small" />
                              </Avatar>
                              <Typography
                                variant="body2"
                                fontWeight="medium"
                                sx={{ fontSize: "0.8rem" }}
                              >
                                {employeeName}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontSize: "0.8rem" }}
                            >
                              {formatDate(leave.StartDate)} -{" "}
                              {formatDate(leave.EndDate)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={`${leaveDays} day${leaveDays !== 1 ? "s" : ""}`}
                              variant="filled"
                              size="small"
                              color="primary"
                              sx={{
                                height: 22,
                                fontSize: "0.7rem",
                                fontWeight: "bold",
                              }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={leave.Category}
                              variant="outlined"
                              size="small"
                              sx={{ height: 22, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 150,
                                overflow: expanded ? "visible" : "hidden",
                                textOverflow: expanded ? "unset" : "ellipsis",
                                whiteSpace: expanded ? "normal" : "nowrap",
                                fontSize: "0.8rem",
                              }}
                            >
                              {leave.Reason}
                            </Typography>

                            {/* Show More / Show Less Button */}
                            {leave.Reason?.length > 20 && (
                              <Typography
                                onClick={() => setExpanded(!expanded)}
                                sx={{
                                  color: "primary.main",
                                  fontSize: "0.7rem",
                                  cursor: "pointer",
                                  mt: 0.5,
                                  textDecoration: "underline",
                                }}
                              >
                                {expanded ? "Show Less" : "Show More"}
                              </Typography>
                            )}
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip
                              label={leave.Status}
                              color={getStatusColor(leave.Status)}
                              size="small"
                              sx={{ height: 22, fontSize: "0.7rem" }}
                            />
                          </TableCell>
                          {/* <TableCell sx={{ py: 1 }}>
                  <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>{leave.CreatedAt}</Typography>
                </TableCell> */}
                          {user.role === "HR" && (
                            <TableCell sx={{ py: 1 }}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() =>
                                      handleStatusChange(leave.Id, "Approved")
                                    }
                                    disabled={
                                      leave.Status === "Approved" ||
                                      leave.Status === "Rejected"
                                    }
                                    sx={{ fontSize: "0.8rem" }}
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() =>
                                      handleStatusChange(leave.Id, "Rejected")
                                    }
                                    disabled={
                                      leave.Status === "Approved" ||
                                      leave.Status === "Rejected"
                                    }
                                    sx={{ fontSize: "0.8rem" }}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              </Box>
                            </TableCell>
                          )}
                        </motion.tr>
                      );
                    })}
                </AnimatePresence>
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={filteredLeaves.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
              { fontSize: "0.8rem" },
          }}
        />
      </Paper>

      {/* Floating Action Button */}
      {/* <Zoom in={true}>
        <Fab
          color="primary"
          onClick={() => setApplyLeaveOpen(true)}
          sx={{
            position: "fixed",
            bottom: 16,
            right: 16,
            zIndex: theme.zIndex.speedDial,
            bgcolor: '#CC7A00',
            '&:hover': {
              bgcolor: '#6d0430ff',
            }
          }}
          size="medium"
        >
          <Add />
        </Fab>
      </Zoom> */}

      {/* Apply Leave Dialog */}
      <ApplyLeave
        open={applyLeaveOpen}
        onClose={() => setApplyLeaveOpen(false)}
        onLeaveApplied={() => {
          fetchLeaves();
          setApplyLeaveOpen(false);
        }}
      />
    </Box>
  );
}

export default ViewLeave;
