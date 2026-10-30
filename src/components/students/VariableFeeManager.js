import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Autocomplete,
  Box,
  Tooltip,
  IconButton,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider,
} from "@mui/material";
import DownloadIcon from "@mui/icons-material/Download";
import ClearIcon from "@mui/icons-material/Clear";
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import * as XLSX from "xlsx";
import axios from "axios";
import Swal from "sweetalert2";

const VariableFeeManager = () => {
  const [students, setStudents] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [particular, setParticular] = useState("");
  const [amount, setAmount] = useState("");
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [variableFees, setVariableFees] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);

  // Export & Filter states
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [isExporting, setIsExporting] = useState(false);
  const [exportOnlySelected, setExportOnlySelected] = useState(false);

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/students/get_student.php",
      );
      if (response.data.success) {
        setStudents(response.data.data);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const fetchVariableFees = async (studentId) => {
    try {
      const res = await axios.get(
        `https://namami-infotech.com/LIT/src/fees/variable.php?student_id=${studentId}`,
      );
      if (res.data.success) {
        setVariableFees(res.data.data);
      } else {
        setVariableFees([]);
      }
    } catch (err) {
      console.error(err);
      setVariableFees([]);
    }
  };

  const handleAddFee = async () => {
    if (!selectedStudent || !particular || !amount) {
      setSnackbarMessage("All fields are required.");
      setOpenSnackbar(true);
      return;
    }

    try {
      const res = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/variable.php",
        {
          student_id: selectedStudent.StudentID,
          particular,
          amount,
        },
      );

      if (res.data.success) {
        Swal.fire("Success", "Fee added successfully.", "success");
        fetchVariableFees(selectedStudent.StudentID);
        setParticular("");
        setAmount("");
        setOpenDialog(false);
      } else {
        Swal.fire("Error", res.data.message || "Failed to add fee.", "error");
      }
    } catch (error) {
      Swal.fire("Error", "API error: " + error.message, "error");
    }
  };

  const handleSampleDownload = () => {
    const header = ["student_id", "particular", "amount"];
    const sample = [
      ["STU001", "Late Fee", "200"],
      ["STU002", "Transport Fee", "150"],
    ];

    let csvContent =
      "data:text/csv;charset=utf-8," +
      [header, ...sample].map((e) => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "variable_fee_sample.csv");
    document.body.appendChild(link);
    link.click();
  };

  const handleFileUpload = async () => {
    if (!uploadFile) {
      Swal.fire("Error", "Please select a file to upload.", "error");
      return;
    }

    const formData = new FormData();
    formData.append("file", uploadFile);

    try {
      const res = await axios.post(
        "https://namami-infotech.com/LIT/src/fees/variable.php",
        formData,
        {
          headers: { "Content-Type": "multipart/form-data" },
        },
      );

      if (res.data.success) {
        Swal.fire("Success", res.data.message, "success");
        setUploadFile(null);
        if (selectedStudent) fetchVariableFees(selectedStudent.StudentID);
      } else {
        Swal.fire("Error", res.data.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  // Helper to extract timestamp for sorting and date filtering
  const getRecordTimestamp = (item) => {
    const d = item.DateTime || item.date || item.payment_date || item.created_at;
    if (d) {
      const t = new Date(d).getTime();
      if (!isNaN(t)) return t;
    }
    return 0;
  };

  // Helper to format date & time for Excel export
  const formatDateTimeStr = (datetime) => {
    if (!datetime) return "-";
    const dateObj = new Date(datetime);
    return isNaN(dateObj.getTime())
      ? datetime
      : dateObj.toLocaleString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        });
  };

  // Export to Excel handler
  const handleExportToExcel = async () => {
    try {
      setIsExporting(true);

      let allRecords = [];

      // If user checked "Only for selected student" and a student is selected
      if (exportOnlySelected && selectedStudent?.StudentID) {
        if (variableFees && variableFees.length > 0) {
          allRecords = variableFees;
        } else {
          const res = await axios.get(
            `https://namami-infotech.com/LIT/src/fees/variable.php?student_id=${selectedStudent.StudentID}`,
          );
          if (res.data.success && Array.isArray(res.data.data)) {
            allRecords = res.data.data;
          }
        }
      } else {
        // Default: fetch all variable fee data from the system
        const res = await axios.get(
          "https://namami-infotech.com/LIT/src/fees/variable.php",
        );
        if (res.data.success && Array.isArray(res.data.data)) {
          allRecords = res.data.data;
        }
      }

      if (!allRecords || allRecords.length === 0) {
        Swal.fire("Info", "Export karne ke liye koi data nahi mila.", "info");
        setIsExporting(false);
        return;
      }

      // 1. Date Range Filtering (From Date aur To Date se filter)
      let filteredRecords = [...allRecords];

      if (fromDate) {
        const fromTime = new Date(`${fromDate}T00:00:00`).getTime();
        filteredRecords = filteredRecords.filter((item) => {
          const t = getRecordTimestamp(item);
          return t >= fromTime;
        });
      }

      if (toDate) {
        const toTime = new Date(`${toDate}T23:59:59.999`).getTime();
        filteredRecords = filteredRecords.filter((item) => {
          const t = getRecordTimestamp(item);
          return t > 0 && t <= toTime;
        });
      }

      if (filteredRecords.length === 0) {
        Swal.fire(
          "Info",
          "Chuni gayi date range me koi record nahi mila.",
          "info",
        );
        setIsExporting(false);
        return;
      }

      // 2. Latest top me rahega (Descending Sort: latest date first, then highest ID)
      filteredRecords.sort((a, b) => {
        const timeDiff = getRecordTimestamp(b) - getRecordTimestamp(a);
        if (timeDiff !== 0) return timeDiff;
        return (Number(b.id) || 0) - (Number(a.id) || 0);
      });

      // Student mapping for student name
      const studentMap = {};
      students.forEach((s) => {
        if (s.StudentID) {
          studentMap[String(s.StudentID).trim()] = s.CandidateName;
        }
      });

      // 3. Format rows for Excel
      const dataForExport = filteredRecords.map((item, index) => {
        const sid = String(
          item.student_id ||
            item.StudentID ||
            (selectedStudent ? selectedStudent.StudentID : ""),
        ).trim();

        const sname =
          studentMap[sid] ||
          (selectedStudent && sid === String(selectedStudent.StudentID).trim()
            ? selectedStudent.CandidateName
            : "") ||
          item.CandidateName ||
          item.student_name ||
          "-";

        const isPaid =
          Number(item.Paid) === 1 ||
          String(item.payment_status).toLowerCase() === "paid";

        return {
          "S.No.": index + 1,
          ID: item.id || "-",
          "Student ID": sid || "-",
          "Student Name": sname,
          Particular: item.particular || "-",
          "Amount (₹)": Number(item.amount) || 0,
          Status: isPaid ? "Paid" : "Not Paid",
          "Paid Amount (₹)":
            item.paid_amount != null
              ? Number(item.paid_amount)
              : isPaid
                ? Number(item.amount)
                : 0,
          "Date / Time": formatDateTimeStr(
            item.DateTime || item.date || item.created_at,
          ),
          "Payment Date": item.payment_date || "-",
          Remarks: item.remarks || "-",
        };
      });

      // 4. Generate Excel Sheet & Auto Width
      const ws = XLSX.utils.json_to_sheet(dataForExport);
      const colWidths = Object.keys(dataForExport[0] || {}).map((key) => ({
        wch: Math.max(key.length + 4, 15),
      }));
      ws["!cols"] = colWidths;

      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Variable Fees");

      const dateSuffix =
        fromDate || toDate
          ? `${fromDate || "start"}_to_${toDate || "latest"}`
          : new Date().toISOString().slice(0, 10);
      const fileName = `Variable_Fees_Report_${dateSuffix}.xlsx`;

      XLSX.writeFile(wb, fileName);

      setSnackbarMessage("Excel file successfully download ho gayi hai!");
      setOpenSnackbar(true);
    } catch (error) {
      console.error("Export error:", error);
      Swal.fire("Error", "Excel export me samasya aayi: " + error.message, "error");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Box sx={{ width: "100%", p: 0 }}>
      {/* Top Header Bar */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 2,
          mb: 1.5,
        }}
      >
        <Typography variant="h5" sx={{ fontWeight: 700, color: "#1a1a1a" }}>
          Variable Fee
        </Typography>

        {/* Template & Upload Controls */}
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
          }}
        >
          <Button
            variant="outlined"
            size="small"
            sx={{
              color: "#CC7A00",
              borderColor: "#CC7A00",
              textTransform: "none",
              fontWeight: 600,
              height: 38,
              "&:hover": { borderColor: "#b56700", color: "#b56700", backgroundColor: "#fff8f0" },
            }}
            onClick={handleSampleDownload}
          >
            Download Template
          </Button>

          {/* Styled Custom File Upload Button */}
          <Button
            component="label"
            variant="outlined"
            size="small"
            startIcon={<UploadFileIcon sx={{ color: "#CC7A00" }} />}
            sx={{
              color: "#444",
              borderColor: "#ccc",
              textTransform: "none",
              fontWeight: 500,
              height: 38,
              maxWidth: 200,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              backgroundColor: "#fff",
              "&:hover": { borderColor: "#CC7A00", backgroundColor: "#fafafa" },
            }}
          >
            {uploadFile ? uploadFile.name : "Choose File"}
            <input
              type="file"
              hidden
              accept=".xls,.xlsx,.csv"
              onChange={(e) => setUploadFile(e.target.files[0])}
            />
          </Button>

          <Button
            variant="contained"
            size="small"
            startIcon={<CloudUploadIcon />}
            disabled={!uploadFile}
            sx={{
              backgroundColor: "#CC7A00",
              textTransform: "none",
              fontWeight: 600,
              height: 38,
              "&:hover": { backgroundColor: "#b56700" },
              "&.Mui-disabled": { backgroundColor: "#e0e0e0" },
            }}
            onClick={handleFileUpload}
          >
            Upload
          </Button>
        </Box>
      </Box>

      {/* Unified Filter & Export Toolbar */}
      <Paper
        elevation={0}
        sx={{
          mb: 2.5,
          p: 1.5,
          borderRadius: 2,
          backgroundColor: "#ffffff",
          border: "1px solid #e2e8f0",
          boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            flexWrap: "wrap",
            flex: 1,
          }}
        >
          {/* Student Selector */}
          <Autocomplete
            options={students}
            size="small"
            value={selectedStudent}
            getOptionLabel={(option) =>
              `${option.StudentID} - ${option.CandidateName}`
            }
            onChange={(event, value) => {
              setSelectedStudent(value);
              setVariableFees([]);
              if (value) fetchVariableFees(value.StudentID);
            }}
            onKeyDown={(event) => {
              if (event.key === "Enter" && students.length === 1) {
                setSelectedStudent(students[0]);
                setVariableFees([]);
                fetchVariableFees(students[0].StudentID);
                event.defaultMuiPrevented = true;
              }
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Select Student"
                placeholder="Search Student..."
                sx={{ width: { xs: "100%", sm: 280, md: 320 } }}
              />
            )}
            isOptionEqualToValue={(option, value) =>
              option.StudentID === value.StudentID
            }
          />

          <Divider
            orientation="vertical"
            flexItem
            sx={{ display: { xs: "none", md: "block" }, my: 0.5 }}
          />

          {/* From Date */}
          <TextField
            label="From Date"
            type="date"
            size="small"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 155 } }}
          />

          {/* To Date */}
          <TextField
            label="To Date"
            type="date"
            size="small"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ width: { xs: "100%", sm: 155 } }}
          />

          {(fromDate || toDate) && (
            <Tooltip title="Reset Dates">
              <IconButton
                size="small"
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                }}
                sx={{ color: "error.main" }}
              >
                <ClearIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}

          {selectedStudent && (
            <FormControlLabel
              control={
                <Checkbox
                  size="small"
                  checked={exportOnlySelected}
                  onChange={(e) => setExportOnlySelected(e.target.checked)}
                  sx={{
                    color: "#CC7A00",
                    "&.Mui-checked": { color: "#CC7A00" },
                  }}
                />
              }
              label={
                <Typography variant="body2" sx={{ fontSize: "0.82rem", color: "#555" }}>
                  Only for {selectedStudent.CandidateName || selectedStudent.StudentID}
                </Typography>
              }
              sx={{ ml: 0.5 }}
            />
          )}
        </Box>

        {/* Export Button */}
        <Box sx={{ display: "flex", alignItems: "center" }}>
          <Tooltip title="Export to Excel (Default: All data, latest on top)">
            <span>
              <Button
                variant="contained"
                startIcon={
                  isExporting ? (
                    <CircularProgress size={18} color="inherit" />
                  ) : (
                    <DownloadIcon />
                  )
                }
                disabled={isExporting}
                onClick={handleExportToExcel}
                sx={{
                  backgroundColor: "#2e7d32",
                  "&:hover": { backgroundColor: "#1b5e20" },
                  color: "#fff",
                  textTransform: "none",
                  fontWeight: 600,
                  px: 2.2,
                  height: 38,
                  boxShadow: "0 2px 4px rgba(46, 125, 50, 0.2)",
                  whiteSpace: "nowrap",
                }}
              >
                {isExporting ? "Exporting..." : "Export to Excel"}
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Paper>

      {/* Selected Student Fees Table */}
      {selectedStudent && (
        <>
          <Box
            sx={{
              mt: 2,
              mb: 1.5,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 600, color: "#333" }}>
              Variable Fee List -{" "}
              <span style={{ color: "#CC7A00" }}>
                {selectedStudent.CandidateName} ({selectedStudent.StudentID})
              </span>
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              sx={{
                backgroundColor: "#CC7A00",
                "&:hover": { backgroundColor: "#b56700" },
                textTransform: "none",
                fontWeight: 600,
                height: 36,
              }}
              onClick={() => setOpenDialog(true)}
            >
              Add Fee
            </Button>
          </Box>

          <TableContainer
            component={Paper}
            sx={{
              borderRadius: 2,
              border: "1px solid #e2e8f0",
              boxShadow: "0 1px 3px rgba(0, 0, 0, 0.05)",
            }}
          >
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{
                      backgroundColor: "#CC7A00",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Particular
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#CC7A00",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Amount (₹)
                  </TableCell>
                  <TableCell
                    sx={{
                      backgroundColor: "#CC7A00",
                      color: "white",
                      fontWeight: 600,
                    }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {variableFees.length > 0 ? (
                  variableFees.map((fee, index) => (
                    <TableRow key={index} hover>
                      <TableCell sx={{ fontWeight: 500 }}>
                        {fee.particular}
                      </TableCell>
                      <TableCell>₹{fee.amount}</TableCell>
                      <TableCell>
                        <Box
                          component="span"
                          sx={{
                            display: "inline-block",
                            px: 1.5,
                            py: 0.3,
                            borderRadius: 1,
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            backgroundColor:
                              Number(fee.Paid) === 0 ? "#ffebee" : "#e8f5e9",
                            color:
                              Number(fee.Paid) === 0 ? "#d32f2f" : "#2e7d32",
                          }}
                        >
                          {Number(fee.Paid) === 0 ? "Not Paid" : "Paid"}
                        </Box>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} align="center" sx={{ py: 3, color: "#888" }}>
                      No variable fees found for this student.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      {/* Add Variable Fee Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Add Variable Fee</DialogTitle>
        <DialogContent
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 16,
            minWidth: 320,
            paddingTop: 12,
          }}
        >
          <TextField
            label="Particular"
            fullWidth
            value={particular}
            onChange={(e) => setParticular(e.target.value)}
          />
          <TextField
            label="Amount"
            fullWidth
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setOpenDialog(false)} color="inherit">
            Cancel
          </Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#b56700" },
              fontWeight: 600,
            }}
            onClick={handleAddFee}
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
  );
};

export default VariableFeeManager;
