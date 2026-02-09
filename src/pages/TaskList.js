import React from "react";
import { Box, useMediaQuery } from "@mui/material";
import ViewTask from "../components/task/ViewTask";

function TaskList() {
  const isMobile = useMediaQuery("(max-width:768px)");

  return (
    <Box
      sx={{
        width: "100%",
        minHeight: "100vh",
        backgroundColor: "#f5f5f5",
      }}
    >
      <Box
        component="main"
        sx={{
          width: "95%",
          p: isMobile ? 0 : 2,
          maxWidth: "100%",
          overflowX: "hidden",
        }}
      >
        <ViewTask />
      </Box>
    </Box>
  );
}

export default TaskList;
