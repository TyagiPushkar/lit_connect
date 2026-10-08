import React, { useState } from "react";
import Navbar from "../components/Navbar";
import Sidebar from "../components/Sidebar";
import {
  Box,
  useMediaQuery,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Paper,
  Grid,
} from "@mui/material";
import InternalExam from "../components/report/InternalExam";
import SemesterExam from "../components/report/SemesterExam";
import AssignmentReport from "../components/report/AssignmentReport";
import CBT from "../components/report/CBT";
import PPT from "../components/report/PPT";
import ClassTest from "../components/report/ClassTest";
import VstExam from "../components/report/VstExam";
import Skills from "../components/report/Skills";
import PrincipalInternalExam from "../components/report/PrincipalInternalExam";
import { useAuth } from "../components/auth/AuthContext";

function StudentReport() {
  const isMobile = useMediaQuery("(max-width:600px)");
  const drawerWidth = isMobile ? 0 : 100;
  const [category, setCategory] = useState("Internal Exam");
  const { user } = useAuth();
  const isPrincipal = user?.role === "Principal";
  const isExamination = user?.role === "Examination";
  // Check if the user is either Principal OR Examination
  const showPrincipalView = isPrincipal || isExamination;

  const renderComponent = () => {
    switch (category) {
      case "Internal Exam":
        return <InternalExam />;
      case "Semester Exam":
        return <SemesterExam />;
      case "Vst Exam":
        return <VstExam />;
      case "CBT":
        return <CBT />;
      case "PPT":
        return <PPT />;
      case "Class Test":
        return <ClassTest />;
      case "Assignment":
        return <AssignmentReport />;
      case "Skills":
        return <Skills />;
      default:
        return null;
    }
  };

  return (
    <Box sx={{ display: "flex", height: "100vh", backgroundColor: "#f4f6f8" }}>
      {/* Sidebar */}
      <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        className="scrollable-y"
        sx={{ flexGrow: 1, height: "100vh", overflowY: "auto", minWidth: 0 }}
      >
        <Navbar />

        <Box sx={{ px: 3, py: 2 }}>
          {showPrincipalView ? (
            <Paper
              elevation={1}
              sx={{ p: 2, borderRadius: 2, backgroundColor: "#ffffff" }}
            >
              <PrincipalInternalExam />
            </Paper>
          ) : (
            <>
              {/* Header & Category Selector */}
              <Paper
                elevation={1}
                sx={{
                  p: 2,
                  mb: 3,
                  borderRadius: 2,
                  backgroundColor: "#ffffff",
                }}
              >
                <Grid
                  container
                  alignItems="center"
                  spacing={2}
                  justifyContent="space-between"
                >
                  <Grid item xs={12} md="auto">
                    <Typography variant="h6" color="#CC7A00" fontWeight="bold">
                      {category} Report Dashboard
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth size="small">
                      <InputLabel id="category-label">
                        Report Category
                      </InputLabel>
                      <Select
                        labelId="category-label"
                        value={category}
                        label="Report Category"
                        onChange={(e) => setCategory(e.target.value)}
                      >
                        <MenuItem value="Internal Exam">Internal Exam</MenuItem>
                        <MenuItem value="Semester Exam">Semester Exam</MenuItem>
                        <MenuItem value="Vst Exam">Vst Exam</MenuItem>
                        {/* <MenuItem value="CBT">CBT</MenuItem> */}
                        <MenuItem value="PPT">PPT</MenuItem>
                        <MenuItem value="Class Test">Class Test</MenuItem>
                        <MenuItem value="Assignment">Assignment</MenuItem>
                        <MenuItem value="Skills">Skills</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>
              </Paper>

              {/* Dynamic Report Component */}
              <Box elevation={1} sx={{ p: 0, borderRadius: 2 }}>
                {renderComponent()}
              </Box>
            </>
          )}
        </Box>
      </Box>
    </Box>
  );
}

export default StudentReport;
