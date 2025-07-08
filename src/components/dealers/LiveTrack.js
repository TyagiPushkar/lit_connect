// import React, { useEffect, useRef, useState } from "react";
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   FormControl,
//   Autocomplete,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
// } from "@mui/material";
// import { CheckCircle, Cancel } from "@mui/icons-material";
// import axios from "axios";

// import "leaflet/dist/leaflet.css";
// import L from "leaflet";
// import {
//   GoogleMap,
//   LoadScript,
//   Polyline,
//   Marker,
// } from "@react-google-maps/api";
// import { useAuth } from "../auth/AuthContext";
// import { useMap } from "react-leaflet";

// const GOOGLE_MAPS_API_KEY = "AIzaSyBtEmyBwz_YotZK8Iabl_nQQldaAtN0jhM";
// const mapContainerStyle = { height: "500px", width: "100%" };
// const defaultCenter = { lat: 28.5, lng: 77.2 };

// function LiveTrack() {
//   const mapRef = useRef(null);
//   const { user } = useAuth();
//   const [employees, setEmployees] = useState([]);
//   const [selectedEmpId, setSelectedEmpId] = useState(
//     user.role === "HR" ? "" : user.emp_id,
//   );
//   const [selectedDate, setSelectedDate] = useState(new Date());
//   const [locations, setLocations] = useState([]);
//   const [locations1, setLocations1] = useState([]);
//   const [hoveredIndex, setHoveredIndex] = useState(null);
//   const [addresses, setAddresses] = useState({});
//   const [selectedMarker, setSelectedMarker] = useState(null);

//   useEffect(() => {
//     if (user.role === "HR") {
//       fetchEmployees();
//     }
//   }, [user.role]);

//   const fetchEmployees = async () => {
//     try {
//       const response = await axios.get(
//         `http://139.5.190.143/LIT/src/employee/list_employee.php?Tenent_Id=${user.tenent_id}`,
//       );
//       if (response.data.success) {
//         setEmployees(response.data.data);
//       } else {
//         console.log("Failed to fetch employee list");
//       }
//     } catch (error) {
//       console.error("Error fetching employee list:", error.message);
//     }
//   };

//   useEffect(() => {
//     if (locations.length > 0 && mapRef.current) {
//       mapRef.current.setView(
//         [
//           locations[locations.length - 1].lat,
//           locations[locations.length - 1].lng,
//         ],
//         15,
//       );
//     }
//   }, [locations]);

//   const fetchTrackingData = async (firstInTime, lastOutTime) => {
//   if (!selectedEmpId) {
//     alert("Please select an employee.");
//     return;
//   }

//   try {
//     const url = `http://139.5.190.143/LIT/src/track/get_location.php?emp_id=${selectedEmpId}`;
//     const response = await axios.get(url);

//     if (response.data.success && response.data.data.length > 0) {
//       const filteredData = response.data.data
//         .filter((loc) => {
//           const deviceTime = new Date(loc.device_time);
//           return deviceTime >= firstInTime && deviceTime <= lastOutTime;
//         })
//         .sort((a, b) => b.deviceTime - a.deviceTime) // Sort by latest time first
//         .map((loc, index, array) => ({
//           index: array.length - index, // Reverse numbering
//           lat: parseFloat(loc.latitude),
//           lng: parseFloat(loc.longitude),
//           time: new Date(loc.device_time).toLocaleTimeString([], {
//             hour: "2-digit",
//             minute: "2-digit",
//           }),
//           gpsStatus: loc.gps_status || "Unknown",
//           deviceTime: new Date(loc.device_time),
//         }));

//       setLocations(filteredData);
//       setLocations1(filteredData);
//     } else {
//       setLocations([]);
//       setLocations1([]);
//     }
//   } catch (error) {
//     console.error("Error fetching tracking data:", error);
//   }
// };

//   const createNumberedIcon = (number, isHovered, isLast, isFirst) => {
//     const color = isFirst
//       ? "green"
//       : isLast
//         ? "red"
//         : isHovered
//           ? "orange"
//           : "blue";
//     return new L.DivIcon({
//       className: "custom-marker",
//       html: `<div style="background-color: ${color};
//         color: white; border-radius: 50%; width: ${isHovered ? 30 : 25}px; height: ${isHovered ? 30 : 25}px;
//         display: flex; align-items: center; justify-content: center;
//         font-weight: bold; font-size: ${isHovered ? "14px" : "12px"};">
//         ${number}
//       </div>`,
//     });
//   };

//   const fetchAddressFromLatLong = async (lat, lng) => {
//     try {
//       const response = await axios.get(
//         `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
//       );
//       return response.data?.display_name || "Address not found";
//     } catch (error) {
//       console.error("Error fetching address:", error);
//       return "Address not found";
//     }
//   };
//   useEffect(() => {
//     const fetchAddresses = async () => {
//       const newAddresses = {};

//       try {
//         // Fetch all addresses in parallel
//         const addressPromises = locations1.map(async (loc) => {
//           const key = `${loc.lat},${loc.lng}`;
//           const address = await fetchAddressFromLatLong(loc.lat, loc.lng);
//           newAddresses[key] = address;
//         });

//         await Promise.all(addressPromises); // Wait for all requests to complete
//         setAddresses(newAddresses); // Update state once all addresses are fetched
//       } catch (error) {
//         console.error("Error fetching addresses:", error);
//       }
//     };

//     if (locations1.length > 0) {
//       fetchAddresses();
//     }
//   }, [locations1]); // Run whenever locations1 changes

//   const fetchAttendanceData = async () => {
//   try {
//     const url = `http://139.5.190.143/LIT/src/attendance/view_attendance.php?EmpId=${selectedEmpId}`;
//     const response = await axios.get(url);

//     if (response.data.success && response.data.data.length > 0) {
//       const attendance = response.data.data[0];
//       const selectedDateStr = selectedDate.toLocaleDateString("en-CA"); // "YYYY-MM-DD" format
//       const firstInTime = new Date(`${selectedDateStr} ${attendance.firstIn}`);
//       const lastOutTime = attendance.lastOut !== "N/A" ? new Date(`${selectedDateStr} ${attendance.lastOut}`) : new Date();

//       // Fetch tracking data after getting attendance details
//       fetchTrackingData(firstInTime, lastOutTime);
//     } else {
//       alert("No attendance data available.");
//       setLocations([]);
//       setLocations1([]);
//     }
//   } catch (error) {
//     console.error("Error fetching attendance data:", error);
//   }
// };
//   return (
//     <Box mb={2}>
//       {/* Filters: Employee Select & Date Picker */}
//       <Box display="flex" gap={2} mb={2}>
//         {user.role === "HR" && (
//           <FormControl variant="outlined">
//             <Autocomplete
//               options={employees}
//               getOptionLabel={(option) => `${option.Name} (${option.EmpId})`}
//               value={
//                 employees.find((emp) => emp.EmpId === selectedEmpId) || null
//               }
//               onChange={(event, newValue) =>
//                 setSelectedEmpId(newValue ? newValue.EmpId : "")
//               }
//               renderInput={(params) => (
//                 <TextField
//                   {...params}
//                   label="Select Employee"
//                   variant="outlined"
//                 />
//               )}
//               sx={{ width: "250px" }}
//             />
//           </FormControl>
//         )}

//         <TextField
//           type="date"
//           value={selectedDate.toISOString().substr(0, 10)}
//           onChange={(e) => setSelectedDate(new Date(e.target.value))}
//           variant="outlined"
//         />
//         <Button
//           variant="contained"
//           style={{ backgroundColor: "#CC7A00", color: "white" }}
//           onClick={fetchAttendanceData}
//         >
//           Go
//         </Button>
//       </Box>

//       {/* Layout: Map (Left) & GPS Data Table (Right) */}
//       <Box display="flex" gap={2}>
//         {/* Map Section */}
//         <Box flex={1}>
//           <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
//             <GoogleMap
//               mapContainerStyle={mapContainerStyle}
//               center={locations.length > 0 ? locations[0] : defaultCenter}
//               zoom={12}
//             >
//               {locations.map((loc, index) => (
//                 <Marker
//                   key={index}
//                   position={{ lat: loc.lat, lng: loc.lng }}
//                   label={{
//                     text: (locations.length - index).toString(),
//                     color: "white",
//                     fontWeight: "bold",
//                     fontSize: "12px",
//                   }}
//                   icon={{
//                     url:
//                       selectedMarker === loc.index
//                         ? "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png" // Highlighted Marker
//                         : index === 0
//                           ? "http://maps.google.com/mapfiles/ms/icons/green-dot.png"
//                           : index === locations.length - 1
//                             ? "http://maps.google.com/mapfiles/ms/icons/red-dot.png"
//                             : "http://maps.google.com/mapfiles/ms/icons/blue-dot.png",
//                   }}
//                 />
//               ))}

//               {locations.length > 1 && (
//                 <Polyline
//                   path={locations}
//                   options={{ strokeColor: "red", strokeWeight: 3 }}
//                 />
//               )}
//             </GoogleMap>
//           </LoadScript>
//         </Box>

//         {/* GPS Data Table */}
//         <Box flex={1}>
//           <Typography variant="h6" gutterBottom>
//             GPS Tracking Data
//           </Typography>
//           <TableContainer
//             component={Paper}
//             sx={{ maxHeight: 450, overflowY: "auto" }}
//           >
//             <Table stickyHeader>
//               <TableHead>
//                 <TableRow>
//                   <TableCell>
//                     <b>SR No.</b>
//                   </TableCell>
//                   <TableCell>
//                     <b>Time</b>
//                   </TableCell>
//                   <TableCell>
//                     <b>GPS Status</b>
//                   </TableCell>
//                   <TableCell>
//                     <b>Address</b>
//                   </TableCell>
//                 </TableRow>
//               </TableHead>
//               <TableBody>
//                 {locations1.length > 0 ? (
//                   locations1.map((loc, index) => (
//                     <TableRow key={index}>
//                       <TableCell
//                         onClick={() => setSelectedMarker(loc.index)}
//                         style={{
//                           cursor: "pointer",
//                           fontWeight:
//                             selectedMarker === loc.index ? "bold" : "normal",
//                           backgroundColor:
//                             selectedMarker === loc.index
//                               ? "#f0f0f0"
//                               : "transparent",
//                         }}
//                       >
//                         <b>{locations1.length - index}</b>{" "}
//                         {/* Show number here */}
//                       </TableCell>

//                       <TableCell>{loc.time}</TableCell>
//                       <TableCell>
//                         {loc.gpsStatus === "Enabled" ? (
//                           <CheckCircle color="success" />
//                         ) : (
//                           <Cancel color="error" />
//                         )}
//                       </TableCell>
//                       <TableCell>
//                         {/* {addresses[`${loc.lat},${loc.lng}`]} */}
//                         {!isNaN(Number(loc.lat)) ? (
//                           <CheckCircle color="success" />
//                         ) : (
//                           <Cancel color="error" />
//                         )}
//                       </TableCell>
//                     </TableRow>
//                   ))
//                 ) : (
//                   <TableRow>
//                     <TableCell colSpan={3} align="center">
//                       No tracking data available.
//                     </TableCell>
//                   </TableRow>
//                 )}
//               </TableBody>
//             </Table>
//           </TableContainer>
//         </Box>
//       </Box>
//     </Box>
//   );
// }

// export default LiveTrack;
