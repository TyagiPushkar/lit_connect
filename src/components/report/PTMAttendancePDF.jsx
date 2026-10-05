"use client";

import useSWR from "swr";
import {
    Box,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

const fetchJSON = async (url) => {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    const json = await res.json();
    return json?.success && json?.data ? json.data : [];
};

const tableCellSx = {
    border: "1px solid #111",
    "& .MuiTableCell-root": {
        padding: "6px 10px",
        fontSize: "20px",
        lineHeight: 1.3,
        fontFamily: "Inter, Roboto, Arial, sans-serif",
        color: "#000000",
        border: "1px solid #111",
    },
};

const headerCellSx = {
    fontWeight: "bold",
    fontSize: "20px",
    textAlign: "center",
};

const formatPtmDate = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
};

export default function PTMAttendancePDF({ studentId, semester }) {
    const { data: ptmRecords = [], isLoading } = useSWR(
        studentId
            ? `https://namami-infotech.com/LIT/src/Ptm/fetch_ptm.php?StudentId=${encodeURIComponent(
                studentId
            )}`
            : null,
        fetchJSON
    );

    const records = (ptmRecords || [])
        .filter(
            (row) =>
                row?.PTMDate &&
                (!semester || String(row.Sem) === String(semester))
        )
        .sort(
            (a, b) =>
                new Date(a.PTMDate).getTime() - new Date(b.PTMDate).getTime()
        );

    if (isLoading) {
        return null;
    }

    return (
        <Box sx={{ mt: 4 }} className="pdf-block">
            <Typography
                variant="h6"
                sx={{
                    backgroundColor: "#2c3e50",
                    color: "white",
                    padding: "8px 16px",
                    display: "inline-block",
                    marginBottom: "15px",
                    fontFamily: '"Georgia", serif',
                    fontWeight: "bold",
                }}
            >
                PTM Attendance
            </Typography>

            {!records.length ? (
                <Typography
                    sx={{
                        fontStyle: "italic",
                        color: "#111",
                        fontFamily: "Inter, Roboto, Arial, sans-serif",
                    }}
                >
                    No PTM data recorded.
                </Typography>
            ) : (
                <TableContainer sx={tableCellSx}>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                                <TableCell sx={{ ...headerCellSx, width: "70px" }}>
                                    S.No
                                </TableCell>
                                <TableCell sx={headerCellSx}>PTM Date</TableCell>
                                <TableCell sx={headerCellSx}>Remarks</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {records.map((row, index) => (
                                <TableRow
                                    key={row?.Id || `${row.PTMDate}-${index}`}
                                    sx={{
                                        backgroundColor:
                                            index % 2 === 0 ? "#fff" : "#fafafa",
                                    }}
                                >
                                    <TableCell align="center">
                                        {index + 1}
                                    </TableCell>
                                    <TableCell align="center">
                                        {formatPtmDate(row.PTMDate)}
                                    </TableCell>
                                    <TableCell>
                                        {row.Remarks || "-"}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Box>
    );
}
