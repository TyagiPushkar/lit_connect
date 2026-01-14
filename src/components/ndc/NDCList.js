"use client";

import { useState, useEffect } from "react";
import {
  Button,
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
  Tooltip,
  IconButton,
  Box,
  Chip,
  Stack,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Checkbox,
  Menu,
  MenuItem,
  CircularProgress,
} from "@mui/material";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import ClearIcon from "@mui/icons-material/Clear";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import VisibilityIcon from "@mui/icons-material/Visibility";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import axios from "axios";
import * as XLSX from "xlsx";

const NDCList = () => {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isExporting, setIsExporting] = useState(false);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [courseFilter, setCourseFilter] = useState("");
  const [batchFilter, setBatchFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Action Menu
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedStudentForMenu, setSelectedStudentForMenu] = useState(null);

  // Admin Approval Dialog
  const [openAdminApprovalDialog, setOpenAdminApprovalDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [approvalChecks, setApprovalChecks] = useState({
    Library: false,
    "Variable Fee": false,
    "Academic Fee": false,
  });
  const [approvalRemarks, setApprovalRemarks] = useState({
    Library: "Book not returned from library",
    "Variable Fee": "Fee pending",
    "Academic Fee": "Tuition pending",
  });
  const [approvalStatus, setApprovalStatus] = useState("Approved");
  const [approvalLoading, setApprovalLoading] = useState(false);

  // Admin Approval List Dialog
  const [openAdminApprovalListDialog, setOpenAdminApprovalListDialog] =
    useState(false);
  const [adminApprovalList, setAdminApprovalList] = useState([]);
  const [adminApprovalLoading, setAdminApprovalLoading] = useState(false);

  // Issue Form Dialog
  const [openIssueFormDialog, setOpenIssueFormDialog] = useState(false);
  const [existingExamForms, setExistingExamForms] = useState([]);
  const [issueFormLoading, setIssueFormLoading] = useState(false);
  const [issueFormSubmitting, setIssueFormSubmitting] = useState(false);

  // Extract unique values for filters
  const uniqueCourses = [
    ...new Set(students.map((student) => student.Course).filter(Boolean)),
  ].sort();
  const uniqueBatches = [
    ...new Set(students.map((student) => student.Session).filter(Boolean)),
  ].sort((a, b) => b.localeCompare(a));
  const uniqueSemesters = [
    ...new Set(students.map((student) => student.Sem).filter(Boolean)),
  ].sort();

  useEffect(() => {
    fetchNDCDues();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [
    students,
    searchQuery,
    courseFilter,
    batchFilter,
    semesterFilter,
    statusFilter,
  ]);

  const fetchNDCDues = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/ndc/get_dues.php"
      );
      if (response.data.success) {
        setStudents(response.data.data);
        setFilteredStudents(response.data.data);
      } else {
        setSnackbarMessage(response.data.message || "Failed to fetch NDC dues");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error fetching NDC dues.");
      setOpenSnackbar(true);
      console.error("Error fetching NDC dues:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = students;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (student) =>
          (student.StudentID &&
            student.StudentID.toLowerCase().includes(lower)) ||
          (student.CandidateName &&
            student.CandidateName.toLowerCase().includes(lower))
      );
    }

    if (courseFilter) {
      filtered = filtered.filter((student) => student.Course === courseFilter);
    }

    if (batchFilter) {
      filtered = filtered.filter((student) => student.Session === batchFilter);
    }

    if (semesterFilter) {
      filtered = filtered.filter((student) => student.Sem == semesterFilter);
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (student) =>
          student.ndc_status.toLowerCase() === statusFilter.toLowerCase()
      );
    }

    setFilteredStudents(filtered);
    setPage(0);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setCourseFilter("");
    setBatchFilter("");
    setSemesterFilter("");
    setStatusFilter("all");
  };

  const hasActiveFilters = () => {
    return (
      searchQuery ||
      courseFilter ||
      batchFilter ||
      semesterFilter ||
      statusFilter !== "all"
    );
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (searchQuery) count++;
    if (courseFilter) count++;
    if (batchFilter) count++;
    if (semesterFilter) count++;
    if (statusFilter !== "all") count++;
    return count;
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(Number.parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClick = (studentId) => {
    window.location.href = `/student/${studentId}`;
  };

  const handleOpenMenu = (event, student) => {
    setAnchorEl(event.currentTarget);
    setSelectedStudentForMenu(student);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedStudentForMenu(null);
  };

  const handleOpenAdminApproval = (student) => {
    setSelectedStudent(student);
    setApprovalChecks({
      Library: false,
      "Variable Fee": false,
      "Academic Fee": false,
    });
    setApprovalRemarks({
      Library: "Book not returned from library",
      "Variable Fee": "Fee pending",
      "Academic Fee": "Tuition pending",
    });
    setApprovalStatus("Approved");
    setOpenAdminApprovalDialog(true);
    handleCloseMenu();
  };

  const handleSubmitAdminApproval = async () => {
    const selectedTypes = Object.keys(approvalChecks).filter(
      (type) => approvalChecks[type]
    );

    if (selectedTypes.length === 0) {
      setSnackbarMessage("Please select at least one due type to approve");
      setOpenSnackbar(true);
      return;
    }

    setApprovalLoading(true);
    try {
      for (const dueType of selectedTypes) {
        const payload = {
          student_id: selectedStudent.StudentID,
          sem: selectedStudent.Sem,
          due_type: dueType,
          remark: approvalRemarks[dueType],
          status: approvalStatus,
          approved_by: "ADMIN01",
        };

        const response = await axios.post(
          "https://namami-infotech.com/LIT/src/ndc/admin_approve.php",
          payload
        );

        if (!response.data.success) {
          setSnackbarMessage(
            response.data.message || `Failed to approve ${dueType}`
          );
          setOpenSnackbar(true);
          setApprovalLoading(false);
          return;
        }
      }

      setSnackbarMessage("Approval(s) submitted successfully!");
      setOpenSnackbar(true);
      setOpenAdminApprovalDialog(false);
      fetchNDCDues();
    } catch (error) {
      setSnackbarMessage("Error submitting approval");
      setOpenSnackbar(true);
      console.error("Error submitting approval:", error);
    } finally {
      setApprovalLoading(false);
    }
  };

  const handleOpenAdminApprovalList = async (student) => {
    setSelectedStudent(student);
    setAdminApprovalLoading(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/ndc/get_admin_approve.php?student_id=${student.StudentID}`
      );
      if (response.data.success) {
        setAdminApprovalList(response.data.data);
      } else {
        setSnackbarMessage(
          response.data.message || "Failed to fetch approvals"
        );
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error fetching approvals");
      setOpenSnackbar(true);
      console.error("Error fetching approvals:", error);
    } finally {
      setAdminApprovalLoading(false);
      setOpenAdminApprovalListDialog(true);
      handleCloseMenu();
    }
  };

  const handleOpenIssueForm = async (student) => {
    setSelectedStudent(student);
    setIssueFormLoading(true);
    try {
      const response = await axios.get(
        `https://namami-infotech.com/LIT/src/ndc/get_exam_form.php?student_id=${student.StudentID}`
      );
      if (response.data.success) {
        setExistingExamForms(response.data.data);
      } else {
        setExistingExamForms([]);
      }
    } catch (error) {
      setExistingExamForms([]);
      console.error("Error fetching exam forms:", error);
    } finally {
      setIssueFormLoading(false);
      setOpenIssueFormDialog(true);
      handleCloseMenu();
    }
  };

  const handleSubmitIssueForm = async () => {
    setIssueFormSubmitting(true);
    try {
      const currentYear = new Date().getFullYear();
      const currentMonth = new Date().getMonth() + 1;
      const semester = currentMonth >= 8 ? 1 : 2;
      const sessionYear =
        currentMonth >= 8
          ? `${currentYear}-${currentYear + 1}`
          : `${currentYear - 1}-${currentYear}`;

      const payload = {
        student_id: selectedStudent.StudentID,
        form_type: "Regular",
        sem: semester,
        session: sessionYear,
        issued_by: "ADMIN01",
      };

      const response = await axios.post(
        "https://namami-infotech.com/LIT/src/ndc/issue_exam_form.php",
        payload
      );

      if (response.data.success) {
        setSnackbarMessage("Exam form issued successfully!");
        setOpenSnackbar(true);
        setOpenIssueFormDialog(false);
      } else {
        setSnackbarMessage(response.data.message || "Failed to issue form");
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Error issuing exam form");
      setOpenSnackbar(true);
      console.error("Error issuing exam form:", error);
    } finally {
      setIssueFormSubmitting(false);
    }
  };

  const exportToExcel = () => {
    setIsExporting(true);

    const dataForExport = students.map((student) => ({
      "Student ID": student.StudentID,
      Name: student.CandidateName,
      Course: student.Course,
      Semester: student.Sem,
      Session: student.Session,
      "Library Fee": student.library_status,
      "Variable Fee": student.variable_fee_status,
      "Academic Fee": student.academic_fee_status,
      "Overall Status": getOverallStatus(student),
    }));

    const ws = XLSX.utils.json_to_sheet(dataForExport);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "NDC Dues Report");

    const fileName = `NDC_Dues_Report_${new Date()
      .toISOString()
      .slice(0, 10)}.xlsx`;
    XLSX.writeFile(wb, fileName);
    setIsExporting(false);

    setSnackbarMessage("Excel report downloaded successfully!");
    setOpenSnackbar(true);
  };

  const getOverallStatus = (student) => {
    const statuses = [
      student.library_status,
      student.variable_fee_status,
      student.academic_fee_status,
    ];
    return statuses.every((status) => status.toLowerCase() === "clear")
      ? "Clear"
      : "Due";
  };

  const getStatusIcon = (status) => {
    const isClear = status.toLowerCase() === "clear";
    return isClear ? (
      <CheckCircleIcon style={{ color: "green" }} />
    ) : (
      <CancelIcon style={{ color: "red" }} />
    );
  };

  const getStatusChip = (status) => {
    const isClear = status.toLowerCase() === "clear";
    return (
      <Chip
        label={status}
        color={isClear ? "success" : "error"}
        size="small"
        icon={getStatusIcon(status)}
        variant="outlined"
      />
    );
  };

  const getOverallStatusChip = (student) => {
    const overallStatus = getOverallStatus(student);
    return (
      <Chip
        label={overallStatus}
        color={overallStatus === "Clear" ? "success" : "error"}
        size="medium"
        icon={overallStatus === "Clear" ? <CheckCircleIcon /> : <CancelIcon />}
      />
    );
  };

  const clearCount = students.filter(
    (student) => student.ndc_status.toLowerCase() === "clear"
  ).length;
  const dueCount = students.length - clearCount;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <div>
          <Typography variant="h4" gutterBottom>
            NDC Dues List
          </Typography>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Button
            variant="contained"
            color="primary"
            onClick={fetchNDCDues}
            disabled={loading}
            sx={{ minWidth: 120 }}
          >
            {loading ? "Refreshing..." : "Refresh Data"}
          </Button>

          <Tooltip title="Export to Excel">
            <IconButton
              onClick={exportToExcel}
              disabled={isExporting || students.length === 0}
              color="primary"
            >
              <FileDownloadIcon />
            </IconButton>
          </Tooltip>

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

          <TextField
            label="Search by Student ID or Name"
            variant="outlined"
            size="small"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            sx={{ width: 300 }}
          />
        </div>
      </div>

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
            <Typography variant="h6" style={{ margin: 0 }}>
              Filters
            </Typography>
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
            <TextField
              select
              size="small"
              label="Course"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Courses</option>
              {uniqueCourses.map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Batch"
              value={batchFilter}
              onChange={(e) => setBatchFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Batches</option>
              {uniqueBatches.map((batch) => (
                <option key={batch} value={batch}>
                  {batch}
                </option>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="Semester"
              value={semesterFilter}
              onChange={(e) => setSemesterFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="">All Semesters</option>
              {uniqueSemesters.map((sem) => (
                <option key={sem} value={sem}>
                  {sem}
                </option>
              ))}
            </TextField>

            <TextField
              select
              size="small"
              label="NDC Status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              sx={{ minWidth: 150 }}
              SelectProps={{
                native: true,
              }}
            >
              <option value="all">All Status</option>
              <option value="clear">Clear Only</option>
              <option value="due">Due Only</option>
            </TextField>
          </Stack>

          {/* Active Filters Display */}
          {hasActiveFilters() && (
            <Box sx={{ mt: 2 }}>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {searchQuery && (
                  <Chip
                    label={`Search: "${searchQuery}"`}
                    onDelete={() => setSearchQuery("")}
                    size="small"
                  />
                )}
                {courseFilter && (
                  <Chip
                    label={`Course: ${courseFilter}`}
                    onDelete={() => setCourseFilter("")}
                    size="small"
                  />
                )}
                {batchFilter && (
                  <Chip
                    label={`Batch: ${batchFilter}`}
                    onDelete={() => setBatchFilter("")}
                    size="small"
                  />
                )}
                {semesterFilter && (
                  <Chip
                    label={`Semester: ${semesterFilter}`}
                    onDelete={() => setSemesterFilter("")}
                    size="small"
                  />
                )}
                {statusFilter !== "all" && (
                  <Chip
                    label={`Status: ${
                      statusFilter === "clear" ? "Clear" : "Due"
                    }`}
                    onDelete={() => setStatusFilter("all")}
                    size="small"
                  />
                )}
              </Stack>
            </Box>
          )}
        </Paper>
      )}

      <TableContainer component={Paper}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Student ID
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Student Name
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Course
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Batch
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Semester
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Library Due
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Variable Fee Due
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Academic Fee Due
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Overall Status
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                View
              </TableCell>
              <TableCell style={{ color: "white", fontWeight: "bold" }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography>Loading NDC dues data...</Typography>
                </TableCell>
              </TableRow>
            ) : filteredStudents.length > 0 ? (
              filteredStudents
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((student) => (
                  <TableRow key={student.StudentID}>
                    <TableCell>{student.StudentID}</TableCell>
                    <TableCell>{student.CandidateName}</TableCell>
                    <TableCell>{student.Course}</TableCell>
                    <TableCell>{student.Session}</TableCell>
                    <TableCell>{student.Sem}</TableCell>
                    <TableCell>
                      {getStatusChip(student.library_status)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(student.variable_fee_status)}
                    </TableCell>
                    <TableCell>
                      {getStatusChip(student.academic_fee_status)}
                    </TableCell>
                    <TableCell>{getOverallStatusChip(student)}</TableCell>
                    <TableCell>
                      <Tooltip title="View Student Details">
                        <IconButton
                          color="primary"
                          onClick={() => handleViewClick(student.StudentID)}
                          size="small"
                        >
                          <VisibilityIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell>
                      <IconButton
                        onClick={(e) => handleOpenMenu(e, student)}
                        size="small"
                      >
                        <MoreVertIcon />
                      </IconButton>
                      <Menu
                        anchorEl={anchorEl}
                        open={
                          Boolean(anchorEl) &&
                          selectedStudentForMenu?.StudentID ===
                            student.StudentID
                        }
                        onClose={handleCloseMenu}
                      >
                        <MenuItem
                          onClick={() =>
                            handleOpenAdminApproval(selectedStudentForMenu)
                          }
                        >
                          Admin Approval
                        </MenuItem>
                        <MenuItem
                          onClick={() =>
                            handleOpenAdminApprovalList(selectedStudentForMenu)
                          }
                        >
                          Admin Approval List
                        </MenuItem>
                        <MenuItem
                          onClick={() =>
                            handleOpenIssueForm(selectedStudentForMenu)
                          }
                        >
                          Issue Exam Form
                        </MenuItem>
                      </Menu>
                    </TableCell>
                  </TableRow>
                ))
            ) : (
              <TableRow>
                <TableCell colSpan={11} align="center" sx={{ py: 3 }}>
                  <Typography>No NDC dues data found</Typography>
                  {hasActiveFilters() && (
                    <Button
                      onClick={handleClearFilters}
                      startIcon={<ClearIcon />}
                      sx={{ mt: 1 }}
                    >
                      Clear filters to see all students
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25, 50]}
                count={filteredStudents.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                labelRowsPerPage="Rows per page:"
                SelectProps={{
                  native: true,
                }}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Dialog
        open={openAdminApprovalDialog}
        onClose={() => setOpenAdminApprovalDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Admin Approval</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 2, space: 2 }}>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd" }}>
                <Typography variant="body2">
                  <strong>{selectedStudent.CandidateName}</strong> (
                  {selectedStudent.StudentID})
                </Typography>
              </Paper>

              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                Select Due Types to Approve:
              </Typography>

              {Object.keys(approvalChecks).map((type) => (
                <Box
                  key={type}
                  sx={{
                    mb: 2,
                    p: 1.5,
                    border: "1px solid #ddd",
                    borderRadius: 1,
                  }}
                >
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={approvalChecks[type]}
                        onChange={(e) =>
                          setApprovalChecks({
                            ...approvalChecks,
                            [type]: e.target.checked,
                          })
                        }
                      />
                    }
                    label={type}
                  />
                  {approvalChecks[type] && (
                    <TextField
                      fullWidth
                      multiline
                      rows={2}
                      size="small"
                      placeholder={`Remarks for ${type}`}
                      value={approvalRemarks[type]}
                      onChange={(e) =>
                        setApprovalRemarks({
                          ...approvalRemarks,
                          [type]: e.target.value,
                        })
                      }
                      sx={{ mt: 1 }}
                    />
                  )}
                </Box>
              ))}

              <TextField
                fullWidth
                select
                label="Approval Status"
                value={approvalStatus}
                onChange={(e) => setApprovalStatus(e.target.value)}
                sx={{ mt: 2 }}
                SelectProps={{
                  native: true,
                }}
              >
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </TextField>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminApprovalDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmitAdminApproval}
            variant="contained"
            color="primary"
            disabled={approvalLoading}
          >
            {approvalLoading ? "Submitting..." : "Submit"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openAdminApprovalListDialog}
        onClose={() => setOpenAdminApprovalListDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Admin Approval History</DialogTitle>
        <DialogContent>
          {adminApprovalLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : adminApprovalList.length > 0 ? (
            <Box sx={{ pt: 2, space: 2 }}>
              {adminApprovalList.map((approval, index) => (
                <Paper key={index} sx={{ p: 2, mb: 2 }}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      mb: 1,
                    }}
                  >
                    <Box>
                      <Typography
                        variant="subtitle2"
                        sx={{ fontWeight: "bold" }}
                      >
                        {approval.due_type} - Semester {approval.sem}
                      </Typography>
                      <Typography variant="caption" sx={{ color: "#666" }}>
                        {approval.remark}
                      </Typography>
                    </Box>
                    
                  </Box>
                 
                </Paper>
              ))}
            </Box>
          ) : (
            <Typography sx={{ py: 4, textAlign: "center" }}>
              No approvals found for this student
            </Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAdminApprovalListDialog(false)}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={openIssueFormDialog}
        onClose={() => setOpenIssueFormDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Issue Exam Form</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box sx={{ pt: 2, space: 2 }}>
              <Paper sx={{ p: 2, mb: 2, backgroundColor: "#e3f2fd" }}>
                <Typography variant="body2">
                  <strong>{selectedStudent.CandidateName}</strong> (
                  {selectedStudent.StudentID})
                </Typography>
              </Paper>

              <Typography
                variant="subtitle2"
                sx={{ mb: 2, fontWeight: "bold" }}
              >
                Existing Exam Forms:
              </Typography>

              {issueFormLoading ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
                  <CircularProgress size={32} />
                </Box>
              ) : existingExamForms.length > 0 ? (
                <Box sx={{ mb: 2, maxHeight: 200, overflow: "auto" }}>
                  {existingExamForms.map((form, index) => (
                    <Paper
                      key={index}
                      sx={{ p: 1.5, mb: 1, backgroundColor: "#f5f5f5" }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          justifyContent: "space-between",
                        }}
                      >
                        <Typography variant="body2" sx={{ fontWeight: "bold" }}>
                          {form.form_type}
                        </Typography>
                        <Typography variant="body2">{form.session}</Typography>
                      </Box>
                      <Typography variant="caption">
                        Semester {form.sem}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              ) : (
                <Typography variant="body2" sx={{ mb: 2, color: "#666" }}>
                  No exam forms issued yet
                </Typography>
              )}

              <Paper
                sx={{
                  p: 2,
                  backgroundColor: "#fff3cd",
                  borderLeft: "4px solid #ffc107",
                }}
              >
                <Typography variant="body2">
                  A new <strong>Regular</strong> exam form will be issued for
                  the current semester.
                </Typography>
              </Paper>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenIssueFormDialog(false)}>Cancel</Button>
          <Button
            onClick={handleSubmitIssueForm}
            variant="contained"
            color="primary"
            disabled={issueFormSubmitting}
          >
            {issueFormSubmitting ? "Issuing..." : "Issue Form"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      />
    </div>
  );
};

export default NDCList;
