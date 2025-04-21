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
} from "@mui/material";
import { useParams } from "react-router-dom";
import axios from "axios";

const StudentBooksView = () => {
  const { studentId } = useParams();
  const [studentData, setStudentData] = useState(null);
  const [booksData, setBooksData] = useState([]);
  const [availableBooks, setAvailableBooks] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStudentAndBooks = async () => {
      try {
        const studentRes = await axios.get(
          `https://namami-infotech.com/LIT/src/students/get_student_id.php?StudentId=${studentId}`
        );

        if (studentRes.data.success && studentRes.data.data) {
          const student = studentRes.data.data;
          setStudentData(student);
          const course = student.Course;

          const booksRes = await axios.get(
            `https://namami-infotech.com/LIT/src/library/get_sem_books.php?course=${course}`
          );

          if (booksRes.data.success) {
            setBooksData(booksRes.data.data);

            // Check availability for each book title
            const availabilityChecks = booksRes.data.data.map(async (book) => {
              const encodedTitle = encodeURIComponent(book.book_title);
              const availRes = await axios.get(
                `https://namami-infotech.com/LIT/src/library/get_available_books.php?title=${encodedTitle}`
              );
              return {
                title: book.book_title.toLowerCase().trim(),
                available: availRes.data.success && availRes.data.data.length > 0,
                bookId: availRes.data.data.length > 0 ? availRes.data.data[0].BookId : null,
              };
            });

            const availabilityResults = await Promise.all(availabilityChecks);
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
          <List>
  {booksData.map((book, index) => {
    const normalizedTitle = book.book_title.toLowerCase().trim();

    // Match if any key in availableBooks includes the book title
    const matchedKey = Object.keys(availableBooks).find(key =>
      key.includes(normalizedTitle)
    );

    const availability = matchedKey ? availableBooks[matchedKey] : {};

    return (
      <ListItem key={index} sx={{ display: "flex", alignItems: "center" }}>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="body1">
            <strong>Semester:</strong> {book.semester}
          </Typography>
          <Typography variant="body2">
            <strong>Book Title:</strong> {book.book_title}
          </Typography>
        </Box>

        <Checkbox
          title={availability.bookId ? `BookId: ${availability.bookId}` : "Not Available"}
        />
      </ListItem>
    );
  })}
</List>

        ) : (
          <Typography>No books found for this course.</Typography>
        )}
      </Paper>

      {/* Back Button */}
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Button
          variant="contained"
          sx={{ backgroundColor: "#CC7A00" }}
          onClick={() => window.history.back()}
        >
          Go Back
        </Button>
      </Box>
    </Box>
  );
};

export default StudentBooksView;
