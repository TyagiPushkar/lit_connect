import React, { useEffect, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  CircularProgress,
  Button,
  Box,
  Chip,
} from "@mui/material";
import axios from "axios";
import { useAuth } from "../auth/AuthContext";
import AddNotices from "./AddNotices";

function ViewNotices() {
  const [notices, setNotices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const { user } = useAuth();

  const fetchNotices = async () => {
    try {
      const response = await axios.get(
        "https://namami-infotech.com/LIT/src/notification/get_notice.php?role=HR",
      );
      setNotices(response.data.notices || []);
    } catch (err) {
      setError("Failed to fetch notices");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotices();
  }, []);

  const handleNoticeAdded = () => {
    setLoading(true);
    fetchNotices();
  };

  const toggleStatus = async (notice) => {
    try {
      await axios.post(
        "https://namami-infotech.com/LIT/src/notification/update_notice_status.php",
        {
          id: notice.Id,
          status: notice.Status === "Active" ? "Inactive" : "Active",
        },
      );

      fetchNotices(); // refresh list
    } catch (error) {
      console.error("Status update failed");
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress sx={{ color: "#CC7A00" }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <>
      {/* Header */}
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={3}
      >
        <Typography variant="h5" fontWeight={600}>
          📢 College Notices
        </Typography>

        {user?.role === "HR" && (
          <Button
            variant="contained"
            onClick={() => setDialogOpen(true)}
            sx={{
              backgroundColor: "#CC7A00",
              px: 3,
              borderRadius: 2,
              "&:hover": { backgroundColor: "#b86a00" },
            }}
          >
            Add Notice
          </Button>
        )}
      </Box>

      {/* Table */}
      <TableContainer sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#CC7A00" }}>
              <TableCell sx={{ color: "#fff", fontWeight: 600 }}>
                Notice
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600, width: 150 }}>
                Date
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600, width: 100 }}>
                Status
              </TableCell>
              <TableCell sx={{ color: "#fff", fontWeight: 600, width: 140 }}>
                Action
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {notices.length > 0 ? (
              notices.map((notice) => (
                <TableRow
                  key={notice.Id}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "#FFF4E5",
                    },
                  }}
                >
                  <TableCell>
                    <Typography variant="body1" fontWeight={500}>
                      {notice.Text}
                    </Typography>
                  </TableCell>

                  <TableCell>
                    <Chip
                      label={notice.Date}
                      size="small"
                      sx={{
                        backgroundColor: "#FFF0D9",
                        color: "#CC7A00",
                        fontWeight: 500,
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body1"
                      fontWeight={500}
                      style={{
                        color: notice.Status == "Active" ? "green" : "red",
                      }}
                    >
                      {notice.Status}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    {user?.role === "HR" && (
                      <Button
                        size="small"
                        variant="contained"
                        onClick={() => toggleStatus(notice)}
                        sx={{
                          backgroundColor:
                            notice.Status === "Active"
                              ? "error.main"
                              : "success.main",
                          "&:hover": {
                            backgroundColor:
                              notice.Status === "Active"
                                ? "error.dark"
                                : "success.dark",
                          },
                          textTransform: "none",
                          fontSize: "12px",
                        }}
                      >
                        {notice.Status === "Active" ? "Deactivate" : "Activate"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={2} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    No notices available
                  </Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <AddNotices
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onNoticeAdded={handleNoticeAdded}
      />
    </>
  );
}

export default ViewNotices;
