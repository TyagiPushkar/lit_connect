import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
  Grid,
  CircularProgress,
  Paper,
  Avatar,
  Divider,
  Button,
  TextField,
  ImageList,
  ImageListItem,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import logo from "../../assets/images (1).png";
import StudentFeesTransaction from "../fees/StudentFeesTransaction";
import StudentReports from "./StudentReport";
import { useAuth } from "../auth/AuthContext";

function StudentDetail() {
  const { user } = useAuth();
  const { studentId } = useParams();
  const navigate = useNavigate();
  const [student, setStudent] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openImage, setOpenImage] = useState(null);

  useEffect(() => {
    const fetchStudent = async () => {
      try {
        const res = await fetch(
          `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
        );
        const json = await res.json();
        if (json.success && json.data) {
          setStudent(json.data);
          setFormData(json.data);
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

  const handleChange = (key, value) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    try {
      const response = await fetch(
        `https://namami-infotech.com/LIT/src/students/edit_student.php`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...formData, Id: student.Id }),
        }
      );
      const json = await response.json();
      if (json.success) {
        setStudent(formData);
        setEditMode(false);
        alert("Student details updated successfully.");
      } else {
        alert(json.message || "Update failed.");
      }
    } catch (err) {
      alert("Error saving student details.");
    }
  };

  const handleImageClick = (imageUrl) => {
    setOpenImage(imageUrl);
  };

  const handleCloseImage = () => {
    setOpenImage(null);
  };

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
        { label: "Student ID", key: "StudentID", editable: false },
        { label: "Refrence By", key: "RefrenceBy", editable: false },
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
        { label: "Submission Date", key: "SubmissionDate", editable: false },
      ],
    },
    {
      title: "Address Details",
      fields: [
        { label: "Permanent Address", key: "PermanentAddress" },
        { label: "Present Address", key: "PresentAddress" },
      ],
    },
    {
      title: "Documents",
      fields: [
        { label: "Photo", key: "Photo", type: "image" },
        { label: "Character Certificate", key: "CharacterCertificate", type: "image" },
        { label: "Migration Certificate", key: "MigrationCertificate", type: "image" },
        { label: "College Leaving Certificate", key: "CollegeLeavingCertificate", type: "image" },
        { label: "Marksheet Copy", key: "MarksheetCopy", type: "image" },
        { label: "Aadhar Card Copy", key: "AadharCardCopy", type: "image" },
        { label: "Caste Certificate", key: "CasteCertificate", type: "image" },
        { label: "Blood Group Copy", key: "BloodGroupCopy", type: "image" },
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

      <StudentFeesTransaction />

      {/* Actions */}
      {user.role == "HR" && (
        <Box sx={{ mb: 2, textAlign: "right" }}>
          {!editMode ? (
            <Button variant="contained" onClick={() => setEditMode(true)} sx={{ backgroundColor: "#CC7A00" }}>
              Edit
            </Button>
          ) : (
            <Button variant="contained" onClick={handleSave} sx={{ backgroundColor: "#2e7d32" }}>
              Save
            </Button>
          )}
        </Box>
      )}

      {/* Content */}
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
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
                  {f.type === "image" ? (
                    student[f.key] ? (
                      <>
                        <Box
                          component="img"
                          src={student[f.key]}
                          alt={f.label}
                          sx={{
                            width: 100,
                            height: 100,
                            objectFit: "cover",
                            cursor: "pointer",
                            "&:hover": { opacity: 0.8 },
                          }}
                          onClick={() => handleImageClick(student[f.key])}
                        />
                        <Typography variant="caption" sx={{ display: "block", mt: 1 }}>
                          <a href={student[f.key]} target="_blank" rel="noopener noreferrer">
                            Open in new tab
                          </a>
                        </Typography>
                      </>
                    ) : (
                      <Typography variant="body1">Not uploaded</Typography>
                    )
                  ) : !editMode ? (
                    <Typography variant="body1">{student[f.key] || "—"}</Typography>
                  ) : (
                    <TextField
                      size="small"
                      fullWidth
                      value={formData[f.key] || ""}
                      onChange={(e) => handleChange(f.key, e.target.value)}
                      disabled={f.editable === false}
                    />
                  )}
                </Grid>
              ))}
            </Grid>
          </Box>
        ))}
      </Paper>

      {/* Image Dialog */}
      <Dialog open={Boolean(openImage)} onClose={handleCloseImage} maxWidth="md">
        <DialogContent>
          <img
            src={openImage}
            alt="Document"
            style={{ width: "100%", height: "auto" }}
          />
        </DialogContent>
      </Dialog>

      <StudentReports />
    </Box>
  );
}

export default StudentDetail;