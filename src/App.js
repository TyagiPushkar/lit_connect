import React, { useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { ThemeProvider } from '@mui/material/styles';
import { AuthProvider } from './components/auth/AuthContext';
import Login from './pages/Login';
import theme from './styles/theme';
import Employee from './pages/Employee';
import Holiday from './pages/Holiday';
import Policy from './pages/Policy';
import Attendance from './pages/Attendance';
import Notification from './pages/Notification';
import Leave from './pages/Leave';
import EmpProfile from './pages/User';
import PrivateRoute from './components/auth/PrivateRoute';
import EmployeeProfile from './pages/EmployeeProfile';
import VisitReport from './pages/VisitReport';
import Admission from './pages/Admission';
import ViewAdmission from './pages/ViewAdmission';
import Library from './pages/Library';
import AdmissionFinal from './pages/AdmissionFinal';
import FeesStructure from './pages/FeesStructure';
import FeesPayment from './pages/FeesPayment';
import StudentFees from './pages/StudentFees';
import StuLibrary from './pages/StuLibrary';
import LibraryDash from './pages/LibraryDash';
import StudentReport from './pages/StudentReport';
import Menus from './pages/Menus';
import Checkpoints from './pages/Checkpoints';
import Form from './pages/Form';
import Certificate from './pages/Certificate';
import Students from './pages/Students';
import StudentInfo from './pages/StudentInfo';
import Variable from './pages/Variable';
import Regularise from './pages/Regularise';
import Notices from './pages/Notices';
import News from './pages/News';
import TimeTable from './pages/TimeTable';
import Transaction from './pages/Transactions';
import FeesSummaryView from './pages/FeesSummaryView';
import OtherFees from './pages/OtherFees';
function App() {
   useEffect(() => {
        const handleRightClick = (event) => {
            event.preventDefault();
        };

        document.addEventListener('contextmenu', handleRightClick);

        return () => {
            document.removeEventListener('contextmenu', handleRightClick);
        };
    }, []);
  return (
    <ThemeProvider theme={theme}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Login />} />
            <Route path="/teachers" element={<PrivateRoute element={Employee} requiredRole="HR" />} />
            <Route path="/teachers/:empId" element={<PrivateRoute element={EmployeeProfile} requiredRole="HR" />} />
            <Route path="/holiday" element={<PrivateRoute element={Holiday} />} />
            <Route path="/policy" element={<PrivateRoute element={Policy} />} />
            <Route path="/attendance" element={<PrivateRoute element={Attendance} />} />
            <Route path="/notification" element={<PrivateRoute element={Notification} />} />
            <Route path="/leave" element={<PrivateRoute element={Leave} />} />
            <Route path="/admissions" element={<PrivateRoute element={Admission} />} />
            <Route path="/admissions/view/:activityId" element={<PrivateRoute element={ViewAdmission} />} />
            <Route path="/admissions/finalize" element={<PrivateRoute element={AdmissionFinal} />} />
            <Route path="/profile" element={<PrivateRoute element={EmpProfile} />} />
            <Route path="/report" element={<PrivateRoute element={StudentReport} requiredRole="Teacher" />} />
            <Route path="/library" element={<PrivateRoute element={Library} requiredRole="Librarian" />} />
            <Route path="/library-dashboard" element={<PrivateRoute element={LibraryDash} requiredRole="Librarian" />} />
            <Route path="/student/library/:studentId" element={<PrivateRoute element={StuLibrary} requiredRole="Librarian" />} />
            <Route path="/fee-structure" element={<PrivateRoute element={FeesStructure} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />
            <Route path="/fees-summary" element={<PrivateRoute element={FeesSummaryView} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />
            <Route path="/transactions" element={<PrivateRoute element={Transaction} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />
<Route path="/other-fees" element={<PrivateRoute element={OtherFees} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />
<Route path="/fees-payment" element={<PrivateRoute element={FeesPayment} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />

            <Route path="/fees/:studentId" element={<PrivateRoute element={StudentFees} requiredRoles={["Accounts", "Front Desk","Admin"]} />} />
            <Route path="/certificate" element={<PrivateRoute element={Certificate} requiredRole="HR" />} />
            <Route path="/students" element={<PrivateRoute element={Students} requiredRoles={["Accounts", "Front Desk","Admin","HR"]} />} />
            <Route path="/student/:studentId" element={<PrivateRoute element={StudentInfo} requiredRole="HR" />} />
            <Route path="/variable" element={<PrivateRoute element={Variable} requiredRole="HR" />} />
            <Route path="/hr-report" element={<PrivateRoute element={VisitReport} requiredRole="HR" />} />
            <Route path="/regularise" element={<PrivateRoute element={Regularise} requiredRole="HR" />} />
            <Route path="/notices" element={<PrivateRoute element={Notices} requiredRole="HR" />} />
            <Route path="/news" element={<PrivateRoute element={News} requiredRole="HR" />} />
            <Route path="/time-table" element={<PrivateRoute element={TimeTable} requiredRole="HR" />} />
            <Route path="/form" element={<PrivateRoute element={Form} />} />
            {/* Optional Routes */}
            {/* <Route path="/menus" element={<PrivateRoute element={Menus} />} />
            <Route path="/add-menu" element={<PrivateRoute element={Menus} />} />

            <Route path="/checkpoints" element={<PrivateRoute element={Checkpoints} />} />
            <Route path="/add-checkpoint" element={<PrivateRoute element={Checkpoints} />} /> */}
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
