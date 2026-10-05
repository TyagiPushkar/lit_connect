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
import DownloadIcon from "@mui/icons-material/Download";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { useAuth } from "../auth/AuthContext";

function ListSkillsGrade({ setView }) {
    const { user } = useAuth();
    const isPrincipal = user?.role === "Principal";

    const [records, setRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);
    const [course, setCourse] = useState("");
    const [sem, setSem] = useState("");
    const [subject, setSubject] = useState("");
    const [subjectsList, setSubjectsList] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [studentMap, setStudentMap] = useState({});

    // Per-row edit state
    const [editId, setEditId] = useState(null);
    const [editGrade, setEditGrade] = useState("");

    // Fetch student name map for Principal view
    useEffect(() => {
        if (!isPrincipal) return;
        const fetchStudents = async () => {
            try {
                const res = await axios.get(
                    "https://namami-infotech.com/LIT/src/students/get_student.php",
                );
                if (res.data.success) {
                    const map = {};
                    res.data.data.forEach((s) => {
                        map[String(s.StudentID).toLowerCase()] = s.CandidateName;
                    });
                    setStudentMap(map);
                }
            } catch (err) {
                console.error("Failed to fetch students", err);
            }
        };
        fetchStudents();
    }, [isPrincipal]);

    // Fetch subjects based on Course & Sem
    useEffect(() => {
        const fetchSubjects = async () => {
            if (!course || !sem) return;
            try {
                const res = await fetch(
                    `https://namami-infotech.com/LIT/src/menu/subjects.php?Course=${course}&Sem=${sem}`,
                );
                const result = await res.json();
                if (result.success) {
                    setSubjectsList(result.data || []);
                } else {
                    setSubjectsList([]);
                }
            } catch (err) {
                console.error("Failed to fetch subjects", err);
                setSubjectsList([]);
            }
        };
        fetchSubjects();
    }, [course, sem]);

    // Fetch records when course, sem, subject are selected
    useEffect(() => {
        if (course && sem && subject) fetchRecords();
    }, [course, sem, subject]);

    // Search filter
    useEffect(() => {
        applyFilters();
    }, [searchTerm, records]);

    const fetchRecords = async () => {
        setLoading(true);
        try {
            const { data } = await axios.get(
                "https://namami-infotech.com/LIT/src/report/list_skills_grade.php",
                { params: { Course: course, Sem: sem, Subject: subject } },
            );
            if (data.success) setRecords(data.data);
            else setRecords([]);
        } catch (err) {
            console.error("Failed to fetch records", err);
        } finally {
            setLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = records;
        if (searchTerm.trim() !== "") {
            filtered = filtered.filter((item) =>
                item.StudId.toLowerCase().includes(searchTerm.toLowerCase()),
            );
        }
        setFilteredRecords(filtered);
        setPage(0);
    };

    const handleEditClick = (row) => {
        setEditId(row.Id);
        setEditGrade(row.Grade ?? "");
    };

    const handleCancelEdit = () => {
        setEditId(null);
        setEditGrade("");
    };

    const handleSave = async (id) => {
        try {
            const response = await axios.post(
                "https://namami-infotech.com/LIT/src/report/edit_skills_grade.php",
                { Id: id, Grade: editGrade },
            );

            if (response.data.success) {
                setRecords((prev) =>
                    prev.map((r) => (r.Id === id ? { ...r, Grade: editGrade } : r)),
                );
                setEditId(null);
            } else {
                alert(response.data.message || "Failed to update grade.");
            }
        } catch (error) {
            console.error("Error updating grade:", error);
            alert("Error updating grade.");
        }
    };

    const handleDownload = () => {
        const doc = new jsPDF({
            orientation: "landscape",
            unit: "pt",
            format: "a4",
            compress: true,
        });

        const pageWidth = doc.internal.pageSize.getWidth();

        doc.setFontSize(14);
        doc.setTextColor("#CC7A00");
        doc.text("Skills Grade Report", pageWidth / 2, 40, { align: "center" });

        doc.setFontSize(9);
        doc.setTextColor("#444444");
        doc.text(
            `Course: ${course}   |   Semester: ${sem}   |   Subject: ${subject}`,
            pageWidth / 2,
            56,
            { align: "center" },
        );

        const head = [["Student Name", "Student ID", "Course", "Semester", "Subject", "Grade"]];
        const body = filteredRecords.map((row) => [
            studentMap[String(row.StudId)] || "-",
            row.StudId,
            row.Course,
            row.Sem,
            row.Subject,
            row.Grade,
        ]);

        autoTable(doc, {
            head,
            body,
            startY: 68,
            theme: "striped",
            styles: { fontSize: 8, cellPadding: 3, overflow: "linebreak" },
            headStyles: { fillColor: [204, 122, 0], textColor: 255, fontStyle: "bold" },
            margin: { left: 30, right: 30 },
            tableWidth: "auto",
        });

        doc.save(`SkillsGrade_${course}_Sem${sem}_${subject}.pdf`);
    };

    return (
        <Box sx={{ p: 0 }}>
            <Box elevation={1} sx={{ p: 0, borderRadius: 2, mb: 1 }}>
                <Box
                    sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        mb: 1,
                    }}
                >
                    <Typography variant="h6" color="#CC7A00">
                        Skills Grade Report
                    </Typography>
                    {isPrincipal && filteredRecords.length > 0 && (
                        <Button
                            size="small"
                            variant="outlined"
                            startIcon={<DownloadIcon />}
                            onClick={handleDownload}
                            sx={{ color: "#CC7A00", borderColor: "#CC7A00" }}
                        >
                            Download Report
                        </Button>
                    )}
                </Box>

                <Grid container spacing={2}>
                    <Grid item xs={12} sm={6} md={3}>
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
                    <Grid item xs={12} sm={6} md={3}>
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
                    <Grid item xs={12} sm={6} md={3}>
                        <FormControl fullWidth size="small">
                            <InputLabel>Subject</InputLabel>
                            <Select
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                label="Subject"
                                disabled={subjectsList.length === 0}
                            >
                                {subjectsList.map((subj, index) => (
                                    <MenuItem key={index} value={subj.Subject}>
                                        {subj.Subject} ({subj.SubjectCode || "-"})
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6} md={3}>
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
                        <Table>
                            <TableHead sx={{ backgroundColor: "#CC7A00" }}>
                                <TableRow>
                                    {isPrincipal ? (
                                        <TableCell sx={{ color: "#fff" }}>Student Name</TableCell>
                                    ) : (
                                        <TableCell sx={{ color: "#fff" }}>Actions</TableCell>
                                    )}
                                    <TableCell sx={{ color: "#fff" }}>Student ID</TableCell>
                                    <TableCell sx={{ color: "#fff" }}>Course</TableCell>
                                    <TableCell sx={{ color: "#fff" }}>Semester</TableCell>
                                    <TableCell sx={{ color: "#fff" }}>Subject</TableCell>
                                    <TableCell sx={{ color: "#fff" }}>Grade</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {filteredRecords
                                    .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                                    .map((row) => {
                                        const isEditing = !isPrincipal && editId === row.Id;
                                        return (
                                            <TableRow key={row.Id}>
                                                {isPrincipal ? (
                                                    <TableCell>
                                                        {studentMap[String(row.StudId)] || "—"}
                                                    </TableCell>
                                                ) : (
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
                                                )}
                                                <TableCell>{row.StudId}</TableCell>
                                                <TableCell>{row.Course}</TableCell>
                                                <TableCell>{row.Sem}</TableCell>
                                                <TableCell>
                                                    {row.Subject} ({row.SubjectCode || "-"})
                                                </TableCell>
                                                <TableCell>
                                                    {isEditing ? (
                                                        <TextField
                                                            value={editGrade}
                                                            size="small"
                                                            onChange={(e) =>
                                                                setEditGrade(e.target.value.toUpperCase())
                                                            }
                                                            inputProps={{ style: { width: 60 } }}
                                                            placeholder="Grade"
                                                        />
                                                    ) : (
                                                        row.Grade
                                                    )}
                                                </TableCell>
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

export default ListSkillsGrade;
