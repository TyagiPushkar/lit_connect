import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
  Typography,
  IconButton,
  Grid,
  TablePagination,
  Box,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  ListItemText,
  Chip,
  Stack,
  Tooltip,
  Switch,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import { useAuth } from "../auth/AuthContext";
import RestartAltIcon from '@mui/icons-material/RestartAlt';
import DownloadIcon from "@mui/icons-material/Download";
import BlockIcon from '@mui/icons-material/Block';
import Papa from "papaparse";

function EmployeeList() {
  const { user } = useAuth();
  const [error, setError] = useState("");

  const [employees, setEmployees] = useState([]);
  const [offices, setOffices] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [openDetail, setOpenDetail] = useState(false);
  const [openForm, setOpenForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // 'add' or 'edit'
  const [nextEmpId, setNextEmpId] = useState(""); // State to store the next EmpId
  
  const [formData, setFormData] = useState({
    EmpId: "",
    Name: "",
    Password: "",
    Mobile: "",
    EmailId: "",
    Role: "",
    OTP: "",
    IsOTPExpired: 1,
    IsGeofence: 0,
    Tenent_Id: "",
    IsActive: 1,
    OfficeId: null,
    OfficeName: "",
    LatLong: "",
    Distance: "",
    OfficeIsActive: 1,
    RM: "",
    Shift: "",
    DOB: "",
    JoinDate: "",
    WeekOff: "",
    Designation: "",
    Category: "",
  });
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Filter states
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'active', 'inactive'
  const [showFilters, setShowFilters] = useState(false);
  const [roleFilter, setRoleFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEmployees();
    fetchOffices();
  }, [user]);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
      );
      console.log("Employees response:", response.data);
      if (response.data.success) {
        setEmployees(response.data.data);
        
        // Extract last EmpId from message and generate next one
        if (response.data.message && response.data.message.match(/[A-Z]+\d+/)) {
          generateNextEmpId(response.data.message);
        }
      } else {
        console.error("Error fetching employees:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching employees:", error);
    } finally {
      setLoading(false);
    }
  };

  // Function to generate next EmpId by incrementing the last one
  const generateNextEmpId = (lastEmpId) => {
    try {
      // Extract the numeric part from the EmpId
      const match = lastEmpId.match(/([A-Z]+)(\d+)/);
      if (match) {
        const prefix = match[1]; // Alphabetic prefix (e.g., "LIT")
        const number = parseInt(match[2], 10); // Numeric part (e.g., 87)
        const nextNumber = number + 1;
        const nextEmpId = `${prefix}${nextNumber.toString().padStart(4, '0')}`;
        setNextEmpId(nextEmpId);
        
        // Update formData with the new EmpId if in add mode
        if (formMode === 'add') {
          setFormData(prev => ({
            ...prev,
            EmpId: nextEmpId
          }));
        }
      }
    } catch (error) {
      console.error("Error generating next EmpId:", error);
      setNextEmpId("");
    }
  };

  const fetchOffices = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/employee/get_office.php",
      );
      console.log("Offices response:", response.data);
      if (response.data.success) {
        setOffices(response.data.data);
      } else {
        console.error("Error fetching offices:", response.data.message);
      }
    } catch (error) {
      console.error("Error fetching offices:", error);
    }
  };

  const handleCloseDetail = () => {
    setOpenDetail(false);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleOpenForm = async (mode, employee = null) => {
    setFormMode(mode);
    
    if (mode === "edit" && employee) {
      // Format dates for input fields (YYYY-MM-DD)
      const formattedDOB = employee.DOB ? formatDateForInput(employee.DOB) : "";
      const formattedJoinDate = employee.JoinDate ? formatDateForInput(employee.JoinDate) : "";
      
      // Parse WeekOff from string to array
      const weekOffArray = employee.WeekOff ? employee.WeekOff.split(",").map(item => item.trim()) : [];
      
      // Get selected office IDs from the employee data
      const selectedOfficeIds = employee.OfficeId ? 
        employee.OfficeId.toString().split(",").map(id => id.trim()) : [];
      
      console.log("Editing employee data:", {
        ...employee,
        DOB: formattedDOB,
        JoinDate: formattedJoinDate,
        WeekOff: weekOffArray,
        OfficeId: selectedOfficeIds
      });

      setFormData({
        EmpId: employee.EmpId,
        Name: employee.Name || "",
        Password: "", // Password field is blank for edit
        Mobile: employee.Mobile || "",
        EmailId: employee.EmailId || "",
        Role: employee.Role || "",
        OTP: employee.OTP || "123456",
        IsOTPExpired: employee.IsOTPExpired || 1,
        IsGeofence: employee.IsGeofence || 0,
        Tenent_Id: user.tenent_id,
        IsActive: employee.IsActive === 1 ? 1 : 0,
        OfficeId: selectedOfficeIds, // Store as array for Select component
        OfficeName: employee.OfficeName || "",
        LatLong: employee.LatLong || "",
        Distance: employee.Distance || "",
        OfficeIsActive: employee.OfficeIsActive || 1,
        RM: employee.RM || "",
        Shift: employee.Shift || "",
        DOB: formattedDOB,
        JoinDate: formattedJoinDate,
        WeekOff: weekOffArray, // Store as array for Select component
        Designation: employee.Designation || "",
        Category: employee.Category || "",
      });
    } else {
      // For add mode, generate new EmpId
      if (!nextEmpId) {
        // If nextEmpId is not set, fetch employees to get the last EmpId
        await fetchEmployees();
      }
      
      setFormData({
        EmpId: nextEmpId,
        Name: "",
        Password: "",
        Mobile: "",
        EmailId: "",
        Role: "",
        OTP: "123456",
        IsOTPExpired: 1,
        IsGeofence: 0,
        Tenent_Id: user.tenent_id,
        IsActive: 1,
        OfficeId: [],
        OfficeName: "",
        LatLong: "",
        Distance: "",
        OfficeIsActive: 1,
        RM: "",
        Shift: "",
        DOB: "",
        JoinDate: "",
        WeekOff: [], // Initialize as empty array
        Designation: "",
        Category: "",
      });
    }
    setOpenForm(true);
  };

  // Helper function to format date for input field (YYYY-MM-DD)
  const formatDateForInput = (dateString) => {
    if (!dateString) return "";
    
    try {
      // Remove time part if present
      const dateOnly = dateString.split(' ')[0];
      const date = new Date(dateOnly);
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return "";
      }
      
      // Format as YYYY-MM-DD for input[type="date"]
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();

    // Prepare data for API
    const formattedFormData = {
      EmpId: formData.EmpId,
      Name: formData.Name,
      Mobile: formData.Mobile,
      EmailId: formData.EmailId,
      Role: formData.Role,
      Tenent_Id: user.tenent_id,
      IsActive: formData.IsActive || 1,
      RM: formData.RM || "",
      Shift: formData.Shift,
      DOB: formData.DOB || "",
      JoinDate: formData.JoinDate || "",
      WeekOff: Array.isArray(formData.WeekOff) ? formData.WeekOff.join(",") : formData.WeekOff || "",
      Designation: formData.Designation || "",
      Category: formData.Category || "",
    };

    // Prepare office data
    const selectedOfficeIds = Array.isArray(formData.OfficeId) ? formData.OfficeId : [];
    const officeData = [];
    
    if (selectedOfficeIds.length > 0) {
      selectedOfficeIds.forEach(officeId => {
        const office = offices.find(o => o.Id.toString() === officeId.toString());
        if (office) {
          officeData.push({
            OfficeName: office.OfficeName,
            LatLong: office.LatLong
          });
        }
      });
    }
    
    if (officeData.length > 0) {
      formattedFormData.Offices = officeData;
    }

    // Only include Password for add mode
    if (formMode === "add") {
      formattedFormData.Password = formData.Password;
      formattedFormData.OTP = formData.OTP || "123456";
      formattedFormData.IsOTPExpired = formData.IsOTPExpired || 1;
      formattedFormData.IsGeofence = formData.IsGeofence || 0;
    }

    console.log("Submitting form data:", formattedFormData);

    const url = formMode === "add"
      ? "https://namami-infotech.com/LIT/src/employee/add_employee.php"
      : "https://namami-infotech.com/LIT/src/employee/edit_employee.php";

    try {
      const response = await axios.post(url, formattedFormData);
      console.log("Response:", response.data);
      
      if (response.data.success) {
        alert(response.data.message || "Operation successful!");
        handleCloseForm();
        fetchEmployees(); // Refresh the list
      } else {
        alert(response.data.message || "Operation failed!");
      }
    } catch (error) {
      console.error(
        "Error:",
        error.response ? error.response.data : error.message,
      );
      alert(
        `Error: ${error.response ? error.response.data.message : error.message}`,
      );
    }
  };

  const handleExportCSV = () => {
    // Prepare data for export
    const dataToExport = filteredEmployees.map((employee) => ({
      "Employee ID": employee.EmpId,
      Name: employee.Name,
      Mobile: employee.Mobile,
      Email: employee.EmailId,
      Role: employee.Role,
      Category: employee.Category,
      Designation: employee.Designation,
      Shift: employee.Shift,
      "Week Off": employee.WeekOff,
      "Date of Birth": employee.DOB,
      "Date of Joining": employee.JoinDate,
      Status: employee.IsActive === 1 ? "Active" : "Inactive",
      Office: employee.OfficeName,
      "Reporting Manager": employee.RM,
      "Geofence Enabled": employee.IsGeofence === 1 ? "Yes" : "No",
    }));

    // Convert to CSV
    const csv = Papa.unparse(dataToExport);

    // Create and download file
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);

    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `employees_${new Date().toISOString().split("T")[0]}.csv`,
    );
    link.style.visibility = "hidden";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Revoke the object URL
    URL.revokeObjectURL(url);
  };

  const handleOfficeChange = (event) => {
    const selectedOfficeIds = event.target.value;
    setFormData(prev => ({
      ...prev,
      OfficeId: selectedOfficeIds
    }));
  };

  const handleWeekOffChange = (event) => {
    const selectedDays = event.target.value;
    setFormData(prev => ({
      ...prev,
      WeekOff: selectedDays
    }));
  };

  const handleCloseForm = () => {
    setOpenForm(false);
  };

  const handleToggleEmployeeStatus = async (employee) => {
    if (!employee || !employee.EmpId) {
      console.error("Please provide both Employee ID and action");
      return;
    }

    try {
      const isActive = employee.IsActive === 1;
      const action = isActive ? "disable" : "enable";
      
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/employee/disable_employee.php",
        {
          EmpId: employee.EmpId,
          action: action,
        },
      );

      if (response.data.success) {
        setEmployees(prevEmployees => 
          prevEmployees.map(emp => 
            emp.EmpId === employee.EmpId 
              ? { ...emp, IsActive: isActive ? 0 : 1 } 
              : emp
          )
        );
      } else {
        console.error("Error:", response.data.message);
        alert(response.data.message || `Failed to ${action} employee`);
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Error updating employee status");
    }
  };

  // Extract unique roles for filter
  const uniqueRoles = [...new Set(employees.map(emp => emp.Role).filter(Boolean))].sort();

  const filteredEmployees = employees.filter((employee) => {
    // Apply text search filter
    if (searchTerm) {
      const lowerCaseSearchTerm = searchTerm.toLowerCase();
      const matchesSearch = Object.keys(employee).some((key) => {
        const value = employee[key];
        return (
          value != null &&
          value.toString().toLowerCase().includes(lowerCaseSearchTerm)
        );
      });
      if (!matchesSearch) return false;
    }
    
    // Apply status filter
    if (statusFilter !== 'all') {
      const isActiveFilter = statusFilter === 'active';
      const isActive = employee.IsActive === 1;
      if (isActive !== isActiveFilter) return false;
    }
    
    // Apply role filter
    if (roleFilter) {
      if (employee.Role !== roleFilter) return false;
    }
    
    return true;
  });

  const handleClearFilters = () => {
    setStatusFilter('all');
    setRoleFilter('');
  };

  const hasActiveFilters = () => {
    return statusFilter !== 'all' || roleFilter;
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (statusFilter !== 'all') count++;
    if (roleFilter) count++;
    return count;
  };

  const handleRemoveMobileID = async (EmpId) => {
    try {
      const response = await fetch(
        "https://namami-infotech.com/LIT/src/auth/remove_device.php",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ employee_id: EmpId }),
        }
      );
      const data = await response.json();
      if (data.success) {
        alert("Mobile ID removed successfully.");
        fetchEmployees();
      } else {
        alert( "Mobile ID already removed");
      }
    } catch (err) {
      setError("Error removing Mobile ID.");
    }
  };

  // Calculate counts for summary
  const activeCount = employees.filter(emp => emp.IsActive === 1).length;
  const inactiveCount = employees.filter(emp => emp.IsActive === 0).length;

  const isEmployeeActive = (employee) => {
    return employee.IsActive === 1;
  };

  // Days of the week for WeekOff dropdown
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return (
    <div>
      <Grid
        container
        spacing={2}
        alignItems="center"
        justifyContent="space-between"
      >
        <Grid item xs={12} md={6}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search Employee"
            margin="normal"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </Grid>
        <Grid
          item
          xs={12}
          md={6}
          sx={{
            textAlign: "right",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
          }}
        >
          <Tooltip title={showFilters ? "Hide Filters" : "Show Filters"}>
            <IconButton
              onClick={() => setShowFilters(!showFilters)}
              color={hasActiveFilters() ? "primary" : "default"}
              sx={{
                border: hasActiveFilters() ? "2px solid #1976d2" : "none",
                borderRadius: 1,
              }}
            >
              <FilterListIcon />
              {hasActiveFilters() && (
                <Chip
                  label={getActiveFilterCount()}
                  size="small"
                  sx={{
                    position: "absolute",
                    top: -8,
                    right: -8,
                    height: 20,
                    minWidth: 20,
                    fontSize: "0.75rem",
                  }}
                />
              )}
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            color="success"
            onClick={handleExportCSV}
            disabled={filteredEmployees.length === 0}
          >
            <DownloadIcon />
          </Button>

          <Button
            variant="contained"
            color="primary"
            style={{ backgroundColor: "#CC7A00" }}
            startIcon={<AddIcon />}
            onClick={() => handleOpenForm("add")}
          >
            Add Employee
          </Button>
        </Grid>
      </Grid>

      {/* Filter Section */}
      {showFilters && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: "#f5f5f5" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <h4 style={{ margin: 0 }}>Filters</h4>
            <Button
              startIcon={<ClearIcon />}
              onClick={handleClearFilters}
              size="small"
              disabled={!hasActiveFilters()}
            >
              Clear All
            </Button>
          </Box>

          <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status</InputLabel>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                label="Status"
              >
                <MenuItem value="all">All Status</MenuItem>
                <MenuItem value="active">Active Only</MenuItem>
                <MenuItem value="inactive">Inactive Only</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Role</InputLabel>
              <Select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                label="Role"
              >
                <MenuItem value="">All Roles</MenuItem>
                {uniqueRoles.map((role) => (
                  <MenuItem key={role} value={role}>
                    {role}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {statusFilter !== "all" && (
                  <Chip
                    label={`Status: ${statusFilter === "active" ? "Active" : "Inactive"}`}
                    onDelete={() => setStatusFilter("all")}
                    size="small"
                  />
                )}
                {roleFilter && (
                  <Chip
                    label={`Role: ${roleFilter}`}
                    onDelete={() => setRoleFilter("")}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <Box sx={{ overflowX: "auto", mt: 2 }}>
        <TableContainer component={Paper}>
          <Table>
            <TableHead style={{ backgroundColor: "#CC7A00" }}>
              <TableRow>
                <TableCell style={{ color: "white" }}>EmpID</TableCell>
                <TableCell style={{ color: "white" }}>Name</TableCell>
                <TableCell style={{ color: "white" }}>Mobile</TableCell>
                <TableCell style={{ color: "white" }}>Email</TableCell>
                <TableCell style={{ color: "white" }}>Role</TableCell>
                <TableCell style={{ color: "white" }}>Shift</TableCell>
                <TableCell style={{ color: "white" }}>Status</TableCell>
                <TableCell style={{ color: "white" }}>Actions</TableCell>
                {user && user.role === "HR" && (
                  <TableCell style={{ color: "white" }}>MobileId</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={user && user.role === "HR" ? 9 : 8}
                    align="center"
                  >
                    Loading employees...
                  </TableCell>
                </TableRow>
              ) : filteredEmployees.length > 0 ? (
                filteredEmployees
                  .sort((a, b) => a.Name.localeCompare(b.Name))
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((employee) => {
                    const isActive = isEmployeeActive(employee);
                    return (
                      <TableRow
                        key={employee.EmpId}
                        sx={{
                          backgroundColor: !isActive ? "#f5f5f5" : "inherit",
                          opacity: !isActive ? 0.7 : 1,
                        }}
                      >
                        <TableCell
                          component={Link}
                          to={employee.EmpId}
                          style={{ textDecoration: "none" }}
                        >
                          {employee.EmpId}
                        </TableCell>

                        <TableCell
                          component={Link}
                          to={employee.EmpId}
                          style={{ textDecoration: "none" }}
                        >
                          {employee.Name}
                        </TableCell>
                        <TableCell
                          component={Link}
                          to={employee.EmpId}
                          style={{ textDecoration: "none" }}
                        >
                          {employee.Mobile}
                        </TableCell>
                        <TableCell
                          component={Link}
                          to={employee.EmpId}
                          style={{ textDecoration: "none" }}
                        >
                          {employee.EmailId}
                        </TableCell>
                        <TableCell
                          component={Link}
                          to={employee.EmpId}
                          style={{ textDecoration: "none" }}
                        >
                          {employee.Role}
                        </TableCell>
                        <TableCell>{employee.Shift}</TableCell>
                        <TableCell>
                          <Chip
                            label={isActive ? "Active" : "Inactive"}
                            color={isActive ? "success" : "error"}
                            size="small"
                            icon={
                              isActive ? <CheckCircleIcon /> : <BlockIcon />
                            }
                          />
                        </TableCell>
                        <TableCell
                          style={{ display: "flex", alignItems: "center" }}
                        >
                          <Tooltip title="Edit Employee">
                            <IconButton
                              color="primary"
                              onClick={() => handleOpenForm("edit", employee)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip
                            title={
                              isActive ? "Disable Employee" : "Enable Employee"
                            }
                          >
                            <FormControlLabel
                              control={
                                <Switch
                                  checked={isActive}
                                  onChange={() =>
                                    handleToggleEmployeeStatus(employee)
                                  }
                                  color={isActive ? "primary" : "secondary"}
                                />
                              }
                              label=""
                            />
                          </Tooltip>
                        </TableCell>
                        {user && user.role === "HR" && (
                          <TableCell>
                            <Tooltip title="Reset Mobile ID">
                              <IconButton
                                sx={{
                                  backgroundColor: "red",
                                  color: "white",
                                  ":hover": { backgroundColor: "darkred" },
                                }}
                                onClick={() =>
                                  handleRemoveMobileID(employee.EmpId)
                                }
                              >
                                <RestartAltIcon />
                              </IconButton>
                            </Tooltip>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={user && user.role === "HR" ? 9 : 8}
                    align="center"
                  >
                    No employees found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Summary information */}
        <Box
          sx={{
            mt: 2,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Chip
              label={`Total Employees: ${employees.length}`}
              color="primary"
              variant="outlined"
            />
            <Chip
              label={`Active: ${activeCount}`}
              color="success"
              variant="outlined"
            />
            <Chip
              label={`Inactive: ${inactiveCount}`}
              color="error"
              variant="outlined"
            />
          </Box>
          {hasActiveFilters() && (
            <Chip
              label={`Filtered: ${filteredEmployees.length}`}
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>

        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={filteredEmployees.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Box>

      <Dialog open={openForm} onClose={handleCloseForm} maxWidth="md" fullWidth>
        <DialogTitle>
          {formMode === "add" ? "Add Employee" : "Edit Employee"}
        </DialogTitle>

        <DialogContent>
          <form onSubmit={handleFormSubmit} style={{ marginTop: "10px" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Employee ID"
                  value={formData.EmpId}
                  disabled
                  helperText={
                    formMode === "add" 
                      ? "Auto-generated from last Employee ID" 
                      : "Employee ID cannot be changed"
                  }
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Name"
                  value={formData.Name}
                  onChange={(e) =>
                    setFormData({ ...formData, Name: e.target.value })
                  }
                  required
                />
              </Grid>
              
              {/* Password field only shown in add mode */}
              {formMode === "add" && (
                <Grid item xs={12} md={6}>
                  <TextField
                    fullWidth
                    label="Password"
                    type="password"
                    value={formData.Password}
                    onChange={(e) =>
                      setFormData({ ...formData, Password: e.target.value })
                    }
                    required
                    helperText="Enter password for new employee"
                  />
                </Grid>
              )}
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Mobile"
                  value={formData.Mobile}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value.length <= 10) {
                      setFormData({ ...formData, Mobile: value });
                    }
                  }}
                  required
                  type="number"
                  inputProps={{ maxLength: 10 }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Email"
                  type="email"
                  value={formData.EmailId}
                  onChange={(e) =>
                    setFormData({ ...formData, EmailId: e.target.value })
                  }
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Category"
                  value={formData.Category}
                  onChange={(e) =>
                    setFormData({ ...formData, Category: e.target.value })
                  }
                  required
                >
                  <MenuItem value="">Select Category</MenuItem>
                  <MenuItem value="Teaching">Teaching</MenuItem>
                  <MenuItem value="Non Teaching">Non Teaching</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  select
                  fullWidth
                  label="Role"
                  value={formData.Role}
                  onChange={(e) =>
                    setFormData({ ...formData, Role: e.target.value })
                  }
                  required
                >
                  <MenuItem value="">Select Role</MenuItem>
                  <MenuItem value="HR">HR</MenuItem>
                  <MenuItem value="Employee">Employee</MenuItem>
                  <MenuItem value="Librarian">Librarian</MenuItem>
                  <MenuItem value="Accounts">Accounts</MenuItem>
                  <MenuItem value="Front Desk">Front Desk</MenuItem>
                </TextField>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  type="text"
                  value={formData.Designation}
                  onChange={(e) =>
                    setFormData({ ...formData, Designation: e.target.value })
                  }
                  required
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Reporting Manager ID (RM)"
                  value={formData.RM}
                  onChange={(e) =>
                    setFormData({ ...formData, RM: e.target.value })
                  }
                  helperText="Optional: Enter Reporting Manager's EmpId"
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>Week Off</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(formData.WeekOff) ? formData.WeekOff : []}
                    onChange={handleWeekOffChange}
                    label="Week Off"
                    renderValue={(selected) => selected.join(", ")}
                  >
                    {daysOfWeek.map((day) => (
                      <MenuItem key={day} value={day}>
                        <Checkbox
                          checked={formData.WeekOff?.includes(day) || false}
                        />
                        <ListItemText primary={day} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  type="date"
                  value={formData.DOB}
                  onChange={(e) =>
                    setFormData({ ...formData, DOB: e.target.value })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    max: new Date().toISOString().split("T")[0]
                  }}
                />
              </Grid>
              
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Date of Joining"
                  type="date"
                  value={formData.JoinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, JoinDate: e.target.value })
                  }
                  InputLabelProps={{
                    shrink: true,
                  }}
                  inputProps={{
                    max: new Date().toISOString().split("T")[0]
                  }}
                />
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Shift</InputLabel>
                  <Select
                    value={formData.Shift}
                    onChange={(e) =>
                      setFormData({ ...formData, Shift: e.target.value })
                    }
                    label="Shift"
                  >
                    <MenuItem value="">Select Shift</MenuItem>
                    <MenuItem value="9:00 AM - 6:00 PM">
                      9:00 AM - 6:00 PM
                    </MenuItem>
                    <MenuItem value="9:30 AM - 6:30 PM">
                      9:30 AM - 6:30 PM
                    </MenuItem>
                    <MenuItem value="10:00 AM - 7:00 PM">
                      10:00 AM - 7:00 PM
                    </MenuItem>
                    <MenuItem value="11:00 AM - 8:00 PM">
                      11:00 AM - 8:00 PM
                    </MenuItem>
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth required>
                  <InputLabel>Office</InputLabel>
                  <Select
                    multiple
                    value={Array.isArray(formData.OfficeId) ? formData.OfficeId : []}
                    onChange={handleOfficeChange}
                    label="Office"
                    renderValue={(selected) =>
                      selected
                        .map((id) => {
                          const office = offices.find(o => o.Id.toString() === id.toString());
                          return office ? office.OfficeName : id;
                        })
                        .join(", ")
                    }
                  >
                    {offices.map((office) => (
                      <MenuItem key={office.Id} value={office.Id}>
                        <Checkbox
                          checked={formData.OfficeId?.includes(office.Id.toString()) || false}
                        />
                        <ListItemText primary={office.OfficeName} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>

              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.IsActive === 1}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            IsActive: e.target.checked ? 1 : 0,
                          })
                        }
                        color="primary"
                      />
                    }
                    label={formData.IsActive === 1 ? "Active" : "Inactive"}
                  />
                </FormControl>
              </Grid>
            </Grid>
            <DialogActions>
              <Button onClick={handleCloseForm} color="primary">
                Cancel
              </Button>
              <Button type="submit" color="primary" variant="contained">
                {formMode === "add" ? "Add Employee" : "Update Employee"}
              </Button>
            </DialogActions>
          </form>
        </DialogContent>
      </Dialog>
      
      <Dialog open={openDetail} onClose={handleCloseDetail}>
        <DialogTitle>Employee Details</DialogTitle>
        <DialogContent></DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetail} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default EmployeeList;