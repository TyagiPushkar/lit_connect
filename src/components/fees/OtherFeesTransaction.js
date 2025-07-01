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
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Box,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Autocomplete,
  CircularProgress
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import axios from "axios";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';

const OtherFeesTransaction = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [students, setStudents] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    Student_id: "",
    particular: "",
    category: "",
    payment_date: new Date().toISOString().split('T')[0],
    Amount: ""
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [particularFilter, setParticularFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  // Static options
  const particularOptions = ["Exam Fees", "Others"];
  const categoryOptions = [
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
    "Semester 5",
    "Semester 6",
    "Other"
  ];

  useEffect(() => {
    fetchOtherFeesTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, particularFilter, categoryFilter, sessionFilter, fromDate, toDate]);

  const fetchOtherFeesTransactions = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/fees/get_other_fees_transactions.php",
      );
      if (response.data.success) {
        setTransactions(response.data.data);
      } else {
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Failed to fetch other fees transactions.");
      setOpenSnackbar(true);
    }
  };

  const fetchStudents = async (searchText = "") => {
    setLoadingStudents(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/students/get_student.php?search=${searchText}`
      );
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      setSnackbarMessage("Failed to fetch students.");
      setOpenSnackbar(true);
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleOpenDialog = () => {
    setDialogOpen(true);
    fetchStudents(); // Fetch all students initially
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      Student_id: "",
      particular: "",
      category: "",
      payment_date: new Date().toISOString().split('T')[0],
      Amount: ""
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/add_other_fees_transaction.php",
        formData
      );
      if (response.data.success) {
        setSnackbarMessage("Other fee transaction added successfully!");
        setOpenSnackbar(true);
        fetchOtherFeesTransactions();
        handleCloseDialog();
      } else {
        setSnackbarMessage(response.data.message || "Failed to add transaction");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error adding transaction");
      setOpenSnackbar(true);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDateChange = (date) => {
    setFormData(prev => ({
      ...prev,
      payment_date: date ? date.toISOString().split('T')[0] : ""
    }));
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply search filter (by ID or name)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.Student_id.toString().toLowerCase().includes(term) ||
          (item.CandidateName && item.CandidateName.toLowerCase().includes(term))
      );
    }

    // Apply particular filter
    if (particularFilter) {
      filtered = filtered.filter(
        (item) => item.particular && item.particular === particularFilter
      );
    }

    // Apply category filter
    if (categoryFilter) {
      filtered = filtered.filter(
        (item) => item.category && item.category === categoryFilter
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

    setFilteredTransactions(filtered);
    setPage(0); // Reset to first page when filters change
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setParticularFilter("");
    setCategoryFilter("");
    setSessionFilter("");
    setFromDate(null);
    setToDate(null);
  };

  // Get unique values for filters from existing data
  const uniqueParticulars = [...new Set(transactions.map(item => item.particular))].filter(Boolean);
  const uniqueCategories = [...new Set(transactions.map(item => item.category))].filter(Boolean);
  const uniqueSessions = [...new Set(transactions.map(item => item.Session))].filter(Boolean);

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <div>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 0,
            marginTop: 3,
          }}
        >
          <h2>Other Fees Transactions</h2>
          <Box sx={{ 
            display: 'flex', 
            gap: 1, 
            mb: 2,
            alignItems: 'center',
            flexWrap: 'wrap'
          }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{ mr: 2 }}
            >
              Add Transaction
            </Button>

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
              <InputLabel>Particular</InputLabel>
              <Select
                value={particularFilter}
                label="Particular"
                onChange={(e) => setParticularFilter(e.target.value)}
              >
                <MenuItem value="">All Particulars</MenuItem>
                {particularOptions.map((particular) => (
                  <MenuItem key={particular} value={particular}>{particular}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select
                value={categoryFilter}
                label="Category"
                onChange={(e) => setCategoryFilter(e.target.value)}
              >
                <MenuItem value="">All Categories</MenuItem>
                {categoryOptions.map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
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
        
        <TableContainer component={Paper}>
          <Table>
            <TableHead style={{ backgroundColor: "#CC7A00" }}>
              <TableRow>
                <TableCell style={{ color: "white" }}>Student ID</TableCell>
                <TableCell style={{ color: "white" }}>Student Name</TableCell>
                <TableCell style={{ color: "white" }}>Particular</TableCell>
                <TableCell style={{ color: "white" }}>Category</TableCell>
                <TableCell style={{ color: "white" }}>Amount</TableCell>
                <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                <TableCell style={{ color: "white" }}>Session</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.id} hover>
                    <TableCell>{row.Student_id}</TableCell>
                    <TableCell>{row.CandidateName}</TableCell>
                    <TableCell>{row.particular}</TableCell>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>{row.Amount}</TableCell>
                    <TableCell>{row.payment_date}</TableCell>
                    <TableCell>{row.Session}</TableCell>
                  </TableRow>
                ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TablePagination
                  rowsPerPageOptions={[5, 10, 15, 25]}
                  count={filteredTransactions.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </TableRow>
            </TableFooter>
          </Table>
        </TableContainer>

        {/* Add Transaction Dialog */}
        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Other Fee Transaction</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
              <Autocomplete
                options={students}
                getOptionLabel={(option) => `${option.StudentID} - ${option.CandidateName}`}
                value={students.find(student => student.StudentID === formData.Student_id) || null}
                onChange={(event, newValue) => {
                  setFormData(prev => ({
                    ...prev,
                    Student_id: newValue?.StudentID || ""
                  }));
                }}
                onInputChange={(event, newInputValue) => {
                  fetchStudents(newInputValue);
                }}
                loading={loadingStudents}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Student"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    required
                    InputProps={{
                      ...params.InputProps,
                      endAdornment: (
                        <>
                          {loadingStudents ? <CircularProgress color="inherit" size={20} /> : null}
                          {params.InputProps.endAdornment}
                        </>
                      ),
                    }}
                  />
                )}
              />

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Particular</InputLabel>
                <Select
                  name="particular"
                  value={formData.particular}
                  onChange={handleInputChange}
                  label="Particular"
                >
                  {particularOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth margin="normal" required>
                <InputLabel>Category</InputLabel>
                <Select
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  label="Category"
                >
                  {categoryOptions.map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              <DatePicker
                label="Payment Date"
                value={formData.payment_date}
                onChange={handleDateChange}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    fullWidth
                    margin="normal"
                    required
                  />
                )}
              />

              <TextField
                name="Amount"
                label="Amount"
                type="number"
                value={formData.Amount}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                required
                inputProps={{
                  step: "0.01"
                }}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={!formData.Student_id || !formData.particular || !formData.category || !formData.payment_date || !formData.Amount}
            >
              Submit
            </Button>
          </DialogActions>
        </Dialog>

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

export default OtherFeesTransaction;