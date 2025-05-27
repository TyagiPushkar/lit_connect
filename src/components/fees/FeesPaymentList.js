import React, { useState, useEffect } from "react";
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
  CircularProgress,
  Box,
  Autocomplete,
} from "@mui/material";

import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import { useNavigate } from "react-router-dom";
import VisibilityIcon from "@mui/icons-material/Visibility";

const FeesPaymentList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [openSnackbar, setOpenSnackbar] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [selectedSession, setSelectedSession] = useState("");
  const [distinctSessions, setDistinctSessions] = useState([]);

  useEffect(() => {
    fetchLibraryTransactions();
  }, []);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [transactions, searchQuery]);

  const fetchLibraryTransactions = async () => {
    setLoading(true);
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/students/get_student.php",
      );
      if (response.data.success) {
        setTransactions(response.data.data);
        setFilteredTransactions(response.data.data);
      } else {
        setSnackbarMessage(response.data.message);
        setOpenSnackbar(true);
      }
      const sessions = [
        ...new Set(
          response.data.data.map((item) => item.Session).filter(Boolean),
        ),
      ];
      setDistinctSessions(sessions);
    } catch (error) {
      setSnackbarMessage("Error fetching student list.");
      setOpenSnackbar(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query, session = selectedSession) => {
    setSearchQuery(query);
    const lower = query.toLowerCase();

    const filtered = transactions.filter((tx) => {
      const matchesQuery =
        (tx.StudentID && tx.StudentID.toLowerCase().includes(lower)) ||
        (tx.CandidateName && tx.CandidateName.toLowerCase().includes(lower));

      const matchesSession = session ? tx.Session === session : true;
      return matchesQuery && matchesSession;
    });

    setFilteredTransactions(filtered);
    setPage(0);
  };
  const handleSessionChange = (event) => {
    const session = event.target.value;
    setSelectedSession(session);
    handleSearch(searchQuery, session);
  };

  const handleChangePage = (event, newPage) => setPage(newPage);

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewClick = (studentId) => {
    navigate(`/fees/${studentId}`);
  };
  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        height="60vh"
      >
        <CircularProgress size={60} thickness={5} />
      </Box>
    );
  }

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
        <h2>Student Fees</h2>
        <Autocomplete
          options={distinctSessions}
          value={selectedSession}
          onChange={(event, newValue) => {
            setSelectedSession(newValue || "");
            handleSearch(searchQuery, newValue || "");
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              label="Session"
              variant="outlined"
              size="small"
            />
          )}
          style={{ minWidth: 200 }}
          clearOnEscape
          isOptionEqualToValue={(option, value) => option === value}
        />

        <TextField
          label="Search by Student ID or Name"
          variant="outlined"
          size="small"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
              <TableCell style={{ color: "white" }}>Student ID</TableCell>
              <TableCell style={{ color: "white" }}>Student Name</TableCell>
              <TableCell style={{ color: "white" }}>Course</TableCell>
              <TableCell style={{ color: "white" }}>Session</TableCell>
              <TableCell style={{ color: "white" }}>Action</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions
              .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
              .map((tx) => (
                <TableRow key={tx.TransactionId || tx.StudentID}>
                  <TableCell>{tx.StudentID}</TableCell>
                  <TableCell>{tx.CandidateName}</TableCell>
                  <TableCell>{tx.Course}</TableCell>
                  <TableCell>{tx.Session}</TableCell>

                  <TableCell>
                    <VisibilityIcon
                      color="primary"
                      sx={{ cursor: "pointer" }}
                      onClick={() => handleViewClick(tx.StudentID)}
                    />
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
          <TableFooter>
            <TableRow>
              <TablePagination
                rowsPerPageOptions={[5, 10, 25]}
                count={filteredTransactions.length}
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

export default FeesPaymentList;
