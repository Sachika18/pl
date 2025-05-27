import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './components/LoginPage';
import SignupPage from './components/SignupPage';
import Dashboard from './components/Dashboard';
import Leave from './components/Leave';
import ProtectedRoute from './components/ProtectedRoute';
import Attendance from './components/Attendance';
import Profile from './components/Profile';
import './App.css';
import Tasks from './components/Tasks';
import Calendar from './components/Calendar';
import Documents from './components/Documents';
import EnhancedNotifications from './components/EnhancedNotifications';
import AdminDash from './components/admindash';
import AdminTaskPage from './components/Admintask';
import AdminLeaveManagement from './components/AdminLeaveManagement';
import AdminDocuments from './components/AdminDocuments';
import Settings from './components/Settings';
import Employee from './components/Employee';
import AdminAttendance from './components/AdminAttendance';
import Chat from './components/Chat/Chat';
  
function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/tasks" element={<Tasks />} />
        <Route path="/calendar" element={<Calendar />} />
        <Route path="/documents" element={<Documents />} />
        <Route path="/chat" element={<Chat />} />
        <Route path="/admindash" element={<AdminDash />} />
        <Route path="/admintask" element={<AdminTaskPage/>} />
        <Route path="/admin/leaves" element={<AdminLeaveManagement />} />
        <Route path="/admin/documents" element={<AdminDocuments />} />
        <Route path="/admin/profile" element={<Profile />} />
        <Route path="/admin/employees" element={<Employee />} />
        <Route path="/admin/attendance" element={<AdminAttendance />} />
        <Route path="/admin/settings" element={<Settings />} />
        <Route path="/admin/chat" element={<Chat />} />
        <Route path="/enhancednotifications" element={<EnhancedNotifications />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App; 