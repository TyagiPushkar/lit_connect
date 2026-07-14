import React from "react";
import { useLocation, Link } from "react-router-dom";
import {
  Drawer,
  List,
  ListItem,
  Box,
  ListItemIcon,
  Typography,
  IconButton,
  useMediaQuery,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import {
  HolidayVillage,
  Person,
  BarChart,
  AddLocationAlt,
  Map,
  HowToReg,
  Apps as AppsIcon,
  Menu as MenuIcon,
  Summarize as SummarizeIcon,
  AddHomeWork as AddHomeWorkIcon,
  LibraryBooks as LibraryBooksIcon,
  MenuBook as MenuBookIcon,
  DynamicForm as DynamicFormIcon,
  WorkspacePremium as WorkspacePremiumIcon,
  Newspaper as NewspaperIcon,
  MarkUnreadChatAlt as MarkUnreadChatAltIcon,
  CalendarMonth as CalendarMonthIcon,
  Checklist as ChecklistIcon,
  WorkOff as WorkOffIcon,
  Dashboard as DashboardIcon,
  School as SchoolIcon,
  Badge as BadgeIcon,
  AccountBalance as AccountBalanceIcon,
  Payment as PaymentIcon,
  PersonAdd as PersonAddIcon,
  PriceChange as PriceChangeIcon,
  Assessment as AssessmentIcon,
  Campaign as CampaignIcon,
  CheckCircleOutline as CheckCircleOutlineIcon,
  ReceiptLong as ReceiptLongIcon,
  Analytics as AnalyticsIcon,
  AddCard as AddCardIcon,
  PlaylistAddCheck as PlaylistAddCheckIcon,
  Task as TaskIcon,
  Description as DescriptionIcon,
  Quiz as QuizIcon,
  CardMembership as CardMembershipIcon,
} from "@mui/icons-material";
import { useAuth } from "./auth/AuthContext";
import HRSmileLogo from "../assets/images (1).png";
// import MenuIcon from '@mui/icons-material/Menu';
function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const activeRef = React.useRef(null);
  const sidebarRef = React.useRef(null);
  const isMobile = useMediaQuery("(max-width:600px)");

  const [isCollapsed, setIsCollapsed] = React.useState(() => {
    return localStorage.getItem("sidebar-collapsed") === "true";
  });

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const newVal = !prev;
      localStorage.setItem("sidebar-collapsed", String(newVal));
      return newVal;
    });
  };

  React.useLayoutEffect(() => {
    if (sidebarRef.current) {
      const parent = sidebarRef.current.parentElement;
      if (parent) {
        if (isMobile) {
          parent.style.width = "0px";
        } else {
          parent.style.width = isCollapsed ? "70px" : "240px";
        }
        parent.style.transition = "width 0.3s ease";
      }
    }
  }, [isCollapsed, isMobile]);

  React.useEffect(() => {
    if (activeRef.current) {
      activeRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [location.pathname]);

  // Module Mapping
  const moduleMapping = {
    21: { path: "/attendance", name: "Attendance", icon: <BarChart /> },
    3: { path: "/leave", name: "Leave", icon: <WorkOffIcon /> },
    // 10: { path: '/policy', name: 'Policy', icon: <Policy /> },
    8: { path: "/holiday", name: "Holiday", icon: <HolidayVillage /> },

    22: {
      path: "/library-dashboard",
      name: "Book List",
      icon: <MenuBookIcon />,
    },
    17: { path: "/fee-structure", name: "Fees Structure", icon: <AccountBalanceIcon /> },
    23: { path: "/fees-payment", name: "Fees Payment", icon: <PaymentIcon /> },
    18: { path: "/teachers", name: "Staff", icon: <BadgeIcon /> },
    24: { path: "/form", name: "Admission Form", icon: <DynamicFormIcon /> },
    25: { path: "/admissions", name: "Admissions", icon: <PersonAddIcon /> },
    100: { path: "/dashboard", name: "Dashboard", icon: <DashboardIcon /> },
  };

  // Default routes visible to everyone
  const defaultRoutes = [
    //  { path: '/students', name: 'Students', icon: <Person /> }
  ];

  const userModules = user?.modules || [];
  const allowedRoutes = userModules
    .map((moduleId) => moduleMapping[moduleId])
    .filter(Boolean);
  if (user?.role === "HR") {
    allowedRoutes.push(
      { path: "/teachers", name: "Staff", icon: <BadgeIcon /> },
      { path: "/students", name: "Students", icon: <SchoolIcon /> },

      { path: "/policy", name: "Timetable", icon: <CalendarMonthIcon /> },
      { path: "/subjects", name: "Subjects", icon: <LibraryBooksIcon /> },
      {
        path: "/certificate",
        name: "Certificate",
        icon: <WorkspacePremiumIcon />,
      },
      { path: "/variable", name: "Variable Fees", icon: <PriceChangeIcon /> },
      { path: "/hr-report", name: "Reports", icon: <AssessmentIcon /> },
      { path: "/notices", name: "Notices", icon: <CampaignIcon /> },
      { path: "/news", name: "News", icon: <NewspaperIcon /> },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
    );
  }
  if (user?.role === "Accounts") {
    allowedRoutes.push(
      { path: "/transactions", name: "Transactions", icon: <ReceiptLongIcon /> },

      { path: "/fees-summary", name: "Fees Summary", icon: <AnalyticsIcon /> },
      { path: "/other-fees", name: "Other Fees", icon: <AddCardIcon /> },
      { path: "/students", name: "Students", icon: <SchoolIcon /> },
      {
        path: "/variable-fee-structure",
        name: "Variable Fees Structure",
        icon: <PlaylistAddCheckIcon />,
      },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
    );
  }
  if (user?.role === "Front Desk") {
    allowedRoutes.push(
      {
        path: "/student-certificate",
        name: "Student Certificate",
        icon: <CardMembershipIcon />,
      },
      { path: "/transactions", name: "Transactions", icon: <ReceiptLongIcon /> },

      { path: "/other-fees", name: "Other Fees", icon: <AddCardIcon /> },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
    );
  }
  if (user?.role === "Admin") {
    allowedRoutes.push(
      {
        path: "/students",
        name: "Students",
        icon: <SchoolIcon />,
      },
      {
        path: "/task",
        name: "TaskList",
        icon: <TaskIcon />,
      },
    );
  }
  // HR-specific routes
  if (user?.role === "Teacher") {
    allowedRoutes.push(
      { path: "/report", name: "Report", icon: <DescriptionIcon /> },

      // { path: '/hr-report', name: 'Menus', icon: <MenuIcon /> },
      // { path: '/checkpoints', name: 'Checkpoints', icon: <ChecklistIcon /> },
    );
  }
  if (user?.role === "Sales" || user?.role === "Admin") {
    allowedRoutes.push(
      { path: "/leads", name: "Leads", icon: <HowToReg /> },

      { path: "/visit", name: "Visit", icon: <AddLocationAlt /> },
      { path: "/maps", name: "Maps", icon: <Map /> },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
    );
  }
  if (user?.role === "Librarian") {
    allowedRoutes.push({
      path: "/library",
      name: "Library",
      icon: <MenuBookIcon />,
    });
  }
  if (user?.role === "Examination") {
    allowedRoutes.push(
      {
        path: "/report",
        name: "Report",
        icon: <DescriptionIcon />,
      },
      {
        path: "/students",
        name: "Students",
        icon: <SchoolIcon />,
      },
      {
        path: "/student-certificate",
        name: "Student Certificate",
        icon: <CardMembershipIcon />,
      },

      {
        path: "/certificate",
        name: "Certificate",
        icon: <WorkspacePremiumIcon />,
      },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
      { path: "/mid-term", name: "Mid Term", icon: <QuizIcon /> },
    );
  }
  if (user?.role === "Principal") {
    allowedRoutes.push(
      { path: "/students", name: "Students", icon: <SchoolIcon /> },

      { path: "/policy", name: "Timetable", icon: <CalendarMonthIcon /> },
      { path: "/subjects", name: "Subjects", icon: <LibraryBooksIcon /> },
      { path: "/mid-term", name: "Mid Term", icon: <QuizIcon /> },
      { path: "/notices", name: "Notices", icon: <CampaignIcon /> },
      { path: "/news", name: "News", icon: <NewspaperIcon /> },
      { path: "/ndc", name: "NDC", icon: <CheckCircleOutlineIcon /> },
    );
  }
  // Combine all available routes
  const routes = [...defaultRoutes, ...allowedRoutes];

  // For Principal and: insert Report right after Attendance
  if (user?.role === "Principal") {
    const attendanceIdx = routes.findIndex((r) => r.path === "/attendance");
    const reportRoute = {
      path: "/report",
      name: "Report",
      icon: <DescriptionIcon />,
    };
    if (attendanceIdx !== -1) {
      routes.splice(attendanceIdx + 1, 0, reportRoute);
    } else {
      routes.push(reportRoute);
    }
  }

  return (
    <Drawer
      ref={sidebarRef}
      variant="permanent"
      sx={{
        "& .MuiDrawer-paper": {
          width: isCollapsed ? 70 : 240,
          bgcolor: "#fff",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          boxShadow: 1,
          borderRight: "1px solid #ddd",
          overflowX: "hidden",
          transition: "width 0.3s ease",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        },
      }}
    >
      <Box
        sx={{
          display: "flex",
          flexDirection: isCollapsed ? "column" : "row",
          alignItems: "center",
          justifyContent: isCollapsed ? "center" : "space-between",
          p: 2,
          pb: -1,
          gap: 1,
          width: "100%",
          boxSizing: "border-box",
        }}
      >
        <img
          src={HRSmileLogo}
          alt="HRMS Logo"
          style={{
            width: isCollapsed ? 45 : 60,
            height: "auto",
            transition: "width 0.3s ease",
          }}
        />
        <IconButton onClick={toggleCollapse} size="small" sx={{ color: "black" }}>
          {isCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      <List
        sx={{
          width: "100%",
          overflowY: "auto",
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
        }}
      >
        {routes.map((route, index) => {
          const isActive = location.pathname === route.path;
          return (
            <ListItem
              button
              component={Link}
              to={route.path}
              selected={isActive}
              key={index}
              ref={isActive ? activeRef : null}
              sx={{
                display: "flex",
                flexDirection: "row",
                alignItems: "center",
                justifyContent: isCollapsed ? "center" : "flex-start",
                color: "black",
                py: 1.6,
                px: isCollapsed ? 1 : 1.5,
                my: 0.5,
                borderRadius: "8px",
                mx: isCollapsed ? 0.5 : 1,
                width: "auto",
                "&:hover": { bgcolor: "rgba(0, 0, 0, 0.05)" },
                "&.Mui-selected": {
                  bgcolor: "rgba(25, 118, 210, 0.12)",
                  color: "#1976d2",
                  "&:hover": {
                    bgcolor: "rgba(25, 118, 210, 0.18)",
                  },
                },
                transition: "all 0.3s ease",
              }}
            >
              <ListItemIcon
                sx={{
                  color: "inherit",
                  minWidth: "auto",
                  mr: isCollapsed ? 0 : 1.5,
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  "& svg": {
                    fontSize: "1.65rem",
                  }
                }}
              >
                {route.icon}
              </ListItemIcon>
              {!isCollapsed && (
                <Typography
                  variant="body2"
                  sx={{ 
                    fontWeight: 500, 
                    fontSize: "0.925rem",
                    lineHeight: 1.2
                  }}
                >
                  {route.name}
                </Typography>
              )}
            </ListItem>
          );
        })}
      </List>
    </Drawer>
  );
}

export default Sidebar;
