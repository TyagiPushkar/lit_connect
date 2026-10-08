import React, { useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Typography,
  Grid,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DownloadIcon from "@mui/icons-material/Download";
import * as XLSX from "xlsx";
import Swal from "sweetalert2";
import ListPPTExam from "./ListPPTExam";

// Fields for each sub-category
const WRITTEN_FIELDS = ["qa", "lr", "eng", "tech"];
const PI_TECH_FIELDS = [
  "commun",
  "bodyLanguage",
  "clarityOfThoughts",
  "presentationSkill",
  "confidence",
  "techSkill",
  "gd",
];

function PPT() {
  const [course, setCourse] = useState("");
  const [sem, setSem] = useState("");
  const [date, setDate] = useState("");
  const [file, setFile] = useState(null);
  const [subCategory, setSubCategory] = useState("WRITTEN"); // default auto-selected

  const handleSubCategoryChange = (e, newVal) => {
    if (newVal !== null) {
      setSubCategory(newVal);
      setFile(null); // reset file when category changes
    }
  };

  const getSampleFields = () => {
    if (subCategory === "WRITTEN") return WRITTEN_FIELDS;
    return PI_TECH_FIELDS;
  };

  const handleDownloadSample = () => {
    const fields = getSampleFields();
    const header = ["studId", ...fields];
    const row1 = ["1001", ...fields.map(() => "2")];
    const row2 = ["1002", ...fields.map(() => "2")];
    const sampleData = [header, row1, row2];
    const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Sample");
    XLSX.writeFile(workbook, `PPT_${subCategory}_Sample.xlsx`);
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!course || !sem || !date || !file) {
      Swal.fire({
        icon: "warning",
        title: "All fields are required!",
        showConfirmButton: true,
      });
      return;
    }

    const formData = new FormData();
    formData.append("Course", course);
    formData.append("Sem", sem);
    formData.append("DateOfExam", date);
    formData.append("Category", subCategory); // send sub-category to backend
    formData.append("file", file);

    try {
      const res = await fetch(
        "https://namami-infotech.com/LIT/src/report/add_ppt_marks_prev.php",
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await res.json();
      if (result.success) {
        Swal.fire({
          icon: "success",
          title: result.message,
          showConfirmButton: true,
        });
        setCourse("");
        setSem("");
        setDate("");
        setFile(null);
      } else {
        Swal.fire({
          icon: "error",
          title: result.message || "Upload failed",
          showConfirmButton: true,
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Network or server error.",
        showConfirmButton: true,
      });
    }
  };

  return (
    <Box sx={{ p: 0 }}>
      {/* Sub-category toggle */}
      <Box sx={{ mb: 2, display: "flex", alignItems: "center", gap: 2 }}>
        <Typography variant="body2" fontWeight="bold" color="text.secondary">
          Category:
        </Typography>
        <ToggleButtonGroup
          value={subCategory}
          exclusive
          onChange={handleSubCategoryChange}
          size="small"
        >
          <ToggleButton
            value="WRITTEN"
            sx={{
              fontWeight: "bold",
              fontSize: "0.75rem",
              px: 2,
              "&.Mui-selected": {
                backgroundColor: "#CC7A00",
                color: "#fff",
                "&:hover": { backgroundColor: "#b36600" },
              },
            }}
          >
            WRITTEN
          </ToggleButton>
          <ToggleButton
            value="PI/TECH"
            sx={{
              fontWeight: "bold",
              fontSize: "0.75rem",
              px: 2,
              "&.Mui-selected": {
                backgroundColor: "#CC7A00",
                color: "#fff",
                "&:hover": { backgroundColor: "#b36600" },
              },
            }}
          >
            PI/TECH
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {/* Upload form */}
      <Grid container spacing={2} alignItems="center">
        <Grid item>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel>Course</InputLabel>
            <Select
              value={course}
              label="Course"
              onChange={(e) => setCourse(e.target.value)}
            >
              <MenuItem value="BSc. DS">BSc. DS</MenuItem>
              <MenuItem value="BSc. CS(H)">BSc. CS(H)</MenuItem>
              <MenuItem value="BSc. ITM(H)">BSc. ITM(H)</MenuItem>
              <MenuItem value="BCA">BCA</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Semester</InputLabel>
            <Select
              value={sem}
              label="Semester"
              onChange={(e) => setSem(e.target.value)}
            >
              {[1, 2, 3, 4, 5, 6].map((num) => (
                <MenuItem key={num} value={num}>
                  {num}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item>
          <TextField
            label="Exam Date"
            type="date"
            size="small"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
            sx={{ minWidth: 160 }}
          />
        </Grid>

        <Grid item>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadSample}
          >
            Download Sample ({subCategory})
          </Button>
        </Grid>

        <Grid item>
          <Button
            size="small"
            variant="contained"
            component="label"
            startIcon={<CloudUploadIcon />}
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#b36600" },
            }}
          >
            Upload Excel
            <input
              type="file"
              accept=".xlsx, .xls"
              hidden
              onChange={handleFileChange}
            />
          </Button>
        </Grid>

        <Grid item>
          <Button
            size="small"
            variant="contained"
            disabled={!file || !course || !sem || !date}
            onClick={handleUpload}
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#b36600" },
            }}
          >
            Submit
          </Button>
        </Grid>

        {file && (
          <Grid item>
            <Typography variant="caption" color="text.secondary">
              {file.name}
            </Typography>
          </Grid>
        )}
      </Grid>

      {/* List table — passes subCategory so it shows the right columns */}
      <Box mt={2}>
        <ListPPTExam subCategory={subCategory} />
      </Box>
    </Box>
  );
}

export default PPT;
