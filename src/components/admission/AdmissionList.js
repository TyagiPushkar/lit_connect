import React, { useEffect, useState } from 'react';
import {
    Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
    Paper, Typography, CircularProgress, TablePagination, TextField, Box
} from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import VisibilityIcon from '@mui/icons-material/Visibility';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';

function AdmissionList() {
    const [tempRecords, setTempRecords] = useState([]);
    const [filteredRecords, setFilteredRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    // Pagination states
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(15);

    useEffect(() => {
        const fetchTempData = async () => {
            try {
                const response = await axios.get('https://namami-infotech.com/LIT/src/students/get_temp.php');
                if (response.data.success) {
                    setTempRecords(response.data.data);
                    setFilteredRecords(response.data.data);
                } else {
                    setError('No data found.');
                }
            } catch (err) {
                setError('Failed to fetch data.');
            } finally {
                setLoading(false);
            }
        };
        fetchTempData();
    }, []);

    const handleSearch = (e) => {
        const value = e.target.value.toLowerCase();
        setSearchTerm(value);
        const filtered = tempRecords.filter((record) => {
            const nameEntry = record.chkData?.find((chk) => chk.ChkId === 3);
            const numberEntry = record.chkData?.find((chk) => chk.ChkId === 7);
            const name = nameEntry?.Value?.toLowerCase() || '';
            const tempId = record.TempId?.toLowerCase() || '';
            const number = numberEntry?.Value?.toLowerCase() || '';
            return tempId.includes(value) || name.includes(value) || number.includes(value);
        });
        setFilteredRecords(filtered);
        setPage(0);
    };

    const handleChangePage = (event, newPage) => setPage(newPage);

    const handleChangeRowsPerPage = (event) => {
        setRowsPerPage(parseInt(event.target.value, 10));
        setPage(0);
    };

    if (loading) return <CircularProgress />;
const formatDate = (datetime) => {
    const dateObj = new Date(datetime);
    const day = String(dateObj.getDate()).padStart(2, '0');
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const year = dateObj.getFullYear();
    return `${day}/${month}/${year}`;
    };
    const exportToExcel = () => {
    // Convert your data into a simple array of objects
    const excelData = filteredRecords.map((record) => {
        const nameEntry = record.chkData?.find((chk) => chk.ChkId === 3);
        const courseEntry = record.chkData?.find((chk) => chk.ChkId === 5);
        const numberEntry = record.chkData?.find((chk) => chk.ChkId === 7);

        return {
            "Admission ID": record.TempId,
            "Name": nameEntry?.Value || "-",
            "Course": courseEntry?.Value || "-",
            "Contact No": numberEntry?.Value || "-",
            "Date": formatDate(record.Datetime)
        };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Admissions");

    XLSX.writeFile(workbook, "Admissions_List.xlsx");
};

    return (
        <div>
           <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
    <Typography variant="h5">Admissions</Typography>

    <Box display="flex" gap={2}>
        <TextField
            label="Search by Admission ID or Name"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={handleSearch}
            sx={{ width: 300 }}
        />

        <Button variant="contained" color="success" onClick={exportToExcel}>
            Export Excel
        </Button>
    </Box>
</Box>


            <TableContainer component={Paper} sx={{ mb: 2 }}>
                <Table size='small'>
                    <TableHead sx={{ backgroundColor: "#CC7A00" }}>
                        <TableRow>
                            <TableCell sx={{ color: 'white' }}>Admission ID</TableCell>
                            <TableCell sx={{ color: 'white' }}>Name</TableCell>
                            <TableCell sx={{ color: 'white' }}>Course</TableCell>
                            <TableCell sx={{ color: 'white' }}>Contact no.</TableCell>
                            <TableCell sx={{ color: 'white' }}>Date</TableCell>
                            <TableCell sx={{ color: 'white' }}>Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {filteredRecords
                            .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                            .map((record) => {
                                const nameEntry = record.chkData?.find((chk) => chk.ChkId === 3);
                                const courseEntry = record.chkData?.find((chk) => chk.ChkId === 5);
                                const numberEntry = record.chkData?.find((chk) => chk.ChkId === 7);

                                return (
                                    <TableRow key={record.ID}>
                                        <TableCell>{record.TempId}</TableCell>
                                        <TableCell>{nameEntry?.Value || '-'}</TableCell>
                                        <TableCell>{courseEntry?.Value || '-'}</TableCell>
                                        <TableCell>{numberEntry?.Value || '-'}</TableCell>
                                        <TableCell>{formatDate(record.Datetime)}</TableCell>
                                        <TableCell>
                                            <VisibilityIcon
                                                color="primary"
                                                sx={{ cursor: 'pointer' }}
                                                onClick={() => navigate(`/admissions/view/${record.ActivityId}`)}
                                            />
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                    </TableBody>
                </Table>
            </TableContainer>

            <TablePagination
                component="div"
                count={filteredRecords.length}
                page={page}
                rowsPerPage={rowsPerPage}
                onPageChange={handleChangePage}
                onRowsPerPageChange={handleChangeRowsPerPage}
                rowsPerPageOptions={[5, 10, 15]}
            />
        </div>
    );
}

export default AdmissionList;
