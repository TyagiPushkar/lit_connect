import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Button,
  TextField,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  IconButton,
} from "@mui/material";
import axios from "axios";
import EditIcon from "@mui/icons-material/Edit";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";

// All PPT mark fields
const MARK_FIELDS = [
  { key: "QA", label: "QA" },
  { key: "LR", label: "LR" },
  { key: "ENG", label: "Eng" },
  { key: "Tech", label: "Tech" },
  { key: "Commun", label: "Commun" },
  { key: "BodyLanguage", label: "BodyLanguage" },
  { key: "ClarityOfThoughts", label: "ClarityOfThoughts" },
  { key: "PresentationSkill", label: "PresentationSkill" },
  { key: "Confidence", label: "Confidence" },
  { key: "TechSkill", label: "TechSkill" },
  { key: "GD", label: "GD" },
];

function ListPPTExam({ setView }) {
  const [records, setRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [course, setCourse] = useState("");
  const [sem, setSem] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDate, setFilterDate] = useState(""); // yyyy-mm-dd (from date picker)

  // Convert yyyy-mm-dd → dd/mm/yyyy for comparing against backend DateOfExam
  const toDisplayDate = (val) => {
    if (!val) return '';
    const [y, m, d] = val.split('-');
    return `${d}/${m}/${y}`;
  };

  // Per-row edit state: editRowId + a copy of all editable fields
  const [editRowId, setEditRowId] = useState(null);
  const [editedValues, setEditedValues] = useState({});

  // Fetch records when course + sem selected
  useEffect(() => {
    if (course && sem) fetchRecords();
  }, [course, sem]);

  // Apply search + date filter
  useEffect(() => {
    applyFilters();
  }, [searchTerm, filterDate, records]);

  const fetchRecords = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "https://namami-infotech.com/LIT/src/report/list_ppt_exam.php",
        { params: { Course: course, Sem: sem } },
      );
      setRecords(data.success ? data.data : []);
    } catch (err) {
      console.error("Failed to fetch records", err);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = records;
    if (searchTerm.trim()) {
      filtered = filtered.filter((item) =>
        item.StudId.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    if (filterDate) {
      const ddmmyyyy = toDisplayDate(filterDate);
      filtered = filtered.filter((item) => (item.DateOfExam || "") === ddmmyyyy);
    }
    setFilteredRecords(filtered);
    setPage(0);
  };

  const handleEditClick = (row) => {
    setEditRowId(row.Id);
    // Copy all mark field values into editable state
    const vals = {};
    MARK_FIELDS.forEach(({ key }) => {
      vals[key] = row[key] ?? "";
    });
    setEditedValues(vals);
  };

  const handleCancelEdit = () => {
    setEditRowId(null);
    setEditedValues({});
  };

  const handleFieldChange = (key, value) => {
    setEditedValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (rowId) => {
    try {
      const { data } = await axios.post(
        "https://namami-infotech.com/LIT/src/report/edit_ppt_marks.php",
        { Id: rowId, ...editedValues },
      );
      if (data.success) {
        setRecords((prev) =>
          prev.map((row) =>
            row.Id === rowId ? { ...row, ...editedValues } : row,
          ),
        );
        setEditRowId(null);
        setEditedValues({});
      } else {
        alert(data.message || "Update failed.");
      }
    } catch (err) {
      console.error("Error saving marks", err);
      alert("Failed to save marks.");
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      <Box elevation={1} sx={{ p: 0, borderRadius: 2, mb: 1 }}>
        <Typography variant="h6" color="#CC7A00" gutterBottom>
          PPT Exam Report
        </Typography>

        <Grid container spacing={2}>
          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Course</InputLabel>
              <Select
                value={course}
                onChange={(e) => setCourse(e.target.value)}
                label="Course"
              >
                <MenuItem value="BSc. DS">BSc. DS</MenuItem>
                <MenuItem value="BSc. CS(H)">BSc. CS(H)</MenuItem>
                <MenuItem value="BSc. ITM(H)">BSc. ITM(H)</MenuItem>
                <MenuItem value="BCA">BCA</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <FormControl fullWidth size="small">
              <InputLabel>Semester</InputLabel>
              <Select
                value={sem}
                onChange={(e) => setSem(e.target.value)}
                label="Semester"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <MenuItem key={num} value={num}>
                    {num}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={2}>
            <TextField
              label="Filter by Date"
              fullWidth
              size="small"
              type="date"
              value={filterDate}
              onChange={(e) => setFilterDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>


          <Grid item xs={12} sm={4} md={2}>
            <TextField
              label="Search by Student ID"
              variant="outlined"
              fullWidth
              size="small"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </Grid>
        </Grid>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" alignItems="center" height="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={2} sx={{ borderRadius: 2, p: 0 }}>
          <TableContainer>
            <Table size="small">
              <TableHead sx={{ backgroundColor: "#CC7A00" }}>
                <TableRow>
                  <TableCell sx={{ color: "#fff" }}>Actions</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Student ID</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Course</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Semester</TableCell>
                  <TableCell sx={{ color: "#fff" }}>Date</TableCell>
                  {MARK_FIELDS.map(({ key, label }) => (
                    <TableCell key={key} sx={{ color: "#fff" }}>{label}</TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredRecords
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    const isEditing = editRowId === row.Id;
                    return (
                      <TableRow key={row.Id}>
                        <TableCell>
                          {isEditing ? (
                            <>
                              <IconButton
                                size="small"
                                color="success"
                                onClick={() => handleSave(row.Id)}
                              >
                                <CheckIcon fontSize="small" />
                              </IconButton>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={handleCancelEdit}
                              >
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            </>
                          ) : (
                            <IconButton
                              size="small"
                              onClick={() => handleEditClick(row)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          )}
                        </TableCell>
                        <TableCell>{row.StudId}</TableCell>
                        <TableCell>{row.Course}</TableCell>
                        <TableCell>{row.Sem}</TableCell>
                        <TableCell>
                          {row.DateOfExam
                            ? new Date(row.DateOfExam).toLocaleDateString("en-GB", {
                              day: "2-digit",
                              month: "2-digit",
                              year: "2-digit",
                            })
                            : "—"}
                        </TableCell>
                        {/* <TableCell>{row.DateOfExam || "—"}</TableCell> */}

                        {MARK_FIELDS.map(({ key }) => (
                          <TableCell key={key}>
                            {isEditing ? (
                              <TextField
                                value={editedValues[key] ?? ""}
                                size="small"
                                onChange={(e) => handleFieldChange(key, e.target.value)}
                                inputProps={{ style: { width: 50 } }}
                              />
                            ) : (
                              row[key]
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    );
                  })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination
            component="div"
            count={filteredRecords.length}
            page={page}
            onPageChange={(e, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => {
              setRowsPerPage(parseInt(e.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 25, 50]}
          />
        </Paper>
      )}
    </Box>
  );
}

export default ListPPTExam;
