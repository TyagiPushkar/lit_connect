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
} from "@mui/material";
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
        if (selectedStudent) fetchVariableFees(selectedStudent.StudentID);
      } else {
        Swal.fire("Error", res.data.message, "error");
      }
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }
  };

  return (
    <div style={{ padding: 0 }}>
      <div
        style={{
          marginTop: 0,
          display: "flex",
          gap: 20,
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <h2>Variable Fee </h2>
        <Autocomplete
          options={students}
          getOptionLabel={(option) =>
            `${option.StudentID} - ${option.CandidateName}`
          }
          onChange={(event, value) => {
            setSelectedStudent(value);
            setVariableFees([]);
            if (value) fetchVariableFees(value.StudentID);
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Select Student"
              sx={{ width: "500px" }}
            />
          )}
          isOptionEqualToValue={(option, value) =>
            option.StudentID === value.StudentID
          }
        />
        <div style={{
         
          display: "flex",
          gap: 20,
          alignItems: "center",
        }}>
        <Button
          variant="outlined"
          sx={{
            color: "#CC7A00",
            borderColor: "#CC7A00",
            "&:hover": { borderColor: "#b56700", color: "#b56700" },
          }}
          onClick={handleSampleDownload}
        >
          Download Template
        </Button>
        <input
          type="file"
          accept=".xls,.xlsx,.csv"
          onChange={(e) => setUploadFile(e.target.files[0])}
        />
        <Button
          variant="contained"
          sx={{
            backgroundColor: "#CC7A00",
            "&:hover": { backgroundColor: "#b56700" },
          }}
          onClick={handleFileUpload}
        >
          Upload
        </Button>
        </div>
      </div>
      

      {selectedStudent && (
        <>
          <div style={{ marginTop: 10, display: "flex", gap: 10 }}></div>

          <h3 style={{ marginTop: 20 }}>Variable Fee List</h3>
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ backgroundColor: "#CC7A00", color: "white" }}
                  >
                    Particular
                  </TableCell>
                  <TableCell
                    sx={{ backgroundColor: "#CC7A00", color: "white" }}
                  >
                    Amount
                  </TableCell>
                  <TableCell
                    sx={{ backgroundColor: "#CC7A00", color: "white" }}
                  >
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {variableFees.length > 0 ? (
                  variableFees.map((fee, index) => (
                    <TableRow key={index}>
                      <TableCell>{fee.particular}</TableCell>
                      <TableCell>{fee.amount}</TableCell>
                      <TableCell>
                        {Number(fee.Paid) === 1 ? "Paid" : "Not Paid"}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={2}>No variable fees found.</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </>
      )}

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Add Variable Fee</DialogTitle>
        <DialogContent
          style={{ display: "flex", flexDirection: "column", gap: 16 }}
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
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            sx={{
              backgroundColor: "#CC7A00",
              "&:hover": { backgroundColor: "#b56700" },
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
    </div>
  );
};

export default VariableFeeManager;
