
import React from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './store';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Students from './pages/Students';
import AttendanceDaily from './pages/AttendanceDaily';
import MonthlyReport from './pages/MonthlyReport';
import Teachers from './pages/Teachers';
import Holidays from './pages/Holidays';
import Headmaster from './pages/Headmaster';
import Users from './pages/Users';
import Alumni from './pages/Alumni';
import Settings from './pages/Settings';
import AcademicYears from './pages/AcademicYears';
import ParentDashboard from './pages/ParentDashboard';
import Subjects from './pages/Subjects';
import AttendanceSubject from './pages/AttendanceSubject';
import MonthlyReportSubject from './pages/MonthlyReportSubject';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useApp();
  if (!currentUser) return <Navigate to="/login" replace />;
  return <Layout>{children}</Layout>;
};

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/students" element={<ProtectedRoute><Students /></ProtectedRoute>} />
      <Route path="/attendance" element={<ProtectedRoute><AttendanceDaily /></ProtectedRoute>} />
      <Route path="/report" element={<ProtectedRoute><MonthlyReport /></ProtectedRoute>} />
      <Route path="/report-subject" element={<ProtectedRoute><MonthlyReportSubject /></ProtectedRoute>} />
      <Route path="/parent-dashboard" element={<ProtectedRoute><ParentDashboard /></ProtectedRoute>} />
      
      {/* Implemented Features */}
      <Route path="/teachers" element={<ProtectedRoute><Teachers /></ProtectedRoute>} />
      <Route path="/headmaster" element={<ProtectedRoute><Headmaster /></ProtectedRoute>} />
      <Route path="/holidays" element={<ProtectedRoute><Holidays /></ProtectedRoute>} />
      <Route path="/users" element={<ProtectedRoute><Users /></ProtectedRoute>} />
      <Route path="/alumni" element={<ProtectedRoute><Alumni /></ProtectedRoute>} />
      <Route path="/academic-years" element={<ProtectedRoute><AcademicYears /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      
      {/* New Subject Features */}
      <Route path="/subjects" element={<ProtectedRoute><Subjects /></ProtectedRoute>} />
      <Route path="/attendance-subject" element={<ProtectedRoute><AttendanceSubject /></ProtectedRoute>} />
      
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
