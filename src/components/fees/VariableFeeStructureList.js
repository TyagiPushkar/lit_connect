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
  Grid,
  FormControl,
  InputLabel,
  Select,
  Box,
  IconButton,
  Tooltip,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as XLSX from "xlsx";

const VariableFeeStructureList = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [structures, setStructures] = useState([]);
  const [filteredStructures, setFilteredStructures] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [remarksSearchTerm, setRemarksSearchTerm] = useState("");
  const [particularFilter, setParticularFilter] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    structures,
    searchTerm,
    remarksSearchTerm,
    particularFilter,
    paymentStatusFilter,
    fromDate,
    toDate,
  ]);

  const fetchFeeStructures = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/fees/variable.php",
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

    // Apply search filter (by student_id)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.student_id?.toString().toLowerCase().includes(term),
      );
    }

    // Apply remarks search filter
    if (remarksSearchTerm) {
      const term = remarksSearchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) => item.remarks && item.remarks.toLowerCase().includes(term),
      );
    }

    // Apply particular filter
    if (particularFilter) {
      filtered = filtered.filter(
        (item) => item.particular && item.particular === particularFilter,
      );
    }

    // Apply payment status filter
    if (paymentStatusFilter) {
      filtered = filtered.filter(
        (item) =>
          item.payment_status && item.payment_status === paymentStatusFilter,
      );
    }

    // Apply date range filter (using DateTime field)
    if (fromDate) {
      filtered = filtered.filter((item) => {
        if (!item.DateTime) return false;
        const itemDate = new Date(item.DateTime);
        return itemDate >= new Date(fromDate);
      });
    }
    if (toDate) {
      filtered = filtered.filter((item) => {
        if (!item.DateTime) return false;
        const itemDate = new Date(item.DateTime);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        return itemDate <= endOfDay;
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
    setRemarksSearchTerm("");
    setParticularFilter("");
    setPaymentStatusFilter("");
    setFromDate(null);
    setToDate(null);
  };

  const exportToExcel = () => {
    // Prepare data for export
    const dataForExport = filteredStructures.map((item) => ({
      ID: item.id,
      "Student ID": item.student_id,
      Particular: item.particular,
      Amount: item.amount,
      // Paid: item.Paid,
      "Date/Time": formatDateTime(item.DateTime),
      // "Payment Status": item.payment_status,
      "Paid Amount": item.paid_amount,
      "Payment Date": formatDate(item.payment_date),
      Remarks: item.remarks,
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Variable Fee Transactions");

    // Generate file name with current date
    const today = new Date();
    const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const fileName = `Variable_Fee_Transactions_${dateString}.xlsx`;

    // Export the file
    XLSX.writeFile(wb, fileName);
  };

  // Get unique values for filters
  const uniqueParticulars = [
    ...new Set(structures.map((item) => item.particular)),
  ].filter(Boolean);

  const paymentStatuses = ["paid", "unpaid"];

  const formatDateTime = (datetime) => {
    if (!datetime) return "-";
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const formatDate = (date) => {
    if (!date) return "-";
    const dateObj = new Date(date);
    const day = String(dateObj.getDate()).padStart(2, "0");
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
  };

  const getStatusChip = (status) => {
    const color = status === "paid" ? "success" : "error";
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pt: 1 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={4}>
            <h2>Variable Fee List</h2>
          </Grid>
          <Grid item xs={12} md={8}>
            <Grid container spacing={1} alignItems="center">
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Student ID"
                  variant="outlined"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "action.active", mr: 1 }}
                      />
                    ),
                    endAdornment: searchTerm && (
                      <IconButton
                        size="small"
                        onClick={() => setSearchTerm("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  size="small"
                  placeholder="Search Remarks"
                  variant="outlined"
                  value={remarksSearchTerm}
                  onChange={(e) => setRemarksSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <SearchIcon
                        fontSize="small"
                        sx={{ color: "action.active", mr: 1 }}
                      />
                    ),
                    endAdornment: remarksSearchTerm && (
                      <IconButton
                        size="small"
                        onClick={() => setRemarksSearchTerm("")}
                      >
                        <ClearIcon fontSize="small" />
                      </IconButton>
                    ),
                  }}
                />
              </Grid>
              {/* <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Particular</InputLabel>
                  <Select
                    value={particularFilter}
                    label="Particular"
                    onChange={(e) => setParticularFilter(e.target.value)}
                  >
                    <MenuItem value="">All Particulars</MenuItem>
                    {uniqueParticulars.map((particular) => (
                      <MenuItem key={particular} value={particular}>
                        {particular}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid> */}
              {/* <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Payment Status</InputLabel>
                  <Select
                    value={paymentStatusFilter}
                    label="Payment Status"
                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {paymentStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid> */}
              <Grid item xs={12} sm={6} md={2.5}>
                <DatePicker
                  label="From Date"
                  value={fromDate}
                  onChange={(newValue) => setFromDate(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.5}>
                <DatePicker
                  label="To Date"
                  value={toDate}
                  onChange={(newValue) => setToDate(newValue)}
                  renderInput={(params) => (
                    <TextField {...params} fullWidth size="small" />
                  )}
                  minDate={fromDate}
                />
              </Grid>
              <Grid item xs={6} sm={3} md="auto">
                <Tooltip title="Clear filters">
                  <IconButton
                    size="small"
                    onClick={clearFilters}
                    sx={{
                      border: "1px solid rgba(0, 0, 0, 0.23)",
                      borderRadius: 1,
                      p: "6px",
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
              <Grid item xs={6} sm={3} md="auto">
                <Button
                  variant="contained"
                  color="warning"
                  startIcon={<DownloadIcon />}
                  onClick={() => navigate("/variable-transactions")}
                  fullWidth
                >
                  Variable Fee Transactions
                </Button>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead style={{ backgroundColor: "#CC7A00" }}>
              <TableRow>
                <TableCell style={{ color: "white" }}>ID</TableCell>
                <TableCell style={{ color: "white" }}>Student ID</TableCell>
                <TableCell style={{ color: "white" }}>Particular</TableCell>
                <TableCell style={{ color: "white" }}>Amount</TableCell>
                {/* <TableCell style={{ color: "white" }}>Paid</TableCell> */}
                <TableCell style={{ color: "white" }}>Date/Time</TableCell>
                {/* <TableCell style={{ color: "white" }}>Payment Status</TableCell> */}
                <TableCell style={{ color: "white" }}>Paid Amount</TableCell>
                <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                <TableCell style={{ color: "white" }}>Remarks</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredStructures
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.id}</TableCell>
                    <TableCell>{row.student_id}</TableCell>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell>{row.amount}</TableCell>
                    {/* <TableCell>{row.Paid}</TableCell> */}
                    <TableCell>{formatDateTime(row.DateTime)}</TableCell>
                    {/* <TableCell>{getStatusChip(row.payment_status)}</TableCell> */}
                    <TableCell>{row.paid_amount}</TableCell>
                    <TableCell>{formatDate(row.payment_date)}</TableCell>
                    <TableCell>{row.remarks || "-"}</TableCell>
                  </TableRow>
                ))}
              {filteredStructures.length === 0 && (
                <TableRow>
                  <TableCell colSpan={10} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
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

export default VariableFeeStructureList;
