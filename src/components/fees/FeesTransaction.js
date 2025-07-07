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
  Tooltip
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import axios from "axios";
import AddFeeStructureDialog from "./AddFeeStructureDialog";
import { useNavigate } from "react-router-dom";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const FeesTransaction = () => {
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
  const [courseFilter, setCourseFilter] = useState("");
  const [installmentFilter, setInstallmentFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchFeeStructures();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [structures, searchTerm, courseFilter, installmentFilter, sessionFilter, fromDate, toDate]);

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
          item.stu_id.toString().includes(term) ||
          (item.CandidateName && item.CandidateName.toLowerCase().includes(term))
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
    setCourseFilter("");
    setInstallmentFilter("");
    setSessionFilter("");
    setFromDate(null);
    setToDate(null);
  };

  // Get unique values for filters
  const uniqueCourses = [...new Set(structures.map(item => item.course))].filter(Boolean);
  const uniqueInstallments = [...new Set(structures.map(item => item.installment))].filter(Boolean);
  const uniqueSessions = [...new Set(structures.map(item => item.Session))].filter(Boolean);

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
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 0,
          }}
        >
          <h2>Fee Transaction List</h2>
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <TextField
              size="small"
              placeholder="Search ID/Name"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />
                ),
                endAdornment: searchTerm && (
                  <IconButton size="small" onClick={() => setSearchTerm("")}>
                    <ClearIcon fontSize="small" />
                  </IconButton>
                ),
              }}
              sx={{ width: 180 }}
            />

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Course</InputLabel>
              <Select
                value={courseFilter}
                label="Course"
                onChange={(e) => setCourseFilter(e.target.value)}
              >
                <MenuItem value="">All Courses</MenuItem>
                {uniqueCourses.map((course) => (
                  <MenuItem key={course} value={course}>{course}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Installment</InputLabel>
              <Select
                value={installmentFilter}
                label="Installment"
                onChange={(e) => setInstallmentFilter(e.target.value)}
              >
                <MenuItem value="">All Installments</MenuItem>
                {uniqueInstallments.map((installment) => (
                  <MenuItem key={installment} value={installment}>{installment}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Session</InputLabel>
              <Select
                value={sessionFilter}
                label="Session"
                onChange={(e) => setSessionFilter(e.target.value)}
              >
                <MenuItem value="">All Sessions</MenuItem>
                {uniqueSessions.map((session) => (
                  <MenuItem key={session} value={session}>
                    {session}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <DatePicker
              label="From Date"
              value={fromDate}
              onChange={(newValue) => setFromDate(newValue)}
              renderInput={(params) => <TextField {...params} size="small" sx={{ width: 150 }} />}
            />

            <DatePicker
              label="To Date"
              value={toDate}
              onChange={(newValue) => setToDate(newValue)}
              renderInput={(params) => <TextField {...params} size="small" sx={{ width: 150 }} />}
              minDate={fromDate}
            />

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
          </Box>
        </div>

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
                {/* <TableCell style={{ color: "white" }}>Exam Fees</TableCell> */}
                <TableCell style={{ color: "white" }}>Extra Fees</TableCell>
                {/* <TableCell style={{ color: "white" }}>Scholarship</TableCell> */}
                <TableCell style={{ color: "white" }}>Mode</TableCell>
                <TableCell style={{ color: "white" }}>Mode Id</TableCell>
                <TableCell style={{ color: "white" }}>Total Amount</TableCell>
                <TableCell style={{ color: "white" }}>Deposit Amount</TableCell>
                <TableCell style={{ color: "white" }}>Balance Amount</TableCell>
                <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                <TableCell style={{ color: "white" }}>Remark</TableCell>
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
                    {/* <TableCell>{row.exam_fees}</TableCell> */}
                    <TableCell>{row.variable_fees}</TableCell>
                    {/* <TableCell>{(row.tuition_fees+row.hostel_fees+row.exam_fees)-row.total_amount}</TableCell> */}
                    <TableCell>{row.mode}</TableCell>
                    <TableCell>{row.mode_id}</TableCell>
                    <TableCell>{row.total_amount}</TableCell>
                    <TableCell>{row.deposit_amount}</TableCell>
                    <TableCell>{row.balance_amount}</TableCell>
                    <TableCell>{formatDate(row.payment_date)}</TableCell>
                    <TableCell>{row.Remark}</TableCell>
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
      </div>
    </LocalizationProvider>
  );
};

export default FeesTransaction;