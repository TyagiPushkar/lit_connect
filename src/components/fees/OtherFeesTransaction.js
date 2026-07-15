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
  CircularProgress,
  Typography,
  Grid,
} from "@mui/material";
import SearchIcon from '@mui/icons-material/Search';
import ClearIcon from '@mui/icons-material/Clear';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import axios from "axios";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { useAuth } from "../auth/AuthContext";
import * as XLSX from 'xlsx';

const OtherFeesTransaction = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
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
    Amount: "",
    Mode: "",
    ModeId: "",
    Remark: "",
    Added_By: user?.emp_id || ""
  });

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [particularFilter, setParticularFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sessionFilter, setSessionFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [modeFilter, setModeFilter] = useState("");
const [remarkFilter, setRemarkFilter] = useState("");
  // Static options
  const particularOptions = ["Exam Fees", "Other"];
  const examFeeCategories = [
    "Semester 1",
    "Semester 2",
    "Semester 3",
    "Semester 4",
    "Semester 5",
    "Semester 6",
    "Back Paper"
  ];
  const otherCategories = [
    "Practical Fees",
    "Student Kit, Books & Materials Fees",
    "Student Uniform Fees",
    "Other Fees"
  ];

  useEffect(() => {
    fetchOtherFeesTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, searchTerm, particularFilter, categoryFilter, sessionFilter, fromDate, toDate, modeFilter, remarkFilter]);

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
    fetchStudents();
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFormData({
      Student_id: "",
      particular: "",
      category: "",
      payment_date: new Date().toISOString().split('T')[0],
      Amount: "",
      Mode: "",
      ModeId: "",
      Remark: "",
      Added_By: user?.emp_id || ""
    });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/add_other_fees_transaction.php",
        formData
      );
      if (response.data.success) {
        setSnackbarMessage("Transaction added successfully!");
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

  if (searchTerm) {
    const term = searchTerm.toLowerCase();
    filtered = filtered.filter(
      (item) =>
        item.Student_id.toString().toLowerCase().includes(term) ||
        (item.CandidateName && item.CandidateName.toLowerCase().includes(term))
    );
  }

  if (particularFilter) {
    filtered = filtered.filter(
      (item) => item.particular && item.particular === particularFilter
    );
  }

  if (categoryFilter) {
    filtered = filtered.filter(
      (item) => item.category && item.category === categoryFilter
    );
  }

  if (sessionFilter) {
    filtered = filtered.filter(
      (item) => item.Session && item.Session === sessionFilter
    );
  }

  if (modeFilter) {
    filtered = filtered.filter(
      (item) => item.Mode && item.Mode === modeFilter
    );
  }

  if (remarkFilter) {
    filtered = filtered.filter(
      (item) => item.Remark && item.Remark.toLowerCase().includes(remarkFilter.toLowerCase())
    );
  }

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
      const endOfDay = new Date(toDate);
      endOfDay.setHours(23, 59, 59, 999);
      return paymentDate <= endOfDay;
    });
  }

  setFilteredTransactions(filtered);
  setPage(0);
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
  setModeFilter("");
  setRemarkFilter("");
  setFromDate(null);
  setToDate(null);
};

  const exportToExcel = () => {
    // Prepare data for export
    const dataForExport = filteredTransactions.map(item => ({
      "Student ID": item.Student_id,
      "Student Name": item.CandidateName,
      "Particular": item.particular,
      "Category": item.category,
      "Amount": item.Amount,
      "Payment Mode": item.Mode,
      "Mode ID": item.ModeId,
      "Remark": item.Remark,
      "Payment Date": formatDate(item.payment_date),
      "Session": item.Session
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);
    
    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Other Fees Transactions");
    
    // Generate file name with current date
    const today = new Date();
    const dateString = `${today.getDate()}-${today.getMonth()+1}-${today.getFullYear()}`;
    const fileName = `Other_Fees_Transactions_${dateString}.xlsx`;
    
    // Export the file
    XLSX.writeFile(wb, fileName);
  };

  const uniqueParticulars = [...new Set(transactions.map(item => item.particular))].filter(Boolean);
  const uniqueCategories = [...new Set(transactions.map(item => item.category))].filter(Boolean);
  const uniqueSessions = [...new Set(transactions.map(item => item.Session))].filter(Boolean);
  const uniqueModes = [...new Set(transactions.map(item => item.Mode))].filter(Boolean);

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
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}> {/* Overall container padding */}
        {/* Header Title and Actions */}
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          sx={{
            mb: 2,
            flexDirection: { xs: 'column', sm: 'row' },
            gap: { xs: 2, sm: 0 },
            width: "100%",
            flexShrink: 0
          }}
        >
          <Typography
            variant="h5"
            sx={{
              fontWeight: 'bold',
              color: '#CC7A00',
              fontFamily: '"Outfit", "Inter", sans-serif'
            }}
          >
            Other Fees Transactions
          </Typography>
          <Box display="flex" gap={1.5} sx={{ width: { xs: '100%', sm: 'auto' }, justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleOpenDialog}
              sx={{
                height: 40,
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              Add Transaction
            </Button>
            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              sx={{
                height: 40,
                backgroundColor: '#2e7d32',
                '&:hover': { backgroundColor: '#1b5e20' },
                textTransform: 'none',
                fontWeight: 'medium'
              }}
            >
              Export
            </Button>
          </Box>
        </Box>

        {/* Filters Panel */}
        <Paper
          elevation={1}
          sx={{
            p: 2,
            mb: 2,
            borderRadius: 2,
            backgroundColor: '#ffffff',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            flexShrink: 0
          }}
        >
          <Grid container spacing={2} alignItems="center">
            {/* Search ID/Name */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search ID/Name"
                variant="outlined"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />,
                  endAdornment: searchTerm && (
                    <IconButton size="small" onClick={() => setSearchTerm("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            {/* Search Remark */}
            <Grid item xs={12} sm={6} md={3}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search Remark"
                variant="outlined"
                value={remarkFilter}
                onChange={(e) => setRemarkFilter(e.target.value)}
                InputProps={{
                  startAdornment: <SearchIcon fontSize="small" sx={{ color: 'action.active', mr: 1 }} />,
                  endAdornment: remarkFilter && (
                    <IconButton size="small" onClick={() => setRemarkFilter("")}>
                      <ClearIcon fontSize="small" />
                    </IconButton>
                  ),
                }}
              />
            </Grid>

            {/* Particular */}
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Particular</InputLabel>
                <Select value={particularFilter} label="Particular" onChange={(e) => setParticularFilter(e.target.value)}>
                  <MenuItem value="">All Particulars</MenuItem>
                  {particularOptions.map((particular) => (
                    <MenuItem key={particular} value={particular}>{particular}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Category */}
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Category</InputLabel>
                <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                  <MenuItem value="">All Categories</MenuItem>
                  {[...examFeeCategories, ...otherCategories].map((category) => (
                    <MenuItem key={category} value={category}>{category}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Session */}
            <Grid item xs={6} sm={4} md={2}>
              <FormControl fullWidth size="small">
                <InputLabel>Session</InputLabel>
                <Select value={sessionFilter} label="Session" onChange={(e) => setSessionFilter(e.target.value)}>
                  <MenuItem value="">All Sessions</MenuItem>
                  {uniqueSessions.map((session) => (
                    <MenuItem key={session} value={session}>{session}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {/* Payment Mode */}
            <Grid item xs={6} sm={4} md={3}>
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

            {/* From Date */}
            <Grid item xs={12} sm={4} md={3}>
              <DatePicker
                label="From Date"
                value={fromDate}
                onChange={(newValue) => setFromDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </Grid>

            {/* To Date */}
            <Grid item xs={12} sm={4} md={3}>
              <DatePicker
                label="To Date"
                value={toDate}
                onChange={(newValue) => setToDate(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
                minDate={fromDate}
              />
            </Grid>

            {/* Clear Filters Button */}
            <Grid item xs={12} sm={4} md="auto">
              <Tooltip title="Clear filters">
                <IconButton
                  onClick={clearFilters}
                  sx={{
                    border: '1px solid rgba(0, 0, 0, 0.23)',
                    borderRadius: 1,
                    height: 40,
                    width: 40,
                    backgroundColor: '#ffffff',
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.04)',
                      borderColor: 'rgba(0, 0, 0, 0.87)'
                    }
                  }}
                >
                  <ClearIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        <TableContainer
          component={Paper}
          sx={{
            width: '100%',
            flexGrow: 1,
            overflowY: 'auto',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: '1px solid rgba(224, 224, 224, 1)'
          }}
        >
          <Table stickyHeader>
            <TableHead sx={{ 
              '& th': { 
                backgroundColor: '#CC7A00 !important', 
                color: 'white', 
                fontWeight: 'bold' 
              } 
            }}>
              <TableRow>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Student ID</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Student Name</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Particular</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Category</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Amount</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Payment Mode</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Mode ID</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Remark</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Payment Date</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Session</TableCell>
                <TableCell style={{ color: "white", fontWeight: 'bold' }}>Deposit By</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage).map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>{row.Student_id}</TableCell>
                  <TableCell>{row.CandidateName}</TableCell>
                  <TableCell>{row.particular}</TableCell>
                  <TableCell>{row.category}</TableCell>
                  <TableCell>{row.Amount}</TableCell>
                  <TableCell>{row.Mode}</TableCell>
                  <TableCell>{row.ModeId}</TableCell>
                  <TableCell>{row.Remark}</TableCell>
                  <TableCell>{formatDate(row.payment_date)}</TableCell>
                  <TableCell>{row.Session}</TableCell>
                  <TableCell>{row.Added_By}</TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter sx={{ 
              position: 'sticky', 
              bottom: 0, 
              backgroundColor: '#ffffff', 
              zIndex: 1,
              '& td': { backgroundColor: '#ffffff' }
            }}>
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

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Other Fee Transaction</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
            <DatePicker
  label="Payment Date"
  value={formData.payment_date}
  onChange={(newValue) =>
    setFormData((prev) => ({ ...prev, payment_date: newValue }))
  }
  format="DD/MM/YYYY" // <- use this prop to display in dd/mm/yyyy format
  renderInput={(params) => (
    <TextField {...params} fullWidth margin="normal" required />
  )}
/>


              <Autocomplete
  options={students}
  getOptionLabel={(option) =>
    `${option.StudentID} - ${option.CandidateName} - ${option.Course || ""} - ${option.Session || ""}`
  }
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
                  onChange={(e) => {
                    setFormData(prev => ({
                      ...prev,
                      particular: e.target.value,
                      category: ""
                    }));
                  }}
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
                  disabled={!formData.particular}
                >
                  {formData.particular === "Exam Fees" ? (
                    examFeeCategories.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))
                  ) : formData.particular === "Other" ? (
                    otherCategories.map((option) => (
                      <MenuItem key={option} value={option}>{option}</MenuItem>
                    ))
                  ) : (
                    <MenuItem value="">Select Particular first</MenuItem>
                  )}
                </Select>
              </FormControl>
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
              <FormControl fullWidth margin="normal" required>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  name="Mode"
                  value={formData.Mode}
                  onChange={handleInputChange}
                  label="Payment Mode"
                >
                  {["Cash", "Online", "Cheque"].map((option) => (
                    <MenuItem key={option} value={option}>{option}</MenuItem>
                  ))}
                </Select>
              </FormControl>

              {formData.Mode !== "Cash" && (
                <TextField
                  fullWidth
                  margin="normal"
                  name="ModeId"
                  label={`${formData.Mode} Reference/Transaction ID`}
                  value={formData.ModeId}
                  onChange={handleInputChange}
                  required
                  error={formData.Mode !== "Cash" && !formData.ModeId?.trim()}
                  helperText={formData.Mode !== "Cash" && !formData.ModeId?.trim() ? "This field is required" : ""}
                />
              )}
              
              <TextField
                name="Remark"
                label="Remark"
                value={formData.Remark}
                onChange={handleInputChange}
                fullWidth
                margin="normal"
                multiline
                rows={2}
              />
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button 
              onClick={handleSubmit} 
              variant="contained" 
              color="primary"
              disabled={
                !formData.Student_id || 
                !formData.particular || 
                !formData.category || 
                !formData.payment_date || 
                !formData.Amount ||
                !formData.Mode ||
                (formData.Mode !== "Cash" && !formData.ModeId?.trim())
              }
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
      </Box>
    </LocalizationProvider>
  );
};

export default OtherFeesTransaction;