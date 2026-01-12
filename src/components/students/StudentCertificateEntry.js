import React, { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Snackbar,
  Divider,
  Grid,
  Avatar,
} from "@mui/material";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import logo from "../../assets/images (1).png";

const StudentCertificateEntry = () => {
  const { studentId } = useParams();

  const [student, setStudent] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [snackbar, setSnackbar] = useState("");
const navigate = useNavigate();
  useEffect(() => {
    fetchStudent();
    fetchCertificates();
  }, []);

  const formatDate = (date) => {
    if (!date) return "-";
    const d = new Date(date);
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const fetchStudent = async () => {
    const res = await axios.get(
      "https://namami-infotech.com/LIT/src/students/get_student.php"
    );
    const found = res.data.data.find(
      (s) => String(s.StudentID) === String(studentId)
    );
    setStudent(found);
  };

  const fetchCertificates = async () => {
    const res = await axios.get(
      `https://namami-infotech.com/LIT/src/students/get_student_certificate.php?StudentId=${studentId}`
    );

    const processed = res.data.data.map((c) => {
      let status = c.Status;
      if (c.ReceivedDateTime && c.ReturnDateTime) {
        status = "Completed";
      }
      return { ...c, Status: status };
    });

    setCertificates(processed);
  };

  const handleAction = async (certificateId, action) => {
    await axios.post(
      "https://namami-infotech.com/LIT/src/students/student_certificate.php",
      {
        StudentId: studentId,
        CertificateId: certificateId,
        Action: action,
      }
    );

    setSnackbar(`Certificate ${action} successfully`);
    fetchCertificates();
  };

  return (
    <Box p={2}>
      {/* STUDENT DETAILS – SINGLE ROW */}
      {student && (
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            mb: 3,
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <Button
              variant="outlined"
              onClick={() => navigate(-1)}
              sx={{ color: "#CC7A00", borderColor: "#CC7A00" }}
            >
              Back
            </Button>
            <Box>
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, color: "#CC7A00" }}
              >
                Lakshya Institute Of Technology
              </Typography>
              <Typography variant="subtitle1">
                Student Info: {student.StudentID}
              </Typography>
            </Box>
          </Box>
          <Avatar
            src={logo}
            alt="Logo"
            variant="rounded"
            sx={{ width: 80, height: 80 }}
          />
        </Box>
      )}
      {student && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Grid container spacing={2}>
            <Grid item xs={3}>
              <b>ID:</b> {student.StudentID}
            </Grid>
            <Grid item xs={3}>
              <b>Name:</b> {student.CandidateName}
            </Grid>
            <Grid item xs={2}>
              <b>Course:</b> {student.Course}
            </Grid>
            <Grid item xs={2}>
              <b>Sem:</b> {student.Sem}
            </Grid>
            <Grid item xs={2}>
              <b>Session:</b> {student.Session}
            </Grid>
          </Grid>
        </Paper>
      )}

      {/* TABLES SIDE BY SIDE */}
      <Grid container spacing={2}>
        {/* LEFT – ACTION TABLE */}
        <Grid item xs={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Certificate Actions
            </Typography>

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Certificate</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Action</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {certificates.map((c) => (
                  <TableRow key={c.CertificateId}>
                    <TableCell>{c.CertificateName}</TableCell>

                    <TableCell>
                      <Chip
                        label={c.Status}
                        color={
                          c.Status === "Completed"
                            ? "success"
                            : c.Status === "Received"
                            ? "info"
                            : "warning"
                        }
                        size="small"
                      />
                    </TableCell>

                    <TableCell>
                      {c.Status === "Pending" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="success"
                          onClick={() =>
                            handleAction(c.CertificateId, "received")
                          }
                        >
                          Receive
                        </Button>
                      )}

                      {c.Status === "Received" && (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() =>
                            handleAction(c.CertificateId, "returned")
                          }
                        >
                          Return
                        </Button>
                      )}

                      {c.Status === "Completed" && (
                        <Button size="small" disabled>
                          Completed
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>

        {/* RIGHT – HISTORY TABLE */}
        <Grid item xs={6}>
          <Paper sx={{ p: 2, height: "100%" }}>
            <Typography variant="h6" gutterBottom>
              Certificate History
            </Typography>

            <Divider sx={{ mb: 1 }} />

            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Certificate</TableCell>
                  <TableCell>Received At</TableCell>
                  <TableCell>Returned At</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {certificates.map((c) => (
                  <TableRow key={c.CertificateId}>
                    <TableCell>{c.CertificateName}</TableCell>
                    <TableCell>{formatDate(c.ReceivedDateTime)}</TableCell>
                    <TableCell>{formatDate(c.ReturnDateTime)}</TableCell>
                    <TableCell>
                      <Chip
                        label={c.Status}
                        size="small"
                        color={
                          c.Status === "Completed"
                            ? "success"
                            : c.Status === "Received"
                            ? "info"
                            : "warning"
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Paper>
        </Grid>
      </Grid>

      <Snackbar
        open={!!snackbar}
        autoHideDuration={4000}
        onClose={() => setSnackbar("")}
        message={snackbar}
      />
    </Box>
  );
};

export default StudentCertificateEntry;
