import React, { useState } from 'react';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import {
    Box,
    useMediaQuery,
    FormControl,
    InputLabel,
    MenuItem,
    Select,
    Typography
} from '@mui/material';
import InternalExam from '../components/report/InternalExam';
import AssignmentReport from '../components/report/AssignmentReport';

function StudentReport() {
    const isMobile = useMediaQuery('(max-width:600px)');
    const drawerWidth = isMobile ? 0 : 100;
    const [category, setCategory] = useState('Internal Exam');

    const renderComponent = () => {
        switch (category) {
            case 'Internal Exam':
                return <InternalExam />;
            case 'CBT':
                return <Typography mt={2}>CBT Report Coming Soon</Typography>;
            case 'Class Test':
                return <Typography mt={2}>Class Test Report Coming Soon</Typography>;
            case 'Assignment':
                return <AssignmentReport />;
            default:
                return null;
        }
    };

    return (
        <Box sx={{ display: 'flex', height: '100vh' }}>
            {/* Sidebar */}
            <Box sx={{ width: drawerWidth, flexShrink: 0 }}>
                <Sidebar />
            </Box>

            {/* Main Content */}
            <Box component="main" sx={{ flexGrow: 1 }}>
                <Navbar />

                <Box sx={{ p: 2 }}>
                    <Typography variant="h5" align="center" color="black" mb={2}>
                        {category} Report
                    </Typography>

                    {/* Dropdown */}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                        <FormControl sx={{ minWidth: 300 }}>
                            <InputLabel id="category-label">Category</InputLabel>
                            <Select
                                labelId="category-label"
                                value={category}
                                label="Category"
                                onChange={(e) => setCategory(e.target.value)}
                            >
                                <MenuItem value="Internal Exam">Internal Exam</MenuItem>
                                <MenuItem value="CBT">CBT</MenuItem>
                                <MenuItem value="Class Test">Class Test</MenuItem>
                                <MenuItem value="Assignment">Assignment</MenuItem>
                            </Select>
                        </FormControl>
                    </Box>

                    {/* Report Component Rendered Here */}
                    <Box>
                        {renderComponent()}
                    </Box>
                </Box>
            </Box>
        </Box>
    );
}

export default StudentReport;
