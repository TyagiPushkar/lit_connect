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
  }, [transactions, searchTerm, particularFilter, categoryFilter, sessionFilter, fromDate, toDate, modeFilter]);

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
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 0, marginTop: 3 }}>
          <h2>Other Fees Transactions</h2>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpenDialog} sx={{ mr: 2 }}>
              Add Transaction
            </Button>

            <Button
              variant="contained"
              color="success"
              startIcon={<DownloadIcon />}
              onClick={exportToExcel}
              sx={{ mr: 0 }}
            >
              
            </Button>

            <TextField
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
              sx={{ width: 180 }}
            />

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Particular</InputLabel>
              <Select value={particularFilter} label="Particular" onChange={(e) => setParticularFilter(e.target.value)}>
                <MenuItem value="">All Particulars</MenuItem>
                {particularOptions.map((particular) => (
                  <MenuItem key={particular} value={particular}>{particular}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Category</InputLabel>
              <Select value={categoryFilter} label="Category" onChange={(e) => setCategoryFilter(e.target.value)}>
                <MenuItem value="">All Categories</MenuItem>
                {[...examFeeCategories, ...otherCategories].map((category) => (
                  <MenuItem key={category} value={category}>{category}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Session</InputLabel>
              <Select value={sessionFilter} label="Session" onChange={(e) => setSessionFilter(e.target.value)}>
                <MenuItem value="">All Sessions</MenuItem>
                {uniqueSessions.map((session) => (
                  <MenuItem key={session} value={session}>{session}</MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ width: 150 }}>
              <InputLabel>Payment Mode</InputLabel>
              <Select value={modeFilter} label="Payment Mode" onChange={(e) => setModeFilter(e.target.value)}>
                <MenuItem value="">All Modes</MenuItem>
                {uniqueModes.map((mode) => (
                  <MenuItem key={mode} value={mode}>{mode}</MenuItem>
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
              <IconButton size="small" onClick={clearFilters} sx={{ border: '1px solid rgba(0, 0, 0, 0.23)', borderRadius: 1, p: '6px' }}>
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
                <TableCell style={{ color: "white" }}>Payment Mode</TableCell>
                <TableCell style={{ color: "white" }}>Mode ID</TableCell>
                <TableCell style={{ color: "white" }}>Remark</TableCell>
                <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                <TableCell style={{ color: "white" }}>Session</TableCell>
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

        <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
          <DialogTitle>Add Other Fee Transaction</DialogTitle>
          <DialogContent>
            <Box sx={{ mt: 2 }}>
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
      </div>
    </LocalizationProvider>
  );
};

export default OtherFeesTransaction;