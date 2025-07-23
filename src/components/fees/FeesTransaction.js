"use client"; // This directive is necessary for client-side React components in Next.js App Router

import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Snackbar,
  TablePagination,
  TableFooter,
  Button,
  TextField,
  MenuItem,
  Grid, // Import Grid
  FormControl,
  InputLabel,
  Select,
  Box,
  IconButton,
  Tooltip,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import DownloadIcon from '@mui/icons-material/Download';
import axios from "axios";
// Assuming AddFeeStructureDialog is a separate component you have
// import AddFeeStructureDialog from "./AddFeeStructureDialog";
// Assuming useNavigate is used for routing, keep it if needed elsewhere
import { useNavigate } from "react-router-dom";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import * as XLSX from 'xlsx';

// Placeholder for AddFeeStructureDialog if it's not provided
const AddFeeStructureDialog = ({ open, onClose, onSuccess }) => {
  if (!open) return null;
  return (
    <div style={{
      position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
      backgroundColor: 'white', padding: '20px', border: '1px solid #ccc', zIndex: 1000
    }}>
      <h3>Add Fee Structure Dialog (Placeholder)</h3>
      <p>This is a placeholder for your AddFeeStructureDialog component.</p>
      <Button onClick={onClose}>Close</Button>
    </div>
  );
};


const FeesTransaction = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [structures, setStructures] = useState([]);
  const [filteredStructures, setFilteredStructures] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate(); // Keep if used elsewhere, otherwise can be removed

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [remarkSearchTerm, setRemarkSearchTerm] = useState("");
  const [courseFilter, setCourseFilter] = useState("");
  const [installmentFilter, setInstallmentFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [structures, searchTerm, remarkSearchTerm, courseFilter, installmentFilter, sessionFilter, modeFilter, fromDate, toDate]);

  const fetchFeeStructures = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/fees/get_all_transactions.php",
      );
      if (response.data.success) {
        setStructures(response.data.data);
      } else {
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Failed to fetch fee structures.");
      setOpenSnackbar(true);
    }
  };

  const applyFilters = () => {
    let filtered = [...structures];
    // Apply search filter (by ID or name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.stu_id?.toString().toLowerCase().includes(term) ||
          (item.CandidateName && item.CandidateName.toLowerCase().includes(term))
      );
    }
    // Apply remark search filter
    if (remarkSearchTerm) {
      const term = remarkSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.Remark && item.Remark.toLowerCase().includes(term)
      );
    }
    // Apply course filter
    if (courseFilter) {
      filtered = filtered.filter(
        (item) => item.course && item.course === courseFilter
      );
    }
    // Apply installment filter
    if (installmentFilter) {
      filtered = filtered.filter(
        (item) => item.installment && item.installment === installmentFilter
      );
    }
    // Apply session filter
    if (sessionFilter) {
      filtered = filtered.filter(
        (item) => item.Session && item.Session === sessionFilter
      );
    }
    // Apply mode filter
    if (modeFilter) {
      filtered = filtered.filter(
        (item) => item.mode && item.mode === modeFilter
      );
    }
    // Apply date range filter
    if (fromDate) {
      filtered = filtered.filter(item => {
        if (!item.payment_date) return false;
        const paymentDate = new Date(item.payment_date);
        return paymentDate >= new Date(fromDate);
      });
    }
    if (toDate) {
      filtered = filtered.filter(item => {
        if (!item.payment_date) return false;
        const paymentDate = new Date(item.payment_date);
        // Set to end of day for toDate comparison
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        return paymentDate <= endOfDay;
      });
    }
    setFilteredStructures(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setRemarkSearchTerm("");
    setCourseFilter("");
    setInstallmentFilter("");
    setSessionFilter("");
    setModeFilter("");
    setFromDate(null);
    setToDate(null);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const dataForExport = filteredStructures.map(item => ({
      "Student ID": item.stu_id,
      "Student Name": item.CandidateName,
      "Course": item.course,
      "Session": item.Session,
      "Installment": item.installment,
      "Tuition Fees": item.tuition_fees,
      "Hostel Fees": item.hostel_fees,
      "Extra Fees": item.variable_fees,
      "Payment Mode": item.mode,
      "Mode ID": item.mode_id,
      "Total Amount": item.total_amount,
      "Deposit Amount": item.deposit_amount,
      "Balance Amount": item.balance_amount,
      "Payment Date": formatDate(item.payment_date),
      "Remark": item.Remark,
      "Deposit By": item.added_by
    }));
    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Fee Transactions");

    // Generate file name with current date
    const today = new Date();
    const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const fileName = `Fee_Transactions_${dateString}.xlsx`;

    // Export the file
    XLSX.writeFile(wb, fileName);
  };

  // Get unique values for filters
  const uniqueCourses = [...new Set(structures.map(item => item.course))].filter(Boolean);
  const uniqueInstallments = [...new Set(structures.map(item => item.installment))].filter(Boolean);
  const uniqueSessions = [...new Set(structures.map(item => item.Session))].filter(Boolean);
  const uniqueModes = [...new Set(structures.map(item => item.mode))].filter(Boolean);

  const formatDate = (datetime) => {
    if (!datetime) return "-";
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pt:1 }}> {/* Added a Box for overall padding */}
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <h2>Fee Transaction List</h2>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={1} alignItems="center"> {/* Inner grid for filters */}
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search ID/Name"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (<SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />),
                    endAdornment: searchTerm && (<IconButton size="small" onClick={() => setSearchTerm("")}><ClearIcon fontSize="small" /></IconButton>),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Remark"
                  variant="outlined"
                  value={remarkSearchTerm}
                  onChange={(e) => setRemarkSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (<SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />),
                    endAdornment: remarkSearchTerm && (<IconButton size="small" onClick={() => setRemarkSearchTerm("")}><ClearIcon fontSize="small" /></IconButton>),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Course</InputLabel>
                  <Select value={courseFilter} label="Course" onChange={(e) => setCourseFilter(e.target.value)}>
                    <MenuItem value="">All Courses</MenuItem>
                    {uniqueCourses.map((course) => (
                      <MenuItem key={course} value={course}>{course}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Installment</InputLabel>
                  <Select value={installmentFilter} label="Installment" onChange={(e) => setInstallmentFilter(e.target.value)}>
                    <MenuItem value="">All Installments</MenuItem>
                    {uniqueInstallments.map((installment) => (
                      <MenuItem key={installment} value={installment}>{installment}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Session</InputLabel>
                  <Select value={sessionFilter} label="Session" onChange={(e) => setSessionFilter(e.target.value)}>
                    <MenuItem value="">All Sessions</MenuItem>
                    {uniqueSessions.map((session) => (
                      <MenuItem key={session} value={session}>
                        {session}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Mode</InputLabel>
                  <Select value={modeFilter} label="Payment Mode" onChange={(e) => setModeFilter(e.target.value)}>
                    <MenuItem value="">All Modes</MenuItem>
                    {uniqueModes.map((mode) => (
                      <MenuItem key={mode} value={mode}>{mode}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                  minDate={fromDate}
                />
              </Grid>
              <Grid item xs={6} sm={3} md="auto">
                <Tooltip title="Clear filters">
                  <IconButton
                    size="small"
                    onClick={clearFilters}
                    sx={{
                      border: '1px solid rgba(0, 0, 0, 0.23)',
                      borderRadius: 1,
                      p: '6px'
                    }}
                  >
                    <ClearIcon fontSize="small" />
                  </IconButton>
                </Tooltip>
              </Grid>
              <Grid item xs={6} sm={3} md="auto">
                <Button
                  variant="contained"
                  color="success"
                  startIcon={<DownloadIcon />}
                  onClick={exportToExcel}
                  fullWidth
                >
                  Export
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* AddFeeStructureDialog is assumed to be an external component */}
        <AddFeeStructureDialog
          open={dialogOpen}
          onClose={() => setDialogOpen(false)}
          onSuccess={fetchFeeStructures}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead style={{ backgroundColor: "#CC7A00" }}>
              <TableRow>
                <TableCell style={{ color: "white" }}>Student ID</TableCell>
                <TableCell style={{ color: "white" }}>Student Name</TableCell>
                <TableCell style={{ color: "white" }}>Course</TableCell>
                <TableCell style={{ color: "white" }}>Session</TableCell>
                <TableCell style={{ color: "white" }}>Installment</TableCell>
                <TableCell style={{ color: "white" }}>Tuition Fees</TableCell>
                <TableCell style={{ color: "white" }}>Hostel Fees</TableCell>
                <TableCell style={{ color: "white" }}>Extra Fees</TableCell>
                <TableCell style={{ color: "white" }}>Mode</TableCell>
                <TableCell style={{ color: "white" }}>Mode Id</TableCell>
                <TableCell style={{ color: "white" }}>Total Amount</TableCell>
                <TableCell style={{ color: "white" }}>Deposit Amount</TableCell>
                <TableCell style={{ color: "white" }}>Balance Amount</TableCell>
                <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                <TableCell style={{ color: "white" }}>Remark</TableCell>
                <TableCell style={{ color: "white" }}>Deposit By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStructures
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.stu_id}</TableCell>
                    <TableCell>{row.CandidateName}</TableCell>
                    <TableCell>{row.course}</TableCell>
                    <TableCell>{row.Session}</TableCell>
                    <TableCell>{row.installment}</TableCell>
                    <TableCell>{row.tuition_fees}</TableCell>
                    <TableCell>{row.hostel_fees}</TableCell>
                    <TableCell>{row.variable_fees}</TableCell>
                    <TableCell>{row.mode}</TableCell>
                    <TableCell>{row.mode_id}</TableCell>
                    <TableCell>{row.total_amount}</TableCell>
                    <TableCell>{row.deposit_amount}</TableCell>
                    <TableCell>{row.balance_amount}</TableCell>
                    <TableCell>{formatDate(row.payment_date)}</TableCell>
                    <TableCell>{row.Remark}</TableCell>
                    <TableCell>{row.added_by}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  count={filteredStructures.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>
        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
          message={snackbarMessage}
        />
      </Box>
    </LocalizationProvider>
  );
};

export default FeesTransaction;