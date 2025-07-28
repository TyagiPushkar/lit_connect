import React, { useState, useEffect } from 'react';
import {
  Box, Typography, CircularProgress, Grid, Button, 
  Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, MenuItem, Select, FormControl, 
  InputLabel, TextField, Dialog, DialogTitle, 
  DialogContent, DialogActions, IconButton, Tooltip,
  DialogContentText
} from '@mui/material';
import { Add, FilterAlt, Close, Delete, Edit } from '@mui/icons-material';
import axios from 'axios';

function SubjectsList() {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [semesters, setSemesters] = useState([]);
  const [subjectNames, setSubjectNames] = useState([]);
  const [filters, setFilters] = useState({
    course: '',
    semester: '',
    subject: ''
  });
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openDeactivateDialog, setOpenDeactivateDialog] = useState(false);
  const [subjectToDeactivate, setSubjectToDeactivate] = useState(null);
  const [newSubject, setNewSubject] = useState({
    SubjectName: '',
    Course: '',
    Semester: ''
  });

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    setLoading(true);
    try {
      const response = await axios.get('https://namami-infotech.com/LIT/src/menu/subjects_list.php');
      if (response.data.success) {
        const data = response.data.data || [];
        setSubjects(data);
        
        // Extract unique values for filters
        const uniqueCourses = [...new Set(data.map(item => item.Course))];
        const uniqueSemesters = [...new Set(data.map(item => item.Semester))];
        const uniqueSubjects = [...new Set(data.map(item => item.Subject))];
        
        setCourses(uniqueCourses);
        setSemesters(uniqueSemesters);
        setSubjectNames(uniqueSubjects);
      }
    } catch (err) {
      console.error('Failed to load subjects:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddSubject = async () => {
    try {
      const response = await axios.post(
        'https://namami-infotech.com/LIT/src/menu/add_subjects.php',
        newSubject
      );
      
      if (response.data.success) {
        fetchSubjects(); // Refresh the list
        setOpenAddDialog(false);
        setNewSubject({
          SubjectName: '',
          Course: '',
          Semester: ''
        });
      }
    } catch (err) {
      console.error('Failed to add subject:', err);
    }
  };

  const handleDeactivateSubject = async () => {
    try {
      const response = await axios.post(
        'https://namami-infotech.com/LIT/src/menu/deactivate_subjects.php',
        { SubjectID: subjectToDeactivate.Id }
      );
      
      if (response.data.success) {
        fetchSubjects(); // Refresh the list
        setOpenDeactivateDialog(false);
      }
    } catch (err) {
      console.error('Failed to deactivate subject:', err);
    }
  };

  const filteredSubjects = subjects.filter(subject => {
    return (
      (filters.course === '' || subject.Course === filters.course) &&
      (filters.semester === '' || subject.Semester === filters.semester) &&
      (filters.subject === '' || subject.Subject.includes(filters.subject))
    );
  });

  const resetFilters = () => {
    setFilters({
      course: '',
      semester: '',
      subject: ''
    });
  };

  return (
    <Box p={3}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Subjects List</Typography>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Tooltip title="Filters">
              <FilterAlt color="action" />
            </Tooltip>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Course</InputLabel>
              <Select
                name="course"
                value={filters.course}
                onChange={handleFilterChange}
                label="Course"
              >
                <MenuItem value="">All</MenuItem>
                {courses.map((course, index) => (
                  <MenuItem key={index} value={course}>{course}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Semester</InputLabel>
              <Select
                name="semester"
                value={filters.semester}
                onChange={handleFilterChange}
                label="Semester"
              >
                <MenuItem value="">All</MenuItem>
                {semesters.map((semester, index) => (
                  <MenuItem key={index} value={semester}>Sem {semester}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Subject</InputLabel>
              <Select
                name="subject"
                value={filters.subject}
                onChange={handleFilterChange}
                label="Subject"
              >
                <MenuItem value="">All</MenuItem>
                {subjectNames.map((subject, index) => (
                  <MenuItem key={index} value={subject}>{subject}</MenuItem>
                ))}
              </Select>
            </FormControl>
            
            <Button 
              size="small"
              variant="outlined" 
              onClick={resetFilters}
              startIcon={<Close />}
            >
              Reset
            </Button>
          </Box>
          
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => setOpenAddDialog(true)}
            sx={{ backgroundColor: '#1976d2', '&:hover': { backgroundColor: '#1565c0' } }}
          >
            Add Subject
          </Button>
        </Box>
      </Box>

      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress />
        </Box>
      ) : (
        <TableContainer component={Paper} elevation={3}>
          <Table>
            <TableHead>
               <TableRow sx={{ backgroundColor: '#CC7A00' }}>
                <TableCell sx={{ fontWeight: 'bold',color: "white" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 'bold',color: "white" }}>Course</TableCell>
                <TableCell sx={{ fontWeight: 'bold',color: "white" }}>Semester</TableCell>
                <TableCell sx={{ fontWeight: 'bold',color: "white" }}>Subject</TableCell>
                  <TableCell sx={{ fontWeight: 'bold', color: "white" }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 'bold',color: "white" }}>Action</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSubjects.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No subjects found matching your filters
                  </TableCell>
                </TableRow>
              ) : (
                filteredSubjects.map((subject) => (
                  <TableRow key={subject.Id} hover>
                    <TableCell>{subject.Id}</TableCell>
                    <TableCell>{subject.Course}</TableCell>
                    <TableCell>Semester {subject.Semester}</TableCell>
                    <TableCell>{subject.Subject}</TableCell>
                    <TableCell>
                      <Box 
                        component="span" 
                        sx={{
                          color: subject.Status === 'Active' ? 'success.main' : 'error.main',
                          fontWeight: 'bold'
                        }}
                      >
                        {subject.Status}
                      </Box>
                    </TableCell>
                    <TableCell>
                      {subject.Status === 'Active' && (
                        <Tooltip title="Deactivate Subject">
                          <IconButton 
                            color="error"
                            onClick={() => {
                              setSubjectToDeactivate(subject);
                              setOpenDeactivateDialog(true);
                            }}
                          >
                            <Delete />
                          </IconButton>
                        </Tooltip>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Add Subject Dialog */}
      <Dialog open={openAddDialog} onClose={() => setOpenAddDialog(false)}>
        <DialogTitle>Add New Subject</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Subject Name"
                value={newSubject.SubjectName}
                onChange={(e) => setNewSubject({...newSubject, SubjectName: e.target.value})}
              />
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Course</InputLabel>
                <Select
                  value={newSubject.Course}
                  onChange={(e) => setNewSubject({...newSubject, Course: e.target.value})}
                  label="Course"
                >
                  {courses.map((course, index) => (
                    <MenuItem key={index} value={course}>{course}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={newSubject.Semester}
                  onChange={(e) => setNewSubject({...newSubject, Semester: e.target.value})}
                  label="Semester"
                >
                  {semesters.map((semester, index) => (
                    <MenuItem key={index} value={semester}>Semester {semester}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenAddDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleAddSubject}
            variant="contained"
            disabled={!newSubject.SubjectName || !newSubject.Course || !newSubject.Semester}
          >
            Add Subject
          </Button>
        </DialogActions>
      </Dialog>

      {/* Deactivate Subject Dialog */}
      <Dialog open={openDeactivateDialog} onClose={() => setOpenDeactivateDialog(false)}>
        <DialogTitle>Deactivate Subject</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to deactivate {subjectToDeactivate?.Subject} (ID: {subjectToDeactivate?.Id})?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeactivateDialog(false)}>Cancel</Button>
          <Button 
            onClick={handleDeactivateSubject}
            variant="contained"
            color="error"
          >
            Deactivate
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

export default SubjectsList;