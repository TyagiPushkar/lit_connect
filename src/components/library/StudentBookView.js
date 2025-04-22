import React, { useEffect, useState } from "react";
import {
  Box,
  Typography,
  CircularProgress,
  List,
  ListItem,
  Paper,
  Button,
  Checkbox,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useParams } from "react-router-dom";
import axios from "axios";

const StudentBooksView = () => {
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [booksData, setBooksData] = useState([]);
  const [availableBooks, setAvailableBooks] = useState({});
  const [selectedBooks, setSelectedBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentAndBooks = async () => {
      try {
        // Fetch student details
        const studentRes = await axios.get(
          `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
        );

        if (studentRes.data.success && studentRes.data.data) {
          const student = studentRes.data.data;
          setStudentData(student);
          const course = student.Course;

          // Fetch books based on the student's course
          const booksRes = await axios.get(
            `https://namami-infotech.com/LIT/src/library/get_sem_books.php?course=${course}`
          );

          if (booksRes.data.success && booksRes.data.data.length) {
            setBooksData(booksRes.data.data);

            // Check the availability of each book
            const availabilityChecks = booksRes.data.data.map(async (book) => {
              const encodedTitle = encodeURIComponent(book.book_title);
              const availRes = await axios.get(
                `https://namami-infotech.com/LIT/src/library/get_available_books.php?title=${encodedTitle}`
              );

              // Log the availability response to debug
              console.log("Availability check for:", book.book_title, availRes.data);

              return {
                title: book.book_title.toLowerCase().trim(),
                available: availRes.data.success && availRes.data.data.length > 0,
                bookId: availRes.data.success && availRes.data.data.length > 0 ? availRes.data.data[0].BookId : null,
              };
            });

            const availabilityResults = await Promise.all(availabilityChecks);

            // Map the availability data
            const availabilityMap = {};
            availabilityResults.forEach((result) => {
              availabilityMap[result.title] = {
                available: result.available,
                bookId: result.bookId,
              };
            });

            setAvailableBooks(availabilityMap);
          }
        } else {
          alert("Student not found.");
        }
      } catch (err) {
        console.error("Error fetching data:", err);
        alert("An error occurred while fetching student/book data.");
      } finally {
        setLoading(false);
      }
    };

    fetchStudentAndBooks();
  }, [studentId]);

  const handleCheckboxChange = (checked, bookId) => {
    if (!bookId) return; // Ignore null BookId
    if (checked) {
      setSelectedBooks((prev) => [...prev, bookId]);
    } else {
      setSelectedBooks((prev) => prev.filter((id) => id !== bookId));
    }
  };

  const handleIssueBooks = async () => {
    if (selectedBooks.length === 0) {
      alert("No books selected to issue.");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    try {
      const res = await axios.post("https://namami-infotech.com/LIT/src/library/issue_book.php", {
        StudentId: studentData.StudentId,
        BookIds: selectedBooks,
        IssueDate: today,
      });

      if (res.data.success) {
        const failedBooks = res.data.data.filter((item) => !item.success);
        if (failedBooks.length === 0) {
          alert("All books issued successfully!");
        } else {
          const failedTitles = failedBooks
            .map((item) => `BookId: ${item.BookId} (${item.message})`)
            .join("\n");
          alert(`Some books failed to issue:\n${failedTitles}`);
        }
        setSelectedBooks([]); // Clear after issuing
      } else {
        alert("Book issue failed. Please try again.");
      }
    } catch (err) {
      console.error("Issue error:", err);
      alert("Error issuing books.");
    }
  };

  if (loading) return <CircularProgress sx={{ mt: 5 }} />;

  if (!studentData) {
    return (
      <Box sx={{ textAlign: "center", mt: 5 }}>
        <Typography variant="h6" color="error">
          Student not found.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2, backgroundColor: "#fff", minHeight: "100vh" }}>
      {/* Student Info */}
      <Paper sx={{ p: 4, mb: 3, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h5" fontWeight={700} color="#CC7A00" gutterBottom>
          Student Information
        </Typography>
        <Typography variant="subtitle1">
          <strong>Name:</strong> {studentData.CandidateName}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Course:</strong> {studentData.Course}
        </Typography>
        <Typography variant="subtitle1">
          <strong>Enrollment Year:</strong> {studentData.enrollment_year}
        </Typography>
      </Paper>

      {/* Books List */}
      <Paper sx={{ p: 4, borderRadius: 3, boxShadow: 4 }}>
        <Typography variant="h5" fontWeight={700} color="#CC7A00" gutterBottom>
          Books for {studentData.Course}
        </Typography>

        {booksData.length ? (
          Object.entries(
            booksData.reduce((acc, book) => {
              acc[book.semester] = acc[book.semester] || [];
              acc[book.semester].push(book);
              return acc;
            }, {})
          ).map(([semester, books], idx) => (
            <Accordion key={idx} sx={{ mb: 2 }}>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6" fontWeight={600}>
                  Semester: {semester}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                <List>
                  {books.map((book, index) => {
                    const normalizedTitle = book.book_title.toLowerCase().trim();
                    const availability = availableBooks[normalizedTitle] || {};

                    // Debug log for availability check
                    console.log(`Book Title: ${book.book_title}, Availability:`, availability);

                    return (
                      <ListItem key={index} sx={{ display: "flex", alignItems: "center" }}>
                        <Box sx={{ flexGrow: 1 }}>
                          <Typography variant="body2">
                            <strong>Book Title:</strong> {book.book_title}
                          </Typography>
                        </Box>
                        <Checkbox
                          disabled={availability.available}
                          checked={selectedBooks.includes(availability.bookId)}
                          title={availability.bookId ? `BookId: ${availability.bookId}` : "Issued"}
                          onChange={(e) => handleCheckboxChange(e.target.checked, availability.bookId)}
                        />
                      </ListItem>
                    );
                  })}
                </List>
              </AccordionDetails>
            </Accordion>
          ))
        ) : (
          <Typography>No books found for this course.</Typography>
        )}
      </Paper>

      {/* Buttons */}
      <Box sx={{ mt: 4, textAlign: "center", display: "flex", justifyContent: "center", gap: 2 }}>
        <Button variant="contained" sx={{ backgroundColor: "#CC7A00" }} onClick={handleIssueBooks}>
          Issue Books
        </Button>
        <Button variant="outlined" onClick={() => window.history.back()}>
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

export default StudentBooksView;
