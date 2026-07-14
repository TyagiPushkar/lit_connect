import React, { useEffect, Suspense, lazy } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import { ThemeProvider } from "@mui/material/styles";
import { AuthProvider } from "./components/auth/AuthContext";
import Login from "./pages/Login";
import theme from "./styles/theme";
import PrivateRoute from "./components/auth/PrivateRoute";

// Lazy load pages to optimize initial bundle size and speed up load time
const Employee = lazy(() => import("./pages/Employee"));
const Holiday = lazy(() => import("./pages/Holiday"));
const Policy = lazy(() => import("./pages/Policy"));
const Attendance = lazy(() => import("./pages/Attendance"));
const Notification = lazy(() => import("./pages/Notification"));
const Leave = lazy(() => import("./pages/Leave"));
const EmpProfile = lazy(() => import("./pages/User"));
const EmployeeProfile = lazy(() => import("./pages/EmployeeProfile"));
const VisitReport = lazy(() => import("./pages/VisitReport"));
const Admission = lazy(() => import("./pages/Admission"));
const ViewAdmission = lazy(() => import("./pages/ViewAdmission"));
const Library = lazy(() => import("./pages/Library"));
const AdmissionFinal = lazy(() => import("./pages/AdmissionFinal"));
const FeesStructure = lazy(() => import("./pages/FeesStructure"));
const FeesPayment = lazy(() => import("./pages/FeesPayment"));
const StudentFees = lazy(() => import("./pages/StudentFees"));
const StuLibrary = lazy(() => import("./pages/StuLibrary"));
const LibraryDash = lazy(() => import("./pages/LibraryDash"));
const StudentReport = lazy(() => import("./pages/StudentReport"));
const Form = lazy(() => import("./pages/Form"));
const Certificate = lazy(() => import("./pages/Certificate"));
const Students = lazy(() => import("./pages/Students"));
const StudentInfo = lazy(() => import("./pages/StudentInfo"));
const Variable = lazy(() => import("./pages/Variable"));
const Regularise = lazy(() => import("./pages/Regularise"));
const Notices = lazy(() => import("./pages/Notices"));
const News = lazy(() => import("./pages/News"));
const TimeTable = lazy(() => import("./pages/TimeTable"));
const Transaction = lazy(() => import("./pages/Transactions"));
const FeesSummaryView = lazy(() => import("./pages/FeesSummaryView"));
const OtherFees = lazy(() => import("./pages/OtherFees"));
const Subjects = lazy(() => import("./pages/Subjects"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const VariableFees = lazy(() => import("./pages/VariableFees"));
const StudentCertificate = lazy(() => import("./pages/StudentCretificate"));
const StudentCertificateDetail = lazy(() => import("./pages/StudentCertificateDetail"));
const NDC = lazy(() => import("./pages/NDC"));
const TaskList = lazy(() => import("./pages/TaskList"));
const Visit = lazy(() => import("./pages/Dealer"));
const Docket = lazy(() => import("./pages/Docket"));
const Maps = lazy(() => import("./pages/Maps"));
const VariableFeeStructure = lazy(() => import("./pages/VariableFeeStructure"));
const MidTerm = lazy(() => import("./pages/MidTerm"));
const AdminTask = lazy(() => import("./pages/AdminTask"));

function App() {
  useEffect(() => {
    const handleRightClick = (event) => {
      event.preventDefault();
    };

    document.addEventListener("contextmenu", handleRightClick);

    return () => {
      document.removeEventListener("contextmenu", handleRightClick);
    };
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Suspense
            fallback={
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  height: "100vh",
                  backgroundColor: "#fafafa",
                }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    border: "4px solid #f3f3f3",
                    borderTop: "4px solid #CC7A00",
                    borderRadius: "50%",
                    animation: "spin 1s linear infinite",
                  }}
                ></div>
                <style>{`
                  @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                  }
                `}</style>
              </div>
            }
          >
            <Routes>
              <Route path="/" element={<Login />} />
              <Route
                path="/teachers"
                element={
                  <PrivateRoute
                    element={Employee}
                    requiredRoles={["HR", "Admin"]}
                  />
                }
              />
              <Route
                path="/teachers/:empId"
                element={
                  <PrivateRoute
                    element={EmployeeProfile}
                    requiredRoles={["HR", "Admin"]}
                  />
                }
              />
              <Route
                path="/holiday"
                element={<PrivateRoute element={Holiday} />}
              />
              <Route path="/policy" element={<PrivateRoute element={Policy} />} />
              <Route
                path="/attendance"
                element={<PrivateRoute element={Attendance} />}
              />
              <Route
                path="/notification"
                element={<PrivateRoute element={Notification} />}
              />
              <Route path="/leave" element={<PrivateRoute element={Leave} />} />
              <Route
                path="/admissions"
                element={<PrivateRoute element={Admission} />}
              />
              <Route
                path="/admissions/view/:activityId"
                element={<PrivateRoute element={ViewAdmission} />}
              />
              <Route
                path="/admissions/finalize"
                element={<PrivateRoute element={AdmissionFinal} />}
              />
              <Route
                path="/profile"
                element={<PrivateRoute element={EmpProfile} />}
              />
              <Route
                path="/student-certificate"
                element={<PrivateRoute element={StudentCertificate} />}
              />
              <Route
                path="/student-certificate/:studentId"
                element={<PrivateRoute element={StudentCertificateDetail} />}
              />
              <Route
                path="/report"
                element={
                  <PrivateRoute
                    element={StudentReport}
                    requiredRoles={["Teacher", "Principal", "Examination"]}
                  />
                }
              />
              <Route
                path="/library"
                element={
                  <PrivateRoute element={Library} requiredRole="Librarian" />
                }
              />
              <Route
                path="/library-dashboard"
                element={
                  <PrivateRoute
                    element={LibraryDash}
                    requiredRoles={["Librarian", "Admin"]}
                  />
                }
              />
              <Route
                path="/student/library/:studentId"
                element={
                  <PrivateRoute element={StuLibrary} requiredRole="Librarian" />
                }
              />
              <Route
                path="/fee-structure"
                element={
                  <PrivateRoute
                    element={FeesStructure}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/fees-summary"
                element={
                  <PrivateRoute
                    element={FeesSummaryView}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/transactions"
                element={
                  <PrivateRoute
                    element={Transaction}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/variable-transactions"
                element={
                  <PrivateRoute
                    element={VariableFees}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/variable-fee-structure"
                element={
                  <PrivateRoute
                    element={VariableFeeStructure}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/other-fees"
                element={
                  <PrivateRoute
                    element={OtherFees}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/fees-payment"
                element={
                  <PrivateRoute
                    element={FeesPayment}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/fees/:studentId"
                element={
                  <PrivateRoute
                    element={StudentFees}
                    requiredRoles={["Accounts", "Front Desk", "Admin"]}
                  />
                }
              />
              <Route
                path="/certificate"
                element={<PrivateRoute element={Certificate} requiredRole="HR" />}
              />
              <Route
                path="/students"
                element={
                  <PrivateRoute
                    element={Students}
                    requiredRoles={[
                      "Accounts",
                      "Front Desk",
                      "Admin",
                      "HR",
                      "Examination",
                      "Principal",
                    ]}
                  />
                }
              />
              <Route
                path="/student/:studentId"
                element={
                  <PrivateRoute
                    element={StudentInfo}
                    requiredRoles={[
                      "HR",
                      "Front Desk",
                      "Accounts",
                      "Principal",
                      "Examination",
                      "Admin",
                    ]}
                  />
                }
              />
              <Route
                path="/variable"
                element={<PrivateRoute element={Variable} requiredRole="HR" />}
              />
              <Route
                path="/hr-report"
                element={<PrivateRoute element={VisitReport} requiredRole="HR" />}
              />
              <Route
                path="/regularise"
                element={<PrivateRoute element={Regularise} requiredRole="HR" />}
              />
              <Route
                path="/notices"
                element={<PrivateRoute element={Notices} requiredRole="HR" />}
              />
              <Route
                path="/news"
                element={<PrivateRoute element={News} requiredRole="HR" />}
              />
              <Route
                path="/subjects"
                element={
                  <PrivateRoute
                    element={Subjects}
                    requiredRoles={["HR", "Principal"]}
                  />
                }
              />
              <Route
                path="/time-table"
                element={
                  <PrivateRoute
                    element={TimeTable}
                    requiredRoles={["HR", "Principal"]}
                  />
                }
              />
              <Route path="/form" element={<PrivateRoute element={Form} />} />
              <Route
                path="/dashboard"
                element={<PrivateRoute element={Dashboard} />}
              />
              <Route path="/ndc" element={<PrivateRoute element={NDC} />} />
              <Route
                path="/mid-term"
                element={<PrivateRoute element={MidTerm} />}
              />
              <Route path="/task/:empId" element={<TaskList />} />
              <Route path="/task" element={<AdminTask />} />
              <Route path="/visit" element={<PrivateRoute element={Visit} />} />
              <Route
                path="/plan-visit"
                element={<PrivateRoute element={Visit} />}
              />
              <Route path="/leads" element={<PrivateRoute element={Docket} />} />
              <Route path="/maps" element={<PrivateRoute element={Maps} />} />
            </Routes>
          </Suspense>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
