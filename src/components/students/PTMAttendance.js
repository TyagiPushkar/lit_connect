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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { useAuth } from "../auth/AuthContext";

const API_BASE = "https://namami-infotech.com/LIT/src/Ptm";

const todayISO = () => new Date().toISOString().split("T")[0];

export default function PTMAttendance({ studentId, currentSem, studentName }) {
  const { user } = useAuth();
  const isHR = user?.role === "HR";

  const [ptmRecords, setPtmRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editRecord, setEditRecord] = useState(null);

  const fetchPTMRecords = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${API_BASE}/fetch_ptm.php?StudentId=${encodeURIComponent(studentId)}`
      );
      const json = await res.json();
      setPtmRecords(json.success && json.data ? json.data : []);
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

  const normalizedRecords = ptmRecords
    .filter((r) => r.PTMDate && String(r.Sem) === String(currentSem))
    .map((r) => {
      const attended = String(r.Attended ?? "").trim();
      return {
        ...r,
        Attended:
          attended === "Yes" || attended === "1" || attended.toLowerCase() === "yes"
            ? "Yes"
            : "No",
      };
    });

  const handleOpenDialog = (existing = null) => {
    setEditRecord({
      Sem: existing?.Sem ?? currentSem ?? "",
      PTMDate: existing?.PTMDate || todayISO(),
      Remarks: existing?.Remarks ?? "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const attended = editRecord.Remarks?.trim() ? "Yes" : "No";

      const res = await fetch(`${API_BASE}/mark_attendance.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          StudentId: studentId,
          StudentName: studentName,
          Sem: editRecord.Sem,
          PTMDate: editRecord.PTMDate,
          Attended: attended,
          Remarks: editRecord.Remarks || "",
        }),
      });
      const json = await res.json();
      if (!json.success) {
        alert(json.message || "Failed to save.");
        return;
      }

      setDialogOpen(false);
      await fetchPTMRecords();
      alert("Saved successfully.");
    } catch (err) {
      console.error(err);
      alert("Something went wrong.");
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
            + Add Remarks
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
                <TableCell sx={{ fontWeight: 700 }}>PTM Date</TableCell>
                <TableCell sx={{ fontWeight: 700 }}>Remarks</TableCell>
               
              </TableRow>
            </TableHead>
            <TableBody>
              {normalizedRecords.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} sx={{ textAlign: "center", color: "#999", fontStyle: "italic" }}>
                    No PTM records found.
                  </TableCell>
                </TableRow>
              ) : (
                normalizedRecords.map((rec, idx) => (
                  <TableRow key={idx} hover>
                    <TableCell>
                      {new Date(rec.PTMDate).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell sx={{ color: "#555" }}>{rec.Remarks || "—"}</TableCell>
                   
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add Remarks</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Remarks"
            size="small"
            multiline
            rows={4}
            value={editRecord?.Remarks || ""}
            onChange={(e) => setEditRecord((prev) => ({ ...prev, Remarks: e.target.value }))}
            fullWidth
            helperText="Adding remarks will mark the student as Attended. Leaving empty marks as Not Attended."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)} sx={{ color: "#666" }}>Cancel</Button>
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
