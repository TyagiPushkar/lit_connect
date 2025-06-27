import React, { useEffect, useState } from "react";
import {
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
  Button,
} from "@mui/material";
import axios from "axios";
import AddFeeStructureDialog from "./AddFeeStructureDialog";
import { useNavigate } from "react-router-dom";

const FeesTransaction = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [structures, setStructures] = useState([]);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(15);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const navigate = useNavigate();
  useEffect(() => {
    fetchFeeStructures();
  }, []);

  const fetchFeeStructures = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/fees/get_all_transactions.php",
      );
      if (response.data.success) {
        setStructures(response.data.data);
      } else {
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
    } catch (error) {
      setSnackbarMessage("Failed to fetch fee structures.");
      setOpenSnackbar(true);
    }
  };

  const handleChangePage = (event, newPage) => setPage(newPage);
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 0,
        }}
      >
              <h2>Fee Transaction List</h2>
               
      </div>
      <AddFeeStructureDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSuccess={fetchFeeStructures}
      />
      <TableContainer component={Paper}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white" }}>Studentend ID</TableCell>
              <TableCell style={{ color: "white" }}>Course</TableCell>
              <TableCell style={{ color: "white" }}>Installment</TableCell>
              <TableCell style={{ color: "white" }}>Tuition Fees</TableCell>
              <TableCell style={{ color: "white" }}>Exam Fees</TableCell>
              <TableCell style={{ color: "white" }}>Hostel Fees</TableCell>
              <TableCell style={{ color: "white" }}>Admission Fees</TableCell>
              <TableCell style={{ color: "white" }}>Prospectus Fees</TableCell>
                          <TableCell style={{ color: "white" }}>Mode</TableCell>
                          <TableCell style={{ color: "white" }}>Mode Id</TableCell>
                          <TableCell style={{ color: "white" }}>Total Amount</TableCell>
                          <TableCell style={{ color: "white" }}>Deposit Amount</TableCell>
                          <TableCell style={{ color: "white" }}>Balance Amount</TableCell>
                          <TableCell style={{ color: "white" }}>Payment Date</TableCell>
                            <TableCell style={{ color: "white" }}>Remark</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {structures
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.stu_id}</TableCell>
                  <TableCell>{row.course}</TableCell>
                  <TableCell>{row.installment}</TableCell>
                  <TableCell>{row.tuition_fees}</TableCell>
                  <TableCell>{row.exam_fees}</TableCell>
                  <TableCell>{row.hostel_fees}</TableCell>
                  <TableCell>{row.admission_fees}</TableCell>
                  <TableCell>{row.prospectus_fees}</TableCell>
                      <TableCell>{row.mode}</TableCell>
                      <TableCell>{row.mode_id}</TableCell>
                      <TableCell>{row.total_amount}</TableCell>
                      <TableCell>{row.deposit_amount}</TableCell>
                      <TableCell>{row.balance_amount}</TableCell>
                      <TableCell>{row.payment_date}</TableCell>
                        <TableCell>{row.Remark}</TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                count={structures.length}
                rowsPerPage={rowsPerPage}
                page={page}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
              />
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>

      <Snackbar
        open={openSnackbar}
        autoHideDuration={6000}
        onClose={() => setOpenSnackbar(false)}
        message={snackbarMessage}
      />
    </div>
  );
};

export default FeesTransaction;
