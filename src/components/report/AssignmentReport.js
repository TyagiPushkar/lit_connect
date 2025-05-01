import React, { useState } from 'react';
import {
    Box,
    Button,
    MenuItem,
    Select,
    InputLabel,
    FormControl,
    Typography
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DownloadIcon from '@mui/icons-material/Download';
import * as XLSX from 'xlsx';
import Swal from 'sweetalert2';
import ListAssignmentReport from './ListAssignmentReport';

function AssignmentReport() {
    const [course, setCourse] = useState('');
    const [sem, setSem] = useState('');
    const [month, setMonth] = useState('');
    const [file, setFile] = useState(null);

    const handleDownloadSample = () => {
        const sampleData = [
            ['StudentId', 'NoOfClasses', 'PresentClass'],
            ['1001', '25', '22'],
            ['1002', '25', '23']
        ];
        const worksheet = XLSX.utils.aoa_to_sheet(sampleData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Sample');
        XLSX.writeFile(workbook, 'AssignmentReportSample.xlsx');
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    const handleUpload = async () => {
        if (!course || !sem || !month || !file) {
            Swal.fire({
                icon: 'warning',
                title: 'All fields are required!',
                showConfirmButton: true,
            });
            return;
        }

        const formData = new FormData();
        formData.append('Course', course);
        formData.append('Sem', sem);
        formData.append('Month', month);
        formData.append('file', file);

        try {
            const res = await fetch('https://namami-infotech.com/LIT/src/report/add_assignment_report.php', {
                method: 'POST',
                body: formData,
            });
            const result = await res.json();
            Swal.fire({
                icon: result.success ? 'success' : 'error',
                title: result.message || 'Upload failed',
                showConfirmButton: true,
            });

            if (result.success) {
                setCourse('');
                setSem('');
                setMonth('');
                setFile(null);
            }
        } catch (err) {
            Swal.fire({
                icon: 'error',
                title: 'Network or server error.',
                showConfirmButton: true,
            });
        }
    };

    return (
        <Box sx={{ p: 1 }}>
            <Box display="flex" gap={2} mb={2} justifyContent="space-between" alignItems="center">
                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Course</InputLabel>
                    <Select
                        value={course}
                        label="Course"
                        onChange={(e) => setCourse(e.target.value)}
                    >
                        <MenuItem value="BCA">BCA</MenuItem>
                        <MenuItem value="MCA">MCA</MenuItem>
                        <MenuItem value="BSc">BSc</MenuItem>
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 150 }}>
                    <InputLabel>Semester</InputLabel>
                    <Select
                        value={sem}
                        label="Semester"
                        onChange={(e) => setSem(e.target.value)}
                    >
                        {[1, 2, 3, 4].map((num) => (
                            <MenuItem key={num} value={num}>{num}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>Month</InputLabel>
                    <Select
                        value={month}
                        label="Month"
                        onChange={(e) => setMonth(e.target.value)}
                    >
                        {[
                            'January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December'
                        ].map((m) => (
                            <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                    </Select>
                </FormControl>

                <Button
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                    onClick={handleDownloadSample}
                >
                    Download Excel
                </Button>
            </Box>

            <Box display="flex" gap={2} mb={2} justifyContent="space-between" alignItems="center">
                <Button
                    variant="contained"
                    component="label"
                    startIcon={<CloudUploadIcon />}
                    style={{ borderRadius: 1, backgroundColor:"#CC7A00"}}
                >
                    Upload Excel File
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        hidden
                        onChange={handleFileChange}
                    />
                </Button>

                <Button
                    variant="contained"
                    onClick={handleUpload}
                    disabled={!course || !sem || !month || !file}
                >
                    Submit
                </Button>
            </Box>

            {file && <Typography variant="body2">Selected File: {file.name}</Typography>}
            <ListAssignmentReport/>
        </Box>
    );
}

export default AssignmentReport;
