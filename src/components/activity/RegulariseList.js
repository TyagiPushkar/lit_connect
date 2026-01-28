"use client"

import React, { useState, useEffect } from 'react';
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
  Snackbar,
  Fab,
  Zoom,
  alpha,
} from '@mui/material';
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
  AccessTime,
  TrendingUp,
  Add,
  WatchLater,
  ExitToApp,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';

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
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Box sx={{ flex: 1 }}>
            <Typography variant="caption" color="text.secondary" fontWeight="500" gutterBottom sx={{ fontSize: '0.75rem' }}>
              {title}
            </Typography>
            <Typography variant="h6" fontWeight="bold" color={color} sx={{ fontSize: '1.25rem', lineHeight: 1.2 }}>
              {value}
            </Typography>
            {subtitle && (
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
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
              fontSize: '1rem'
            }}
          >
            {icon}
          </Avatar>
        </Box>
        {trend && (
          <Box sx={{ mt: 1, display: "flex", alignItems: "center" }}>
            <TrendingUp fontSize="small" sx={{ color: "success.main", mr: 0.5, fontSize: '0.9rem' }} />
            <Typography variant="caption" color="success.main" fontWeight="600" sx={{ fontSize: '0.7rem' }}>
              {trend}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// Enhanced Regularise Card for Mobile View
const RegulariseCard = ({ regularise, employee, onStatusChange, isHR, index }) => {
  const theme = useTheme();
  const [anchorEl, setAnchorEl] = useState(null);

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "MMM dd, yyyy") : "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleStatusChange = (status) => {
    onStatusChange(regularise.RegID, status);
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
          borderLeft: `3px solid ${theme.palette[getStatusColor(regularise.Status)].main}`,
          borderRadius: 2,
          "&:hover": {
            boxShadow: theme.shadows[4],
            transform: "translateY(-2px)",
            transition: "all 0.2s ease-in-out",
          },
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1.5 }}>
            <Box sx={{ display: "flex", alignItems: "center", flexGrow: 1 }}>
              <Avatar sx={{ 
                bgcolor: theme.palette.primary.main, 
                mr: 1.5,
                width: 32,
                height: 32,
                fontSize: '0.9rem'
              }}>
                <Person fontSize="small" />
              </Avatar>
              <Box>
                <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem' }}>
                  {employee?.Name || "Unknown Employee"}
                </Typography>
                <Chip 
                  label={regularise.Status || "Pending"} 
                  color={getStatusColor(regularise.Status)} 
                  size="small" 
                  sx={{ height: 24, fontSize: '0.7rem' }}
                />
              </Box>
            </Box>
            <Box sx={{ display: "flex", gap: 0.5 }}>
              <Tooltip title="View Details">
                <IconButton size="small" color="primary" sx={{ fontSize: '0.8rem' }}>
                  <Visibility fontSize="small" />
                </IconButton>
              </Tooltip>
              {isHR && regularise.Status === "Pending" && (
                <>
                  <IconButton size="small" onClick={handleMenuClick}>
                    <MoreVert fontSize="small" />
                  </IconButton>
                  <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
                    <MenuItem onClick={() => handleStatusChange("Approved")}>
                      <Check sx={{ mr: 1, color: "success.main", fontSize: '1rem' }} />
                      Approve
                    </MenuItem>
                    <MenuItem onClick={() => handleStatusChange("Rejected")}>
                      <Cancel sx={{ mr: 1, color: "error.main", fontSize: '1rem' }} />
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
                <CalendarToday fontSize="small" sx={{ mr: 0.5, color: theme.palette.info.main, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Date
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                {formatDate(regularise.Date)}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <WatchLater fontSize="small" sx={{ mr: 0.5, color: theme.palette.primary.main, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  In Time
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                {regularise.InTime || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <ExitToApp fontSize="small" sx={{ mr: 0.5, color: theme.palette.secondary.main, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Out Time
                </Typography>
              </Box>
              <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                {regularise.OutTime || "N/A"}
              </Typography>
            </Grid>
            <Grid item xs={6}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <AccessTime fontSize="small" sx={{ mr: 0.5, color: theme.palette.warning.main, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Status
                </Typography>
              </Box>
              <Chip 
                label={regularise.Status || "Pending"} 
                color={getStatusColor(regularise.Status)} 
                size="small" 
                sx={{ height: 20, fontSize: '0.6rem' }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: "flex", alignItems: "center", mb: 0.5 }}>
                <Description fontSize="small" sx={{ mr: 0.5, color: theme.palette.text.secondary, fontSize: '0.8rem' }} />
                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                  Reason
                </Typography>
              </Box>
              <Typography variant="body2" sx={{ fontStyle: "italic", fontSize: '0.8rem' }}>
                {regularise.Reason || "No reason provided"}
              </Typography>
            </Grid>
          </Grid>

          <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
              Employee ID: {regularise.EmpId}
            </Typography>
            {isHR && regularise.Status === "Pending" && (
              <Box sx={{ display: "flex", gap: 0.5 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="success"
                  startIcon={<Check />}
                  onClick={() => handleStatusChange("Approved")}
                  sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
                >
                  Approve
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="error"
                  startIcon={<Cancel />}
                  onClick={() => handleStatusChange("Rejected")}
                  sx={{ fontSize: '0.7rem', py: 0.25, px: 1 }}
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

const RegulariseList = () => {
  const { user } = useAuth();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const [regularisations, setRegularisations] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState("table");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const formatDate = (dateString) => {
    try {
      const date = parseISO(dateString);
      return isValid(date) ? format(date, "dd/MM/yyyy") : "Invalid date";
    } catch {
      return "Invalid date";
    }
  };

  // Fetch employees
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

  // Fetch regularisations
  useEffect(() => {
    if (employees.length > 0) {
      fetchRegularisations();
    }
  }, [employees]);

  const fetchRegularisations = async () => {
    if (!user || !user.emp_id) {
      setError("User is not authenticated");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const params = { role: user.role, EmpId: user.emp_id };
      const response = await axios.get('https://namami-infotech.com/LIT/src/attendance/get_regularise.php', { params });
      
      if (response.data.success) {
        const filteredRegularisations = response.data.data.filter((reg) =>
          employees.some((emp) => emp.EmpId === reg.EmpId),
        );
        setRegularisations(filteredRegularisations);
      } else {
        setError(response.data.message);
      }
    } catch (error) {
      setError("Error fetching regularisation data");
      console.error("Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRegularisations();
    setRefreshing(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleStatusChange = async (regId, newStatus) => {
    try {
      const selectedReg = regularisations.find(reg => reg.RegID === regId);
      if (!selectedReg) return;

      const updateDate = new Date().toISOString().split('T')[0];
      const updatedBy = user.emp_id;

      const response = await axios.post('https://namami-infotech.com/LIT/src/attendance/update_regularise.php', {
        RegID: selectedReg.RegID,
        Status: newStatus,
        UpdateDate: updateDate,
        UpdatedBy: updatedBy,
        InActivityId: selectedReg.InActivityId,
        OutActivityId: selectedReg.OutActivityId,
        InTime: selectedReg.InTime,
        OutTime: selectedReg.OutTime,
        Date: selectedReg.Date
      });

      if (response.data.success) {
        setSnackbarMessage('Status updated successfully.');
        setRegularisations(regularisations.map((reg) => 
          reg.RegID === regId ? { ...reg, Status: newStatus } : reg
        ));
      } else {
        setSnackbarMessage(response.data.message);
      }
    } catch (error) {
      setSnackbarMessage('Error updating status.');
      console.error("Error:", error);
    } finally {
      setOpenSnackbar(true);
    }
  };

  const exportToCsv = () => {
    const csvRows = [["Employee Name", "Employee ID", "Date", "In Time", "Out Time", "Reason", "Status"]];

    filteredRegularisations.forEach(({ EmpId, Date, InTime, OutTime, Reason, Status }) => {
      const employee = employees.find((emp) => emp.EmpId === EmpId);
      const employeeName = employee ? employee.Name : "Unknown";
      csvRows.push([employeeName, EmpId, formatDate(Date), InTime, OutTime, Reason, Status]);
    });

    const csvContent = csvRows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.href = url;
    link.setAttribute("download", `regularisations_${format(new Date(), "yyyy-MM-dd")}.csv`);
    link.click();
    URL.revokeObjectURL(url);
  };

  // Filter regularisations based on search and status
  const filteredRegularisations = regularisations.filter((reg) => {
    const employee = employees.find((emp) => emp.EmpId === reg.EmpId);
    const employeeName = employee ? employee.Name.toLowerCase() : "";

    const matchesSearch =
      employeeName.includes(searchTerm.toLowerCase()) ||
      reg.Reason?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.EmpId?.toString().includes(searchTerm);

    const matchesStatus = statusFilter === "" || reg.Status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Calculate stats
  const totalRegularisations = regularisations.length;
  const pendingRegularisations = regularisations.filter((reg) => reg.Status === "Pending").length;
  const approvedRegularisations = regularisations.filter((reg) => reg.Status === "Approved").length;
  const rejectedRegularisations = regularisations.filter((reg) => reg.Status === "Rejected").length;

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
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
      <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh" }}>
        <CircularProgress size={60} thickness={4} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 1, md: 2 }, bgcolor: "#f8fafc", minHeight: "100vh" }}>
      {/* Header */}
      <Paper elevation={1} sx={{ p: 2, mb: 2, borderRadius: 2, background: 'white' }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
          <Typography variant="h5" fontWeight="bold" color="#CC7A00">
            Regularisation Requests
          </Typography>
          <Box sx={{ display: "flex", gap: 1 }}>
            <Tooltip title="Refresh">
              <IconButton onClick={handleRefresh} disabled={refreshing} size="small">
                {refreshing ? <CircularProgress size={18} /> : <Refresh fontSize="small" />}
              </IconButton>
            </Tooltip>
            <Button variant="outlined" startIcon={<Download />} onClick={exportToCsv} size="small">
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
              placeholder="Search by employee name, reason, or ID..."
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
      <Grid container spacing={1.5} sx={{ mb: 2 }}>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<EventAvailable />}
            title="Total Requests"
            value={totalRegularisations}
            color={theme.palette.primary.main}
            subtitle="All applications"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<AccessTime />}
            title="Pending"
            value={pendingRegularisations}
            color={theme.palette.warning.main}
            subtitle="Awaiting approval"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<Check />}
            title="Approved"
            value={approvedRegularisations}
            color={theme.palette.success.main}
            subtitle="Approved requests"
          />
        </Grid>
        <Grid item xs={6} sm={3}>
          <StatsCard
            icon={<Cancel />}
            title="Rejected"
            value={rejectedRegularisations}
            color={theme.palette.error.main}
            subtitle="Rejected requests"
          />
        </Grid>
      </Grid>

      {/* Main Content */}
      <Paper elevation={1} sx={{ borderRadius: 2, background: 'white' }}>
        {viewMode === "cards" || isMobile ? (
          // Card View
          <Box sx={{ p: 1.5 }}>
            <Typography variant="subtitle1" fontWeight="600" gutterBottom sx={{ fontSize: '0.9rem' }}>
              Regularisation Requests ({filteredRegularisations.length})
            </Typography>
            <Divider sx={{ mb: 1.5 }} />
            <AnimatePresence>
              {filteredRegularisations.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((regularise, index) => {
                const employee = employees.find((emp) => emp.EmpId === regularise.EmpId);
                return (
                  <RegulariseCard
                    key={regularise.RegID}
                    regularise={regularise}
                    employee={employee}
                    onStatusChange={handleStatusChange}
                    isHR={user.role === "HR"}
                    index={index}
                  />
                );
              })}
            </AnimatePresence>
            {filteredRegularisations.length === 0 && (
              <Box sx={{ textAlign: "center", py: 3 }}>
                <Typography variant="body2" color="text.secondary">
                  No regularisation requests found
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
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Person sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      Employee
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <CalendarToday sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      Date
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <WatchLater sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      In Time
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <ExitToApp sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      Out Time
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <Description sx={{ mr: 0.5, fontSize: '0.9rem' }} />
                      Reason
                    </Box>
                  </TableCell>
                  <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>Status</TableCell>
                  {user.role === "HR" && <TableCell sx={{ color: "white", fontWeight: "bold", fontSize: '0.8rem', py: 1 }}>Actions</TableCell>}
                </TableRow>
              </TableHead>
              <TableBody>
                <AnimatePresence>
                  {filteredRegularisations
                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                    .map((regularise, index) => {
                      const employee = employees.find((emp) => emp.EmpId === regularise.EmpId);
                      const employeeName = employee ? employee.Name : "Unknown";

                      return (
                        <motion.tr
                          key={regularise.RegID}
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
                              <Avatar sx={{ 
                                mr: 1.5, 
                                width: 28, 
                                height: 28, 
                                bgcolor: theme.palette.primary.main,
                                fontSize: '0.8rem'
                              }}>
                                <Person fontSize="small" />
                              </Avatar>
                              <Box>
                                <Typography variant="body2" fontWeight="medium" sx={{ fontSize: '0.8rem' }}>
                                  {employeeName}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                                  ID: {regularise.EmpId}
                                </Typography>
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {formatDate(regularise.Date)}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {regularise.InTime || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                              {regularise.OutTime || "N/A"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{
                                maxWidth: 150,
                                overflow: "hidden",
                                textOverflow: "ellipsis",
                                whiteSpace: "nowrap",
                                fontSize: '0.8rem'
                              }}
                            >
                              {regularise.Reason || "No reason provided"}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ py: 1 }}>
                            <Chip 
                              label={regularise.Status || "Pending"} 
                              color={getStatusColor(regularise.Status)} 
                              size="small" 
                              sx={{ height: 22, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          {user.role === "HR" && (
                            <TableCell sx={{ py: 1 }}>
                              <Box sx={{ display: "flex", gap: 0.5 }}>
                                <Tooltip title="Approve">
                                  <IconButton
                                    size="small"
                                    color="success"
                                    onClick={() => handleStatusChange(regularise.RegID, "Approved")}
                                    disabled={regularise.Status === "Approved" || regularise.Status === "Rejected"}
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    <Check fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="Reject">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => handleStatusChange(regularise.RegID, "Rejected")}
                                    disabled={regularise.Status === "Approved" || regularise.Status === "Rejected"}
                                    sx={{ fontSize: '0.8rem' }}
                                  >
                                    <Cancel fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                                <Tooltip title="View Details">
                                  <IconButton size="small" color="info" sx={{ fontSize: '0.8rem' }}>
                                    <Visibility fontSize="small" />
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
          count={filteredRegularisations.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': { fontSize: '0.8rem' } }}
        />
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default RegulariseList;