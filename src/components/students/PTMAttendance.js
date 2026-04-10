import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  TextField,
  CircularProgress,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../auth/AuthContext";

const API_BASE = "https://namami-infotech.com/LIT/src/Ptm";

export default function PTMAttendance({ studentId, currentSem, studentName }) {
  const { user } = useAuth();
  console.log(user);
  const isHR = user?.role === "HR";

  const [ptmRecords, setPtmRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null); // { Sem, PTMDate, Attended }

  const totalSems = parseInt(currentSem) || 1;
  const semList = Array.from({ length: totalSems }, (_, i) => i + 1);

  const fetchPTMRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/fetch_ptm.php?StudentId=${encodeURIComponent(studentId)}`
      );
      const json = await res.json();
      if (json.success && json.data) {
        setPtmRecords(json.data);
      } else {
        setPtmRecords([]);
      }
    } catch {
      setError("Failed to load PTM records.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (studentId) fetchPTMRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]);

  // Normalize all records (filter out ones with no PTMDate)
  const normalizedRecords = ptmRecords
    .filter((r) => r.PTMDate)
    .map((r) => {
      const attended = String(r.Attended ?? "").trim();
      return {
        ...r,
        Attended:
          attended === "Yes" || attended === "1" || attended.toLowerCase() === "yes"
            ? "Yes"
            : attended === "Pending"
            ? "Pending"
            : "No",
      };
    });

  const handleOpenDialog = (existing = null) => {
    setEditRecord({
      Sem: existing?.Sem ?? "",
      PTMDate: existing?.PTMDate || "",
      Attended: existing?.Attended ?? "",
      Remarks: existing?.Remarks ?? "",
      isCreate: !existing,
    });
    setDialogOpen(true);
  };

 const handleSave = async () => {
  if (!editRecord.Sem) {
    alert("Please select semester");
    return;
  }

  if (!editRecord.PTMDate) {
    alert("Please enter PTM date");
    return;
  }

  setSaving(true);

  try {
    let res, json;

    // ✅ CREATE PTM EVENT
    if (editRecord.isCreate) {
      res = await fetch(`${API_BASE}/create_ptm.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          Sem: editRecord.Sem,
          PTMDate: editRecord.PTMDate,
          Remarks: editRecord.Remarks || "",
        }),
      });

      json = await res.json();

      if (!json.success) {
        alert(json.message || "Failed to create PTM event");
        return;
      }
    }

    // ✅ MARK ATTENDANCE
    else {
      if (editRecord.Attended === "") {
        alert("Please select attendance");
        return;
      }

      res = await fetch(`${API_BASE}/mark_attendance.php`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          StudentId: studentId,
          StudentName: studentName,
          Sem: editRecord.Sem,
          PTMDate: editRecord.PTMDate,
          Attended: editRecord.Attended,
          Remarks: editRecord.Remarks || "",
        }),
      });

      json = await res.json();

      if (!json.success) {
        alert(json.message || "Failed to mark attendance");
        return;
      }
    }

    setDialogOpen(false);
    await fetchPTMRecords();
    alert(editRecord.isCreate ? "PTM event created successfully." : "Attendance marked successfully.");

  } catch (err) {
    console.error(err);
    alert("Something went wrong");
  } finally {
    setSaving(false);
  }
};

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: "#CC7A00" }}>
          PTM (Parent-Teacher Meeting) Attendance
        </Typography>
        {isHR && (
          <Button
            variant="contained"
            size="small"
            onClick={() => handleOpenDialog(null)}
            sx={{ backgroundColor: "#CC7A00", "&:hover": { backgroundColor: "#a86200" }, textTransform: "none" }}
          >
            + Add PTM Event
          </Button>
        )}
      </Box>

      {loading ? (
        <Box sx={{ textAlign: "center", py: 2 }}>
          <CircularProgress size={24} sx={{ color: "#CC7A00" }} />
        </Box>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : (
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell sx={{ fontWeight: 700 }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>PTM Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Attendance</TableCell>
                {isHR && (
                  <TableCell sx={{ fontWeight: 700 }}>Action</TableCell>
                )}
              </TableRow>
            </TableHead>
            <TableBody>
              {normalizedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={isHR ? 4 : 3} sx={{ textAlign: "center", color: "#999", fontStyle: "italic" }}>
                    No PTM records found.
                  </TableCell>
                </TableRow>
              ) : (
                normalizedRecords.map((rec, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>Semester {rec.Sem}</TableCell>
                    <TableCell>
                      {new Date(rec.PTMDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      {rec.Attended === "Yes" ? (
                        <Chip icon={<CheckCircleIcon />} label="Attended" color="success" size="small" />
                      ) : (
                        <Chip icon={<CancelIcon />} label="Not Attended" color="error" size="small" />
                      )}
                    </TableCell>
                    {isHR && (
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<EditIcon />}
                          onClick={() => handleOpenDialog(rec)}
                          sx={{ color: "#CC7A00", textTransform: "none" }}
                        >
                          Edit
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Mark/Edit Dialog — HR only */}
      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>
          PTM Attendance — Semester {editRecord?.Sem}
        </DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
          <FormControl size="small" fullWidth>
            <InputLabel>Semester</InputLabel>
            <Select
              value={editRecord?.Sem ?? ""}
              label="Semester"
              onChange={(e) =>
                setEditRecord((prev) => ({ ...prev, Sem: e.target.value }))
              }
            >
              {semList.map((s) => (
                <MenuItem key={s} value={s}>Semester {s}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="PTM Date"
            type="date"
            size="small"
            InputLabelProps={{ shrink: true }}
            value={editRecord?.PTMDate || ""}
            onChange={(e) =>
              setEditRecord((prev) => ({ ...prev, PTMDate: e.target.value }))
            }
            fullWidth
          />
         {!editRecord?.isCreate && (
  <FormControl size="small" fullWidth>
    <InputLabel>Attendance</InputLabel>
    <Select
      value={editRecord?.Attended ?? ""}
      label="Attendance"
      onChange={(e) =>
        setEditRecord((prev) => ({ ...prev, Attended: e.target.value }))
      }
    >
      <MenuItem value="Yes">Attended</MenuItem>
      <MenuItem value="No">Not Attended</MenuItem>
    </Select>
  </FormControl>
)}
          <TextField
            label="Remarks"
            size="small"
            multiline
            rows={3}
            value={editRecord?.Remarks || ""}
            onChange={(e) =>
              setEditRecord((prev) => ({ ...prev, Remarks: e.target.value }))
            }
            fullWidth
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: "#666" }}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving}
            variant="contained"
            sx={{ backgroundColor: "#CC7A00", "&:hover": { backgroundColor: "#a86200" } }}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
