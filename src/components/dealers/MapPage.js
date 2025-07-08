// import React, { useEffect, useState } from "react";
// import {
//   TextField,
//   Button,
//   FormControl,
//   Autocomplete,
//   Box,
//   Typography,
//   List,
//   ListItem,
//   ListItemText,
// } from "@mui/material";
// import axios from "axios";
// import { useAuth } from "../auth/AuthContext";
// import VisitMap from "./VisitMap";

// function MapPage() {
//   const [visits, setVisits] = useState([]);
//   const { user } = useAuth();
//   const [mapCenter, setMapCenter] = useState({ lat: "", lng: "" });
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [markers, setMarkers] = useState([]);
//   const [directions, setDirections] = useState(null);
//   const [distances, setDistances] = useState([]); 
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmpId, setSelectedEmpId] = useState(
//     user.role === "HR" ? "" : user.emp_id
//   );
//   const [totalDistance, setTotalDistance] = useState(0); // Total distance state

//   useEffect(() => {
//     if (user.role === "HR") {
//       const fetchEmployees = async () => {
//         try {
//           const response = await axios.get(
//             `https://namami-infotech.com/LIT/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`
//           );
//           if (response.data.success) {
//             setEmployees(response.data.data);
//           } else {
//             console.log("Failed to fetch employee list");
//           }
//         } catch (error) {
//           console.log("Error fetching employee list:", error.message);
//         }
//       };
//       fetchEmployees();
//     }
//   }, [user.role]);

//   useEffect(() => {
//     if (markers.length > 0) {
//       const avgLat =
//         markers.reduce((sum, marker) => sum + marker.lat, 0) / markers.length;
//       const avgLng =
//         markers.reduce((sum, marker) => sum + marker.lng, 0) / markers.length;
//       setMapCenter({ lat: avgLat, lng: avgLng });

//       // Calculate total distance covered
//       let totalKm = 0;
//       for (let i = 1; i < markers.length; i++) {
//         const prev = markers[i - 1];
//         const curr = markers[i];
//         totalKm += calculateDistance(prev.lat, prev.lng, curr.lat, curr.lng);
//       }
//       setTotalDistance(totalKm.toFixed(2)); // Update total distance
//     }
//   }, [markers]);

//   const fetchVisits = async () => {
//     try {
//       const formattedDate = selectedDate.toISOString().substr(0, 10);
//       const url = `https://namami-infotech.com/LIT/src/visit/view_visit.php?empId=${selectedEmpId}&date=${formattedDate}`;
//       const response = await axios.get(url);
//       if (response.data.success && response.data.data.length > 0) {
//         const visitData = response.data.data;
//         console.log("Visit Data:", visitData);
//         const markerData = visitData.map((visit, index) => {
//           const [lat, lng] = visit.VisitLatLong.split(",").map(Number);
//           return {
//             lat,
//             lng,
//             label: `${index + 1}`,
//             companyName: visit.CompanyName,
//             dealerName: visit.DealerName,
//             visitTime: new Date(visit.VisitTime).toLocaleString(),
//           };
//         });
//         setVisits(visitData);
//         setMarkers(markerData);
//       } else {
//         setVisits([]);
//         setMarkers([]);
//         setTotalDistance(0);
//       }
//     } catch (err) {
//       console.error("Error fetching visits:", err);
//     }
//   };

//   const handleDateChange = (event) => {
//     setSelectedDate(new Date(event.target.value));
//   };

//   // Function to calculate distance between two lat/lng points
//   function calculateDistance(lat1, lon1, lat2, lon2) {
//     const R = 6371; // Radius of Earth in km
//     const dLat = ((lat2 - lat1) * Math.PI) / 180;
//     const dLon = ((lon2 - lon1) * Math.PI) / 180;
//     const a =
//       Math.sin(dLat / 2) * Math.sin(dLat / 2) +
//       Math.cos((lat1 * Math.PI) / 180) *
//         Math.cos((lat2 * Math.PI) / 180) *
//         Math.sin(dLon / 2) *
//         Math.sin(dLon / 2);
//     const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
//     return R * c; // Distance in km
//   }

//   return (
//     <Box display="flex">
//       {/* Left Section - Map and Filters */}
//       <Box flex={4} >
//         <Box display="flex" gap="10px" mb={2}>
//           {user.role === "HR" && (
//             <FormControl variant="outlined">
//               <Autocomplete
//                 options={employees}
//                 getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
//                 value={
//                   employees.find((emp) => emp.EmpId === selectedEmpId) || null
//                 }
//                 onChange={(event, newValue) => {
//                   setSelectedEmpId(newValue ? newValue.EmpId : "");
//                 }}
//                 renderInput={(params) => (
//                   <TextField {...params} label="Select Employee" variant="outlined" />
//                 )}
//                 sx={{ width: "250px" }}
//               />
//             </FormControl>
//           )}

//           <TextField
//             type="date"
//             value={selectedDate.toISOString().substr(0, 10)}
//             onChange={handleDateChange}
//             variant="outlined"
//           />
//           <Button
//             variant="contained"
//             style={{ backgroundColor: "#CC7A00", color: "white" }}
//             onClick={fetchVisits}
//           >
//             Go
//           </Button>
//         </Box>

//         <VisitMap markers={markers} mapCenter={mapCenter} directions={directions} distances={distances} />
//       </Box>

//       {/* Right Panel - Visit Summary */}
//       <Box flex={4}  >
//         <Typography variant="h6" gutterBottom>
//           Summary
//         </Typography>

//         <Typography variant="body1">
//           <strong>Total Visits:</strong> {visits.length}
//         </Typography>
//         <Typography variant="body1">
//           <strong>Total Distance Covered:</strong> {totalDistance} km
//         </Typography>

//         <Typography variant="h6" sx={{ mt: 2 }}>
//           Visit Details
//         </Typography>
//         <List>
//           {visits.map((visit, index) => (
//             <ListItem key={index} divider>
//               <ListItemText
//                 primary={`${index + 1}. ${visit.CompanyName} (${visit.DealerName})`}
//                 secondary={`Time: ${new Date(visit.VisitTime).toLocaleString()}`}
//               />
//             </ListItem>
//           ))}
//         </List>
//       </Box>
//     </Box>
//   );
// }

// export default MapPage;
