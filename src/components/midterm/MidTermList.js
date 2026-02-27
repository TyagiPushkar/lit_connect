"use client"; // Necessary for client-side React components in Next.js App Router

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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Typography,
  LinearProgress,
  Alert,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ClearIcon from "@mui/icons-material/Clear";
import DownloadIcon from "@mui/icons-material/Download";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as XLSX from "xlsx";

const MidTermList = () => {
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarSeverity, setSnackbarSeverity] = useState("info");
  const navigate = useNavigate();

  // Bulk Upload states
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);

  // Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);

  useEffect(() => {
    fetchMidTermTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    transactions,
    searchTerm,
    semesterFilter,
    statusFilter,
    fromDate,
    toDate,
  ]);

  const fetchMidTermTransactions = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/midterm/get_mid_term.php",
      );
      if (response.data.success) {
        setTransactions(response.data.data);
        showSnackbar(response.data.message, "success");
      } else {
        showSnackbar(response.data.message, "error");
      }
    } catch (error) {
      showSnackbar("Failed to fetch mid term transactions.", "error");
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Apply search filter (by StudentId)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((item) =>
        item.StudentId?.toString().toLowerCase().includes(term),
      );
    }

    // Apply semester filter
    if (semesterFilter) {
      filtered = filtered.filter(
        (item) => item.Sem && item.Sem === semesterFilter,
      );
    }

    // Apply status filter
    if (statusFilter) {
      filtered = filtered.filter(
        (item) => item.Status && item.Status === statusFilter,
      );
    }

    // Apply date range filter (using CreatedAt field)
    if (fromDate) {
      filtered = filtered.filter((item) => {
        if (!item.CreatedAt) return false;
        const itemDate = new Date(item.CreatedAt);
        return itemDate >= new Date(fromDate);
      });
    }
    if (toDate) {
      filtered = filtered.filter((item) => {
        if (!item.CreatedAt) return false;
        const itemDate = new Date(item.CreatedAt);
        const endOfDay = new Date(toDate);
        endOfDay.setHours(23, 59, 59, 999);
        return itemDate <= endOfDay;
      });
    }

    setFilteredTransactions(filtered);
    setPage(0);
  };

  const showSnackbar = (message, severity = "info") => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setOpenSnackbar(true);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSemesterFilter("");
    setStatusFilter("");
    setFromDate(null);
    setToDate(null);
  };

  // Bulk Upload Functions
  const handleOpenUploadDialog = () => {
    setUploadDialogOpen(true);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleCloseUploadDialog = () => {
    setUploadDialogOpen(false);
    setSelectedFile(null);
    setUploadResult(null);
    setUploadProgress(0);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Check file type
      const allowedTypes = [
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "text/csv",
      ];
      if (!allowedTypes.includes(file.type)) {
        showSnackbar(
          "Please upload only Excel files (.xls, .xlsx, .csv)",
          "error",
        );
        return;
      }
      setSelectedFile(file);
    }
  };

  const downloadSampleExcel = () => {
    // Create sample data
    const sampleData = [
      { StudentId: "NI001", Sem: "3" },
      { StudentId: "NI002", Sem: "5" },
      { StudentId: "NI003", Sem: "3" },
      { StudentId: "NI004", Sem: "5" },
      { StudentId: "NI005", Sem: "7" },
    ];

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    ws["!cols"] = [
      { wch: 15 }, // StudentId
      { wch: 10 }, // Sem
    ];

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sample Mid Term Data");

    // Add instructions as a separate sheet
    const instructionsData = [
      { Instructions: "1. StudentId should be a valid student ID" },
      { Instructions: "2. Sem should be a number (1, 2, 3, etc.)" },
      { Instructions: "3. Do not modify the column headers" },
      { Instructions: "4. Remove any empty rows" },
    ];
    const wsInstructions = XLSX.utils.json_to_sheet(instructionsData);
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instructions");

    // Generate file name
    const fileName = `Mid_Term_Sample_${new Date().getDate()}-${new Date().getMonth() + 1}-${new Date().getFullYear()}.xlsx`;

    // Export the file
    XLSX.writeFile(wb, fileName);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      showSnackbar("Please select a file to upload", "warning");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/midterm/upload_mid_term.php",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
          onUploadProgress: (progressEvent) => {
            const progress = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total,
            );
            setUploadProgress(progress);
          },
        },
      );

      setUploadResult(response.data);

      if (response.data.success) {
        showSnackbar(response.data.message, "success");
        // Refresh the list after successful upload
        fetchMidTermTransactions();
        // Close dialog after 2 seconds on success
        setTimeout(() => {
          handleCloseUploadDialog();
        }, 2000);
      } else {
        showSnackbar(response.data.message, "error");
      }
    } catch (error) {
      showSnackbar(
        error.response?.data?.message || "Failed to upload file",
        "error",
      );
      setUploadResult({ success: false, message: "Upload failed" });
    } finally {
      setUploading(false);
    }
  };

  const exportToExcel = () => {
    // Prepare data for export
    const dataForExport = filteredTransactions.map((item) => ({
      ID: item.Id,
      "Student ID": item.StudentId,
      Semester: item.Sem,
      Status: item.Status,
      "Created At": formatDateTime(item.CreatedAt),
    }));

    // Create worksheet
    const ws = XLSX.utils.json_to_sheet(dataForExport);

    // Create workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Mid Term Transactions");

    // Generate file name with current date
    const today = new Date();
    const dateString = `${today.getDate()}-${today.getMonth() + 1}-${today.getFullYear()}`;
    const fileName = `Mid_Term_Transactions_${dateString}.xlsx`;

    // Export the file
    XLSX.writeFile(wb, fileName);
  };

  // Get unique values for filters
  const uniqueSemesters = [...new Set(transactions.map((item) => item.Sem))]
    .filter(Boolean)
    .sort((a, b) => parseInt(a) - parseInt(b));

  const uniqueStatuses = [
    ...new Set(transactions.map((item) => item.Status)),
  ].filter(Boolean);

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

  const getStatusChip = (status) => {
    let color = "default";
    switch (status?.toLowerCase()) {
      case "appeared":
        color = "primary";
        break;
      case "absent":
        color = "error";
        break;
      case "passed":
        color = "success";
        break;
      default:
        color = "default";
    }
    return <Chip label={status} color={color} size="small" />;
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Box sx={{ pt: 0 }}>
        <Grid container spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Grid item xs={12} md={3}>
            <h2>Mid Term List</h2>
          </Grid>
          <Grid item xs={12} md={9}>
            <Grid
              container
              spacing={1}
              alignItems="center"
              justifyContent="flex-end"
            >
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
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Semester</InputLabel>
                  <Select
                    value={semesterFilter}
                    label="Semester"
                    onChange={(e) => setSemesterFilter(e.target.value)}
                  >
                    <MenuItem value="">All Semesters</MenuItem>
                    {uniqueSemesters.map((sem) => (
                      <MenuItem key={sem} value={sem}>
                        Semester {sem}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={2}>
                <FormControl fullWidth size="small">
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                  >
                    <MenuItem value="">All Status</MenuItem>
                    {uniqueStatuses.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
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
                  color="info"
                  startIcon={<UploadFileIcon />}
                  onClick={handleOpenUploadDialog}
                  fullWidth
                >
                  Bulk Upload
                </Button>
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

        <TableContainer component={Paper}>
          <Table>
            <TableHead style={{ backgroundColor: "#CC7A00" }}>
              <TableRow>
                <TableCell style={{ color: "white" }}>ID</TableCell>
                <TableCell style={{ color: "white" }}>Student ID</TableCell>
                <TableCell style={{ color: "white" }}>Semester</TableCell>
                <TableCell style={{ color: "white" }}>Status</TableCell>
                <TableCell style={{ color: "white" }}>Created At</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((row) => (
                  <TableRow key={row.Id} hover>
                    <TableCell>{row.Id}</TableCell>
                    <TableCell>{row.StudentId}</TableCell>
                    <TableCell>Semester {row.Sem}</TableCell>
                    <TableCell>{getStatusChip(row.Status)}</TableCell>
                    <TableCell>{formatDateTime(row.CreatedAt)}</TableCell>
                  </TableRow>
                ))}
              {filteredTransactions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    No records found
                  </TableCell>
                </TableRow>
              )}
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

        {/* Bulk Upload Dialog */}
        <Dialog
          open={uploadDialogOpen}
          onClose={handleCloseUploadDialog}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle>
            <Box display="flex" alignItems="center" gap={1}>
              <CloudUploadIcon color="primary" />
              <Typography variant="h6">Bulk Upload Mid Term Data</Typography>
            </Box>
          </DialogTitle>
          <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
              <Alert severity="info" sx={{ mb: 2 }}>
                <Typography variant="body2">
                  Upload an Excel file with the following columns:
                </Typography>
                <ul style={{ marginTop: 8, marginBottom: 4 }}>
                  <li>
                    <strong>StudentId</strong> - Student ID (e.g., NI001)
                  </li>
                  <li>
                    <strong>Sem</strong> - Semester number (e.g., 3, 5)
                  </li>
                </ul>
              </Alert>

              <Button
                variant="outlined"
                startIcon={<DownloadIcon />}
                onClick={downloadSampleExcel}
                fullWidth
                sx={{ mb: 2 }}
              >
                Download Sample Excel
              </Button>

              <Box
                sx={{
                  border: "2px dashed",
                  borderColor: "primary.main",
                  borderRadius: 2,
                  p: 3,
                  textAlign: "center",
                  bgcolor: "background.default",
                  cursor: "pointer",
                  "&:hover": {
                    bgcolor: "action.hover",
                  },
                }}
                onClick={() => document.getElementById("file-upload").click()}
              >
                <input
                  type="file"
                  id="file-upload"
                  accept=".xlsx,.xls,.csv"
                  style={{ display: "none" }}
                  onChange={handleFileChange}
                />
                <CloudUploadIcon
                  sx={{ fontSize: 48, color: "primary.main", mb: 1 }}
                />
                <Typography variant="body1" gutterBottom>
                  {selectedFile
                    ? selectedFile.name
                    : "Click to select or drag & drop file"}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  Supported formats: .xlsx, .xls, .csv
                </Typography>
              </Box>

              {uploading && (
                <Box sx={{ mt: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={uploadProgress}
                  />
                  <Typography
                    variant="body2"
                    color="textSecondary"
                    align="center"
                    sx={{ mt: 1 }}
                  >
                    Uploading... {uploadProgress}%
                  </Typography>
                </Box>
              )}

              {uploadResult && (
                <Alert
                  severity={uploadResult.success ? "success" : "error"}
                  sx={{ mt: 2 }}
                >
                  {uploadResult.message}
                  {uploadResult.data && (
                    <ul style={{ marginTop: 8, marginBottom: 4 }}>
                      {uploadResult.data.map((item, index) => (
                        <li key={index}>
                          Row {item.row}: {item.message}
                        </li>
                      ))}
                    </ul>
                  )}
                </Alert>
              )}
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseUploadDialog}>Cancel</Button>
            <Button
              variant="contained"
              onClick={handleUpload}
              disabled={!selectedFile || uploading}
              startIcon={<CloudUploadIcon />}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
          </DialogActions>
        </Dialog>

        <Snackbar
          open={openSnackbar}
          autoHideDuration={6000}
          onClose={() => setOpenSnackbar(false)}
        >
          <Alert
            onClose={() => setOpenSnackbar(false)}
            severity={snackbarSeverity}
          >
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
    </LocalizationProvider>
  );
};

export default MidTermList;
