import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Avatar,
  Divider,
  Button
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/images (1).png";
import StudentFeesTransaction from "../fees/StudentFeesTransaction";

function StudentDetail() {
  const { studentId } = useParams(); 
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
        );
        const json = await res.json();
        if (json.success) {
          setStudent(json.data);
        } else {
          setError("Student not found.");
        }
      } catch (err) {
        setError("Error fetching student data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudent();
  }, [studentId]);

  if (loading) return <CircularProgress sx={{ mt: 5 }} />;
  if (error)
    return (
      <Typography color="error" sx={{ mt: 5 }}>
        {error}
      </Typography>
    );

  const fieldGroups = [
    {
      title: "Personal Information",
      fields: [
        { label: "Candidate Name", key: "CandidateName" },
        { label: "Guardian Name", key: "GuardianName" },
        { label: "DOB", key: "DOB" },
        { label: "Gender", key: "Gender" },
        { label: "Email", key: "EmailId" },
        { label: "Blood Group", key: "BloodGroup" },
        { label: "Religion Category", key: "ReligionCategory" },
        { label: "Student Contact", key: "StudentContactNo" },
        { label: "Guardian Contact", key: "GuardianContactNo" },
      ],
    },
    {
      title: "Academic Information",
      fields: [
        { label: "Course", key: "Course" },
        { label: "Council Name", key: "Council12Name" },
        { label: "Year 12th Passing", key: "Year12Passing" },
        { label: "Stream", key: "Stream12" },
        { label: "Board 10th", key: "Board10University" },
        { label: "Year 10th Passing", key: "Year10Passing" },
        { label: "10th %", key: "Percentage10" },
        { label: "12th %", key: "Percentage12" },
      ],
    },
    {
      title: "Address Details",
      fields: [
        { label: "Permanent Address", key: "PermanentAddress" },
        { label: "Present Address", key: "PresentAddress" },
      ],
    },
  ];

  return (
    <Box sx={{ p: 2, background: "#fff", pb: 6 }}>
      {/* Header */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 3 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Button variant="outlined" onClick={() => navigate(-1)} sx={{ color: "#CC7A00", borderColor: "#CC7A00" }}>
            Back
          </Button>
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 700, color: "#CC7A00" }}>
              Lakshay Institute Of Technology
            </Typography>
            <Typography variant="subtitle1">Student Info: {student.StudentID}</Typography>
          </Box>
        </Box>
        <Avatar src={logo} alt="Logo" variant="rounded" sx={{ width: 80, height: 80 }} />
      </Box>
<StudentFeesTransaction/>
      {/* Content */}
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
        {/* Student Image */}
        {/* {student.Photo && (
          <Box sx={{ display: "flex", justifyContent: "center", mb: 4 }}>
            <Box
              component="img"
              src={student.Photo}
              alt="Student"
              sx={{
                width: "180px",
                height: "180px",
                objectFit: "cover",
                borderRadius: 3,
                border: "1px solid #ccc",
                boxShadow: 2,
              }}
            />
          </Box>
        )} */}

        {/* Sections */}
        {fieldGroups.map((group, idx) => (
          <Box key={idx} sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ color: "#CC7A00", fontWeight: 700, mb: 1 }}>
              {group.title}
            </Typography>
            <Divider sx={{ mb: 2 }} />
            <Grid container spacing={2}>
              {group.fields.map((f, i) => (
                <Grid item xs={12} sm={4} key={i}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {f.label}
                  </Typography>
                  <Typography variant="body1">{student[f.key] || "—"}</Typography>
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Paper>
      
    </Box>
  );
}

export default StudentDetail;
