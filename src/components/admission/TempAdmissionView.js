import React, { useEffect, useState } from "react";
import {
  Typography,
  Paper,
  Box,
  CircularProgress,
  Grid,
  Button,
  Divider,
  Avatar,
  Dialog,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../../assets/images (1).png";

function TempAdmissionView() {
  const { activityId } = useParams();
  const [details, setDetails] = useState([]);
  const [checkpoints, setCheckpoints] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedImage, setSelectedImage] = useState("");

  // Checkpoint groups
  const sections = {
    "Address for Correspondence": [15, 16],
    "Academic Records of Qualifying Examination": [
      18, 19, 20, 21, 22, 23, 24, 25, 26, 27,
    ],
    "List of Attached Documents": [31, 33, 35, 37, 38, 39, 40],
    "Prefrences": [28,29,53, 54],
  };

  const candidateDetailsIds = [3, 5, 6, 7, 8, 9, 10, 11, 12, 52];
  const studentPhotoChkId = 4; // Assume 13 is the image URL

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const [detailsRes, checkpointsRes] = await Promise.all([
          axios.get(
            `http://139.5.190.143/LIT/src/menu/get_transaction_dtl.php?activityId=${encodeURIComponent(activityId)}`,
          ),
          axios.get(
            `http://139.5.190.143/LIT/src/menu/get_checkpoints.php`,
          ),
        ]);

        if (detailsRes.data.success && checkpointsRes.data.success) {
          const checkpointMap = {};
          checkpointsRes.data.data.forEach((cp) => {
            checkpointMap[cp.CheckpointId] = cp.Description;
          });
          setCheckpoints(checkpointMap);
          setDetails(detailsRes.data.data);
        } else {
          setError("No details or checkpoints found.");
        }
      } catch (err) {
        setError("Failed to fetch admission details.");
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [activityId]);

  const getValueByChkId = (chkId) => {
    const item = details.find((d) => parseInt(d.ChkId) === chkId);
    return item ? item.Value : "";
  };

 const handleNext = async () => {
  const fieldMap = {
    3: "CandidateName",
    4: "Photo",
    5: "Course",
    6: "GuardianName",
    7: "StudentContactNo",
    8: "GuardianContactNo",
    9: "EmailId",
    10: "BloodGroup",
    11: "Gender",
    12: "DOB",
    13: "ReligionCategory",
    15: "PermanentAddress",
    16: "PresentAddress",
    18: "Board10University",
    19: "Year10Passing",
    22: "Percentage10",
    21: "Board12University",
    24: "Year12PassingAlt",
    27: "Percentage12",
    24: "Council12Name",
    25: "Year12Passing",
    26: "RollNo12",
    27: "Stream12",
    28: "InterestInHostel",
    29: "InterestInTransport",
    31: "CharacterCertificate",
    33: "MigrationCertificate",
    35: "CollegeLeavingCertificate",
    37: "MarksheetCopy",
    38: "AadharCardCopy",
    39: "CasteCertificate",
    40: "BloodGroupCopy",
    52: "AlternateGaurdiaNumber",
    53: "Disabled",
    54: "RefrenceBy"
    // Add more mappings if required
  };

  const studentData = {
    StudentID: `STU-${activityId}`, // Or generate your logic
    TempID: activityId,
    SubmissionDate: new Date().toISOString().split("T")[0],
    Place: "Bhubaneswar", // Example value
    Remark: "", // Optional
  };

  details.forEach((item) => {
    const fieldName = fieldMap[item.ChkId];
    if (fieldName) {
      studentData[fieldName] = item.Value;
    }
  });

  console.log("Sending payload:", studentData);

  try {
    const response = await axios.post(
      "http://139.5.190.143/LIT/src/students/add_student.php",
      studentData,
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.data.success) {
  const studentId = response.data.data.StudentID;
const course = studentData.Course;
  // Save to localStorage
  localStorage.setItem("student_id", studentId);
localStorage.setItem("student_course", course);
  alert("Student record saved successfully.");
 navigate("/admissions/finalize", {
  state: { studentId, course }
});}
 else {
      alert("Error: " + response.data.message);
    }
  } catch (error) {
    console.error("Submission error:", error);
    alert("Failed to submit student data.");
  }
};



  const renderStudentDetails = () => {
    const fields = candidateDetailsIds.map((id) => ({
      label: checkpoints[id] || `Checkpoint #${id}`,
      value: getValueByChkId(id),
      isImage:
        id === studentPhotoChkId &&
        getValueByChkId(id).startsWith("http://139.5.190.143/"),
    }));

    const imageItem = fields.find((f) => f.isImage);
    const otherFields = fields.filter((f) => !f.isImage);

    return (
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={3} sx={{ textAlign: "center" }}>
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              mb: 2,
              width: "100%",
            }}
          >
            <Box
              component="img"
              src={getValueByChkId(studentPhotoChkId)}
              alt="Student"
              sx={{
                width: "180px",
                height: "180px",
                objectFit: "fill",
                borderRadius: 2,
                border: "1px solid #ccc",
                boxShadow: 2,
              }}
            />
          </Box>
        </Grid>
        <Grid item xs={12} sm={9}>
          <Grid container spacing={2}>
            {otherFields.map((f, idx) => (
              <Grid item xs={12} sm={4} key={idx}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {f.label}
                </Typography>
                <Typography variant="body1" sx={{ mb: 1 }}>
                  {f.value || "—"}
                </Typography>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    );
  };

  const renderSection = (title, checkpointIds) => {
    const sectionData = details.filter((item) =>
      checkpointIds.includes(parseInt(item.ChkId)),
    );
    if (sectionData.length === 0) return null;

    return (
      <Box key={title} sx={{ mb: 5 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{ color: "#CC7A00", fontWeight: 700 }}
        >
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={2}>
          {sectionData.map((item, index) => {
            const isImage =
              typeof item.Value === "string" &&
              item.Value.startsWith("http://139.5.190.143/");
            return (
              <Grid item xs={12} sm={3} key={index}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {checkpoints[item.ChkId] || `Checkpoint #${item.ChkId}`}
                </Typography>
                {isImage ? (
                  <Box
                    sx={{ mt: 1, cursor: "pointer" }}
                    onClick={() => {
                      setSelectedImage(item.Value);
                      setOpenDialog(true);
                    }}
                  >
                    <img
                      src={item.Value}
                      alt={`Checkpoint ${item.ChkId}`}
                      style={{
                        width: "50%",
                        height: "150px",
                        objectFit: "cover",
                        borderRadius: 8,
                        border: "1px solid #ccc",
                      }}
                    />
                  </Box>
                ) : (
                  <Typography variant="body1" sx={{ mb: 1.5 }}>
                    {item.Value || "—"}
                  </Typography>
                )}
              </Grid>
            );
          })}
        </Grid>

        {/* Dialog for Image Preview */}
        <Dialog
          open={openDialog}
          onClose={() => setOpenDialog(false)}
          maxWidth="md"
        >
          <Box sx={{ p: 2, textAlign: "center" }}>
            <img
              src={selectedImage}
              alt="Preview"
              style={{ maxWidth: "100%", maxHeight: "60vh", borderRadius: 8 }}
            />
            <Box sx={{ mt: 2 }}>
              <Button
                variant="contained"
                color="primary"
                href={selectedImage}
                download
              >
                Download Image
              </Button>
            </Box>
          </Box>
        </Dialog>
      </Box>
    );
  };

  if (loading) return <CircularProgress sx={{ mt: 5 }} />;
  if (error)
    return (
      <Typography color="error" sx={{ mt: 3 }}>
        {error}
      </Typography>
    );

  return (
  <Box sx={{ p: 2, background: "#fff", pb: 10 }}>
    {/* Header with Back button */}
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
          <Typography variant="h5" sx={{ fontWeight: 700, color: "#CC7A00" }}>
            Lakshay Institute Of Technology
          </Typography>
          <Typography variant="subtitle1">Admission Form Details</Typography>
        </Box>
      </Box>
      <Avatar
        src={logo}
        alt="College Logo"
        sx={{ width: 80, height: 80 }}
        variant="rounded"
      />
    </Box>

    {/* Main Paper */}
    <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
      {/* Student Details */}
      {renderStudentDetails()}

      {/* Remaining Sections */}
      {Object.entries(sections).map(([sectionTitle, ids]) =>
        renderSection(sectionTitle, ids),
      )}
    </Paper>

    {/* Fixed Footer: ONLY Next Button */}
    <Box
      sx={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        p: 2,
        display: "flex",
          justifyContent: "flex-end",
        gap:"100px",
        backgroundColor: "#fff",
        boxShadow: "0 -2px 8px rgba(0,0,0,0.05)",
        zIndex: 1000,
      }}
      >
        <Button
        variant="contained"
        sx={{ backgroundColor: "#CC7A00" }}
      >
        Reject
      </Button>
      <Button
        variant="contained"
        sx={{ backgroundColor: "#CC7A00" }}
        onClick={handleNext}
      >
        Enroll
      </Button>
    </Box>
  </Box>
);


}

export default TempAdmissionView;
