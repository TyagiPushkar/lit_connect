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
  const res = await fetch(url, {
    cache: "no-store",
  });

  if (!res.ok) {
    throw new Error(`Failed to fetch ${url}`);
  }

  const json = await res.json();

  return json?.success && json?.data ? json.data : [];
};

const getSkillName = (row) =>
  String(
    row?.Subject || row?.Skill || row?.SkillName || row?.Name || "",
  ).trim();

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

export default function SkillsGrade({ studentId, course, semester }) {
  const { data: skills = [], isLoading } = useSWR(
    studentId && course && semester
      ? `https://namami-infotech.com/LIT/src/report/skill_exam_report.php?StudId=${encodeURIComponent(
          studentId,
        )}&Course=${encodeURIComponent(
          course,
        )}&Sem=${encodeURIComponent(semester)}`
      : null,
    fetchJSON,
  );

  const skillColumns = [];
  const gradesBySkill = {};

  [...(skills || [])]
    .sort((a, b) => Number(a?.Id || 0) - Number(b?.Id || 0))
    .forEach((row) => {
      const name = getSkillName(row);
      if (!name) return;

      if (!gradesBySkill[name]) {
        gradesBySkill[name] = [];
        skillColumns.push(name);
      }

      gradesBySkill[name].push(row?.Grade || row?.grade || "-");
    });

  const maxRows = skillColumns.reduce(
    (max, name) => Math.max(max, gradesBySkill[name].length),
    0,
  );

  const gradeRows = Array.from({ length: maxRows }, (_, index) =>
    skillColumns.map((name) => gradesBySkill[name][index] || "-"),
  );

  if (isLoading) {
    return null;
  }

  return (
    <Box
      className="pdf-block"
      sx={{
        mt: 2,
        mb: 3,
      }}
    >
      <Typography
        variant="h6"
        sx={{
          backgroundColor: "#2c3e50",
          color: "white",
          padding: "8px 16px",
          fontWeight: "bold",
          display: "inline-block",
          marginBottom: "15px",
        }}
      >
        SKILLS (GRADE - A, B, C)
      </Typography>

      {!skillColumns.length ? (
        <Typography
          sx={{
            fontStyle: "italic",
            color: "#111",
            fontFamily: "Inter, Roboto, Arial, sans-serif",
          }}
        >
          No Skills grade recorded.
        </Typography>
      ) : (
        <TableContainer sx={tableCellSx}>
          <Table
            size="small"
            sx={{
              width: "100%",
              tableLayout: "fixed",
            }}
          >
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                <TableCell
                  sx={{
                    ...headerCellSx,
                    width: "70px",
                  }}
                >
                  S.No
                </TableCell>
                {skillColumns.map((name) => (
                  <TableCell key={name} sx={headerCellSx}>
                    {name}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {gradeRows.map((row, rowIndex) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    backgroundColor: rowIndex % 2 === 0 ? "#fff" : "#fafafa",
                  }}
                >
                  <TableCell align="center">{rowIndex + 1}</TableCell>
                  {row.map((grade, colIndex) => (
                    <TableCell
                      key={`${skillColumns[colIndex]}-${rowIndex}`}
                      align="center"
                      sx={{ fontWeight: "bold" }}
                    >
                      {grade}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}
