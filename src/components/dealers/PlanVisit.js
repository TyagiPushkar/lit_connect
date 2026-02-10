import React, { useEffect, useState } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Paper,
    TextField,
    Button,
    Box,
    CircularProgress,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    IconButton,
    Typography
} from '@mui/material';
import { Visibility, RotateLeft, RotateRight } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

function PlanVisit() {
    const [visits, setVisits] = useState([]);
    const { user } = useAuth();
    const navigate = useNavigate()
    const [mapCenter, setMapCenter] = useState({ lat: 20.5937, lng: 78.9629 });
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [markers, setMarkers] = useState([]);
   
    const [employees, setEmployees] = useState([]);
    const [selectedEmpId, setSelectedEmpId] = useState(user.role === 'HR' ? '' : user.emp_id);
    const [loading, setLoading] = useState(false);
    const [address, setAddress] = useState('');
        const [noData, setNoData] = useState(false);
const [expandedRemark, setExpandedRemark] = useState(null);
const handleReadMore = (visitId) => {
    setExpandedRemark(prev => (prev === visitId ? null : visitId)); // Toggle the expanded remark
};

    // Popup states for image
    const [openDialog, setOpenDialog] = useState(false);
    const [imageData, setImageData] = useState('');
    const [rotation, setRotation] = useState(0);

    useEffect(() => {
        if (user.role === 'HR') {
            const fetchEmployees = async () => {
                try {
                    const response = await axios.get(`https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`);
                    if (response.data.success) {
                        setEmployees(response.data.data);
                    } else {
                        console.log('Failed to fetch employee list');
                    }
                } catch (error) {
                    console.log('Error fetching employee list:', error.message);
                }
            };
            fetchEmployees();
        }
    }, [user.role]);
useEffect(() => {
    
    if (markers.length > 0) {
        const avgLat = markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length;
        const avgLng = markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length;
        setMapCenter({ lat: avgLat, lng: avgLng });
    }
}, [markers]);

   const fetchVisits = async () => {
    setLoading(true);
    setNoData(false);
    try {
        const formattedDate = selectedDate.toISOString().substr(0, 10);
        const url = `https://namami-infotech.com/LIT/src/visit/plan.php?role=HR&empId=${selectedEmpId}&date=${formattedDate}`;

        const response = await axios.get(url);
        if (response.data.success && response.data.data.length > 0) {
            const visitData = response.data.data;

            // Process visit data into markers
            const markerData = visitData.map((visit, index) => {
                const [lat, lng] = visit.LatLong.split(',').map(Number);
                return {
                    lat,
                    lng,
                    label: `${index + 1}`,
                    companyName: visit.DealerName,
                    dealerName: visit.DealerName,
                    visitDate: visit.Plan_Visit,
                    remarks: visit.Remarks,
                    visitId: visit.VisitID,
                };
            });

            setVisits(visitData);
            setMarkers(markerData);
        } else {
            setVisits([]);
            setNoData(true);
        }
    } catch (err) {
        console.error('Error fetching visits:', err);
        setNoData(true);
    }
    setLoading(false);
};


    const handleDateChange = (event) => {
        setSelectedDate(new Date(event.target.value));
    };
    const planVisit = (event) => {
        navigate("/visit");
    };

   
const handleViewImage = async (visitId) => {
        try {
            const response = await axios.get(`https://namami-infotech.com/LIT/src/visit/view_one_visit.php?visit_id=${visitId}`);
            const base64Data = response.data.data[0].Attachment;
            setImageData(`data:image/jpeg;base64,${base64Data}`);
            setRotation(0);
            setOpenDialog(true);

            // Fetch and set address
            const address = await fetchAddressFromLatLong(response.data.data[0].VisitLatLong);
            setAddress(address);
        } catch (error) {
            console.error('Error fetching image:', error);
        }
    };
    const handleRotateLeft = () => {
        setRotation((prevRotation) => prevRotation - 90);
    };

    const handleRotateRight = () => {
        setRotation((prevRotation) => prevRotation + 90);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
    };

     const fetchAddressFromLatLong = async (latLong) => {
        const [lat, lng] = latLong.split(',').map(Number);
        const nominatimUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`;

        try {
            const response = await axios.get(nominatimUrl);
            if (response.data && response.data.display_name) {
                return response.data.display_name;
            } else {
                return "Address not found";
            }
        } catch (error) {
            console.error("Error fetching address from Nominatim:", error);
            return "Address not found";
        }
    };

    return (
        <>
            <div style={{display:'flex', justifyContent:"space-between"}}>
            <div style={{display:'flex', gap:'10px'}}>
            {/* {user.role === 'HR' && (
                <FormControl variant="outlined" sx={{ mb: 2, width: "300px" }}>
                    <InputLabel id="select-empId-label">Select Employee</InputLabel>
                    <Select
                        labelId="select-empId-label"
                        value={selectedEmpId}
                        onChange={(e) => setSelectedEmpId(e.target.value)}
                        label="Select Employee"
                    >
                        {employees.map(employee => (
                            <MenuItem key={employee.EmpId} value={employee.EmpId}>
                                {employee.Name} ({employee.EmpId})
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )} */}
            
            <TextField
                type="date"
                value={selectedDate.toISOString().substr(0, 10)}
                onChange={handleDateChange}
                        variant="outlined"
                        sx={{ mb: 2 }}
            />
            <Button
                variant="contained"
                style={{ marginBottom: 20, backgroundColor: "#CC7A00", color: "white" }}
                onClick={fetchVisits}
            >
                Go
            </Button>

                </div>
                <div>
                    <Button
                variant="contained"
                style={{ marginBottom: 20, backgroundColor: "#CC7A00", color: "white" }}
                onClick={planVisit}
            >
                All Visits
            </Button>
                </div>
                </div>
          
            {/* <Button
                variant="contained"
                style={{ backgroundColor: "#CC7A00", color: "white", marginTop: 10 }}
                onClick={() => setShowMap(!showMap)}
            >
                {showMap ? 'Hide Map' : 'Show Map'}
            </Button>
            <br /> <br />

            {showMap && (
                <VisitMap
                    markers={markers}
                    mapCenter={mapCenter}
                    directions={directions}
                    distances={distances}
                />
            )} */}

           {loading ? (
    <Box display="flex" justifyContent="center" alignItems="center" height="100px">
        <CircularProgress />
    </Box>
) : noData ? (
    <Box display="flex" justifyContent="center" alignItems="center" height="100px">
        <Typography>No visits found for the selected date.</Typography>
    </Box>
) : (
    <TableContainer component={Paper}>
    <Table>
        <TableHead style={{ backgroundColor: "#CC7A00" }}>
            <TableRow>
                <TableCell style={{ color: "white" }}>Dealer Name</TableCell>
                <TableCell style={{ color: "white" }}>Plan Visit Date</TableCell>
                                        <TableCell style={{ color: "white" }}>Remarks</TableCell>
                                        <TableCell style={{ color: "white" }}>Visit By</TableCell>
                <TableCell style={{ color: "white" }}>Actions</TableCell>
            </TableRow>
        </TableHead>
        <TableBody>
            {visits
                .filter(visit => visit.Plan_Visit === selectedDate.toISOString().substr(0, 10))
                .sort((a, b) => new Date(b.Plan_Visit) - new Date(a.Plan_Visit))
                .map((visit, index) => (
                    <TableRow key={`${visit.DealerID}-${index}`}>
                        <TableCell>{visit.DealerName}</TableCell>
                        <TableCell>{visit.Plan_Visit}</TableCell>
                        <TableCell>
                            <div style={{ maxHeight: "40px", overflow: "hidden", textOverflow: "ellipsis" }}>
        {expandedRemark === visit.VisitID ? visit.Remarks : visit.Remarks.slice(0, 100)}
    </div>
    {visit.Remarks.length > 100 && (
        <span 
            style={{ color: "blue", cursor: "pointer", fontSize: "14px" }} 
            onClick={() => handleReadMore(visit.VisitID)}>
            {expandedRemark === visit.VisitID ? "Read Less" : "Read More"}
        </span>
    )}
                        </TableCell>
                        <TableCell>{visit.EmpId}</TableCell>
                        <TableCell>
                            <IconButton onClick={() => handleViewImage(visit.VisitID)}>
                                <Visibility />
                            </IconButton>
                        </TableCell>
                    </TableRow>
                ))}
        </TableBody>
    </Table>
</TableContainer>

)}

            {/* Image View Popup */}
          <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
                <DialogTitle>View Attachment</DialogTitle>
                <DialogContent>
                     {address && (
                        <>
                         <Typography variant="body2" color="textSecondary" style={{ marginTop: '10px', fontWeight:'700' }}>
                            Address: {address}
                            </Typography>
                             <Typography variant="body2" color="textSecondary" style={{ marginTop: '10px' }}>
                            Time: {address}
                        </Typography>
                        </>
                       
                    )}
                    {imageData ? (
                        <img
                            src={imageData}
                            alt="Visit Attachment"
                            style={{
                                width: '100%',
                                height: 'auto',
                                transform: `rotate(${rotation}deg)`,
                            }}
                        />
                    ) : (
                        <Typography>No attachment available.</Typography>
                    )}
                   
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleRotateLeft} startIcon={<RotateLeft />}>
                        Rotate Left
                    </Button>
                    <Button onClick={handleRotateRight} startIcon={<RotateRight />}>
                        Rotate Right
                    </Button>
                    <Button onClick={handleCloseDialog} color="secondary">
                        Close
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}

export default PlanVisit;
