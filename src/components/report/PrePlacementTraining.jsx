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

    return json?.success && Array.isArray(json?.data)
        ? json.data
        : [];
};

const QA_MAX = 20;
const LR_MAX = 15;
const ENG_MAX = 15;
const TECH_MAX = 10;
const WRITTEN_BASE_MAX = QA_MAX + LR_MAX + ENG_MAX;
const WRITTEN_MAX_WITH_TECH = WRITTEN_BASE_MAX + TECH_MAX;

const PI_FIELDS = [
    { key: "Commun", label: "Commun. (5)" },
    { key: "BodyLanguage", label: "Body Language (5)" },
    { key: "ClarityOfThoughts", label: "Clarity of Thought (5)" },
    { key: "PresentationSkill", label: "Presentation Skill (5)" },
    { key: "Confidence", label: "Confidence (5)" },
    { key: "TechSkill", label: "Tech Skill (5)" },
    { key: "GD", label: "GD (10)" },
];

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

const sectionTitleSx = {
    fontFamily: '"Georgia", serif',
    fontWeight: "bold",
    fontSize: "20px",
    color: "#111",
    mb: 1,
    textTransform: "uppercase",
};

const hasValue = (value) =>
    value !== null &&
    value !== undefined &&
    String(value).trim() !== "";

const isAbsent = (value) =>
    hasValue(value) && String(value).trim().toUpperCase() === "AB";

const formatNumber = (value) => {
    if (!hasValue(value)) {
        return "-";
    }

    if (isAbsent(value)) {
        return "AB";
    }

    const number = Number(value);

    if (Number.isNaN(number)) {
        return value;
    }

    return Number.isInteger(number)
        ? number
        : Number(number.toFixed(2));
};

const getNumeric = (value) => {
    if (!hasValue(value) || isAbsent(value)) return null;
    const number = Number(value);
    return Number.isNaN(number) ? null : number;
};

const getWrittenRow = (row) => {
    const qa = getNumeric(row?.QA);
    const lr = getNumeric(row?.LR);
    const eng = getNumeric(row?.ENG);
    const tech = getNumeric(row?.Tech);
    const includeTechMax = hasValue(row?.Tech);
    const values = [qa, lr, eng, tech].filter((value) => value !== null);
    const obtained = values.reduce((sum, value) => sum + value, 0);
    const max = includeTechMax ? WRITTEN_MAX_WITH_TECH : WRITTEN_BASE_MAX;
    const percent = values.length > 0 ? (obtained / max) * 100 : null;

    return {
        qa: row?.QA,
        lr: row?.LR,
        eng: row?.ENG,
        tech: row?.Tech,
        max,
        obtained: values.length ? obtained : null,
        percent,
    };
};

const getColumnAverage = (records, key) => {
    const values = records
        .map((row) => getNumeric(row?.[key]))
        .filter((value) => value !== null);

    if (!values.length) return null;

    return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export default function PrePlacementTraining({
    studentId,
    course,
    semester,
}) {
    const studCode = studentId;

    const { data: pptData = [], isLoading } = useSWR(
        studCode && course && semester
            ? `https://namami-infotech.com/LIT/src/report/ppt_exam_report.php?StudId=${encodeURIComponent(
                studCode
            )}&Course=${encodeURIComponent(
                course
            )}&Sem=${encodeURIComponent(semester)}`
            : null,
        fetchJSON
    );

    const records = [...(pptData || [])].sort(
        (a, b) => Number(a?.Id || 0) - Number(b?.Id || 0)
    );

    const writtenRecords = records.filter((row) => {
        const cat = (row?.Category || "").trim().toUpperCase();
        if (cat && cat !== "WRITTEN") return false;
        return (
            hasValue(row?.QA) ||
            hasValue(row?.LR) ||
            hasValue(row?.ENG) ||
            hasValue(row?.Tech)
        );
    });

    const piRecords = records.filter((row) => {
        const cat = (row?.Category || "").trim().toUpperCase();
        if (cat === "WRITTEN") return false;
        return PI_FIELDS.some((field) => hasValue(row?.[field.key]));
    });

    if (isLoading) {
        return null;
    }

    const emptyMessageSx = {
        fontStyle: "italic",
        color: "#111",
        fontFamily: "Inter, Roboto, Arial, sans-serif",
    };

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
                PRE PLACEMENT TRAINING
            </Typography>

            {writtenRecords.length === 0 && piRecords.length === 0 ? (
                <Typography sx={emptyMessageSx}>
                    No Pre Placement Training data recorded.
                </Typography>
            ) : null}

            {writtenRecords.length > 0 ? (
                <Box className="pdf-block" sx={{ width: "100%", mb: 3 }}>
                    <Typography sx={sectionTitleSx}>Written Test</Typography>

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
                                    <TableCell sx={{ ...headerCellSx, width: "70px" }}>
                                        Date
                                    </TableCell>
                                    <TableCell sx={headerCellSx}>QA(20)</TableCell>
                                    <TableCell sx={headerCellSx}>LR(15)</TableCell>
                                    <TableCell sx={headerCellSx}>ENG(15)</TableCell>
                                    <TableCell sx={headerCellSx}>Tech(10)</TableCell>
                                    <TableCell sx={headerCellSx}>Max Marks</TableCell>
                                    <TableCell sx={headerCellSx}>Obt. Marks</TableCell>
                                    <TableCell sx={headerCellSx}>%</TableCell>
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {writtenRecords.map((row, index) => {
                                    const written = getWrittenRow(row);

                                    return (
                                        <TableRow
                                            key={row?.Id || index}
                                            sx={{
                                                backgroundColor:
                                                    index % 2 === 0
                                                        ? "#fff"
                                                        : "#fafafa",
                                            }}
                                        >
                                            <TableCell align="center">
                                                {row?.DateOfExam
                                                    ? new Date(row.DateOfExam).toLocaleDateString("en-GB", {
                                                        day: "2-digit",
                                                        month: "2-digit",
                                                        year: "2-digit",
                                                    })
                                                    : "-"}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(row?.QA)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(row?.LR)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(row?.ENG)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(row?.Tech)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(written.max)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {formatNumber(written.obtained)}
                                            </TableCell>
                                            <TableCell align="center">
                                                {written.percent !== null
                                                    ? `${written.percent.toFixed(1)}%`
                                                    : "-"}
                                            </TableCell>
                                        </TableRow>
                                    );
                                })}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ) : null}

            {piRecords.length > 0 ? (
                <Box className="pdf-block" sx={{ width: "100%", mb: 3 }}>
                    <Typography sx={sectionTitleSx}>PI / TECH</Typography>

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
                                    <TableCell sx={{ ...headerCellSx, width: "70px" }}>
                                        Date
                                    </TableCell>
                                    {PI_FIELDS.map((field) => (
                                        <TableCell key={field.key} sx={headerCellSx}>
                                            {field.label}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableHead>

                            <TableBody>
                                {piRecords.map((row, index) => (
                                    <TableRow
                                        key={row?.Id || index}
                                        sx={{
                                            backgroundColor:
                                                index % 2 === 0
                                                    ? "#fff"
                                                    : "#fafafa",
                                        }}
                                    >
                                        <TableCell align="center">
                                            {row?.DateOfExam
                                                ? new Date(row.DateOfExam).toLocaleDateString("en-GB", {
                                                    day: "2-digit",
                                                    month: "2-digit",
                                                    year: "2-digit",
                                                })
                                                : "-"}
                                        </TableCell>
                                        {PI_FIELDS.map((field) => (
                                            <TableCell
                                                key={field.key}
                                                align="center"
                                            >
                                                {formatNumber(row?.[field.key])}
                                            </TableCell>
                                        ))}
                                    </TableRow>
                                ))}
                                <TableRow sx={{ backgroundColor: "#f0f0f0" }}>
                                    <TableCell
                                        align="center"
                                        sx={{ fontWeight: "bold" }}
                                    >
                                        Total Avg
                                    </TableCell>
                                    {PI_FIELDS.map((field) => (
                                        <TableCell
                                            key={`${field.key}-avg`}
                                            align="center"
                                            sx={{ fontWeight: "bold" }}
                                        >
                                            {formatNumber(
                                                getColumnAverage(
                                                    piRecords,
                                                    field.key
                                                )
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Box>
            ) : null}
        </Box>
    );
}
