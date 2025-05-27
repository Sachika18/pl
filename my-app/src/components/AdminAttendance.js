import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './AdminAttendance.css';
import defaultAvatar from '../assets/avatar.png';
import EmployeeService from './services/EmployeeService';
import { FiCalendar, FiClock, FiSearch, FiFilter, FiDownload, FiRefreshCw, FiUser, FiUsers, FiCheckCircle, FiXCircle } from 'react-icons/fi';
import AdminNavbar from './AdminNavbar';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const AdminAttendance = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [filteredRecords, setFilteredRecords] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterMonth, setFilterMonth] = useState(new Date().getMonth());
  const [filterYear, setFilterYear] = useState(new Date().getFullYear());
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [departments, setDepartments] = useState([]);
  const [departmentStats, setDepartmentStats] = useState([]);
  const [attendanceStats, setAttendanceStats] = useState({
    totalEmployees: 0,
    presentToday: 0,
    absentToday: 0,
    lateToday: 0,
    averageAttendance: 0,
    monthlyStats: {}
  });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [graphData, setGraphData] = useState([]);
  const [calendarData, setCalendarData] = useState({});
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [employeeCalendarData, setEmployeeCalendarData] = useState(null);

  // Fetch employees and attendance data
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch employees
        const employeesData = await EmployeeService.getAllEmployees();
        
        if (employeesData && Array.isArray(employeesData)) {
          // Format employee data
          const formattedEmployees = employeesData.map(emp => ({
            id: emp.id || emp._id || Math.random().toString(36).substring(2, 9),
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
            position: emp.position || emp.jobTitle || 'Employee',
            department: emp.department || 'General',
            employeeId: emp.employeeId || emp.id || 'N/A',
            email: emp.email || '',
            avatar: emp.avatar || null
          }));
          
          setEmployees(formattedEmployees);
          
          // Extract unique departments
          const uniqueDepartments = [...new Set(formattedEmployees.map(emp => emp.department))];
          setDepartments(uniqueDepartments);
          
          // Fetch attendance records
          await fetchAttendanceRecords(formattedEmployees);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Failed to fetch data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Fetch attendance records for all employees
  const fetchAttendanceRecords = async (employeesList) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Create date range for current month
      const startDate = new Date(filterYear, filterMonth, 1);
      const endDate = new Date(filterYear, filterMonth + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Fetch attendance records for all employees
      const response = await fetch(`http://localhost:8080/api/admin/attendance?startDate=${startDateStr}&endDate=${endDateStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      processAttendanceData(data, employeesList);
      
      // Also fetch department statistics
      fetchDepartmentStats(startDateStr, endDateStr);
    } catch (error) {
      console.error('Error fetching attendance records:', error);
      alert('Failed to fetch attendance data. Please try again later.');
    }
  };
  
  // Fetch department attendance statistics
  const fetchDepartmentStats = async (startDateStr, endDateStr) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      const response = await fetch(`http://localhost:8080/api/admin/attendance/department-stats?startDate=${startDateStr}&endDate=${endDateStr}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const data = await response.json();
      setDepartmentStats(data);
    } catch (error) {
      console.error('Error fetching department stats:', error);
    }
  };

  // Process attendance data and calculate statistics
  const processAttendanceData = (data, employeesList) => {
    // Map attendance records to employees
    const records = data.map(record => {
      const employee = employeesList.find(emp => 
        emp.id === record.userId || 
        emp.id === record.employeeId || 
        emp.employeeId === record.employeeId
      ) || {};
      
      // Determine status based on MongoDB Attendance collection
      let status = record.status;
      if (status === 'COMPLETED') {
        status = 'PRESENT';
      } else if (status === 'CHECKED_IN') {
        status = 'PRESENT';
      } else if (status === 'ABSENT' || !record.checkInTime) {
        status = 'ABSENT';
      }
      
      return {
        ...record,
        employeeName: record.employeeName || employee.name || 'Unknown Employee',
        department: record.department || employee.department || 'General',
        position: record.position || employee.position || 'Employee',
        avatar: employee.avatar || null,
        status: status
      };
    });
    
    setAttendanceRecords(records);
    setFilteredRecords(records);
    
    // Calculate statistics
    calculateAttendanceStats(records, employeesList);
    
    // Process data for attendance graph
    prepareAttendanceGraphData(records, employeesList);
  };

  // Calculate attendance statistics
  const calculateAttendanceStats = (records, employeesList) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Count employees present today
    const presentToday = records.filter(record => {
      const recordDate = new Date(record.date || record.checkInTime);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime() && record.status !== 'ABSENT';
    }).length;
    
    // Count late arrivals today
    const lateToday = records.filter(record => {
      const recordDate = new Date(record.date || record.checkInTime);
      recordDate.setHours(0, 0, 0, 0);
      return recordDate.getTime() === today.getTime() && record.status === 'LATE';
    }).length;
    
    // Calculate monthly statistics
    const daysInMonth = new Date(filterYear, filterMonth + 1, 0).getDate();
    const monthlyStats = {};
    
    // Initialize days
    for (let day = 1; day <= daysInMonth; day++) {
      monthlyStats[day] = {
        present: 0,
        absent: 0,
        late: 0,
        total: employeesList.length
      };
    }
    
    // Populate with actual data
    records.forEach(record => {
      const recordDate = new Date(record.date || record.checkInTime);
      const day = recordDate.getDate();
      
      if (recordDate.getMonth() === filterMonth && recordDate.getFullYear() === filterYear) {
        if (record.status === 'PRESENT' || record.status === 'CHECKED_IN' || record.status === 'COMPLETED') {
          monthlyStats[day].present += 1;
        } else if (record.status === 'LATE') {
          monthlyStats[day].late += 1;
          monthlyStats[day].present += 1; // Late is still present
        } else if (record.status === 'ABSENT') {
          monthlyStats[day].absent += 1;
        }
      }
    });
    
    // Calculate average attendance rate
    let totalPresent = 0;
    let totalDays = 0;
    
    Object.values(monthlyStats).forEach(dayStat => {
      if (dayStat.present > 0 || dayStat.absent > 0) {
        totalPresent += dayStat.present;
        totalDays += dayStat.total;
      }
    });
    
    const averageAttendance = totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0;
    
    setAttendanceStats({
      totalEmployees: employeesList.length,
      presentToday,
      absentToday: employeesList.length - presentToday,
      lateToday,
      averageAttendance,
      monthlyStats
    });
  };

  // Generate mock attendance data for testing
  const generateMockAttendanceData = (employeesList, startDate, endDate) => {
    const records = [];
    const workingDays = getWorkingDaysInRange(startDate, endDate);
    
    employeesList.forEach(employee => {
      // Each employee has attendance records for working days
      workingDays.forEach(date => {
        // 80% chance of being present
        const isPresent = Math.random() < 0.8;
        
        if (isPresent) {
          // 20% chance of being late if present
          const isLate = Math.random() < 0.2;
          
          // Generate check-in time (9 AM +/- 1 hour)
          const checkInHour = isLate ? 10 + Math.random() : 8 + Math.random();
          const checkInTime = new Date(date);
          checkInTime.setHours(checkInHour, Math.floor(Math.random() * 60), 0, 0);
          
          // Generate check-out time (5 PM +/- 1 hour)
          const checkOutTime = new Date(date);
          checkOutTime.setHours(16 + Math.random() * 2, Math.floor(Math.random() * 60), 0, 0);
          
          records.push({
            id: `mock-${employee.id}-${date.toISOString()}`,
            userId: employee.id,
            employeeId: employee.employeeId,
            date: date.toISOString(),
            checkInTime: checkInTime.toISOString(),
            checkOutTime: checkOutTime.toISOString(),
            status: isLate ? 'LATE' : 'PRESENT',
            totalHours: (checkOutTime - checkInTime) / (1000 * 60 * 60)
          });
        } else {
          // Absent
          records.push({
            id: `mock-${employee.id}-${date.toISOString()}`,
            userId: employee.id,
            employeeId: employee.employeeId,
            date: date.toISOString(),
            status: 'ABSENT'
          });
        }
      });
    });
    
    return records;
  };

  // Get working days (Mon-Fri) in date range
  const getWorkingDaysInRange = (startDate, endDate) => {
    const days = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dayOfWeek = currentDate.getDay();
      
      // 0 is Sunday, 6 is Saturday
      if (dayOfWeek !== 0 && dayOfWeek !== 6) {
        days.push(new Date(currentDate));
      }
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  };

  // Handle search and filtering
  useEffect(() => {
    let filtered = [...attendanceRecords];
    
    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(record => 
        record.employeeName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.employeeId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        record.department?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    // Filter by department
    if (filterDepartment !== 'all') {
      filtered = filtered.filter(record => record.department === filterDepartment);
    }
    
    setFilteredRecords(filtered);
  }, [searchTerm, filterDepartment, attendanceRecords]);

  // Handle month/year change
  const handleDateFilterChange = async () => {
    await fetchAttendanceRecords(employees);
  };
  
  // Prepare data for attendance graph
  const prepareAttendanceGraphData = (records, employeesList) => {
    // Group records by date
    const recordsByDate = {};
    const employeeCalendar = {};
    
    // Get current date to limit chart
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    // Initialize employee calendar data
    employeesList.forEach(employee => {
      employeeCalendar[employee.id] = {
        employee: employee,
        attendanceByDate: {}
      };
    });
    
    // Process all records
    records.forEach(record => {
      const recordDate = new Date(record.date || record.checkInTime);
      
      // Skip future dates
      if (recordDate > currentDate) return;
      
      const dateKey = recordDate.toISOString().split('T')[0];
      
      // Initialize date in recordsByDate if not exists
      if (!recordsByDate[dateKey]) {
        recordsByDate[dateKey] = {
          date: dateKey,
          present: 0,
          absent: 0,
          total: employeesList.length,
          employeesPresent: 0,
          employeesAbsent: 0
        };
      }
      
      // Update counts based on status - combine LATE into PRESENT
      if (record.status === 'PRESENT' || record.status === 'CHECKED_IN' || 
          record.status === 'COMPLETED' || record.status === 'LATE') {
        recordsByDate[dateKey].present += 1;
        recordsByDate[dateKey].employeesPresent += 1;
      } else if (record.status === 'ABSENT') {
        recordsByDate[dateKey].absent += 1;
        recordsByDate[dateKey].employeesAbsent += 1;
      }
      
      // Update employee calendar data
      const employeeId = record.userId || record.employeeId;
      if (employeeCalendar[employeeId]) {
        employeeCalendar[employeeId].attendanceByDate[dateKey] = {
          status: record.status === 'LATE' ? 'PRESENT' : record.status, // Treat LATE as PRESENT
          checkInTime: record.checkInTime,
          checkOutTime: record.checkOutTime,
          totalHours: record.totalHours
        };
      }
    });
    
    // Convert to array for chart
    const graphDataArray = Object.values(recordsByDate).sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    // Calculate attendance percentage for each date
    graphDataArray.forEach(day => {
      day.presentPercentage = Math.round((day.present / day.total) * 100);
      day.absentPercentage = Math.round((day.absent / day.total) * 100);
      day.displayDate = new Date(day.date).toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
      
      // Add employee count information
      day.presentCount = `${day.employeesPresent} of ${day.total}`;
      day.absentCount = `${day.employeesAbsent} of ${day.total}`;
    });
    
    setGraphData(graphDataArray);
    setCalendarData(employeeCalendar);
  };

  // Handle employee selection for detailed view
  const handleEmployeeSelect = async (employeeId) => {
    try {
      const employee = employees.find(emp => emp.id === employeeId);
      if (!employee) return;
      
      setLoading(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Create date range for selected month
      const startDate = new Date(selectedYear, selectedMonth, 1);
      const endDate = new Date(selectedYear, selectedMonth + 1, 0);
      
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];
      
      // Get attendance records for this employee from current data
      const employeeRecords = attendanceRecords.filter(record => 
        record.userId === employeeId || 
        record.employeeId === employeeId ||
        record.employeeId === employee.employeeId
      );
      
      // Sort records by date
      const sortedRecords = [...employeeRecords].sort((a, b) => {
        const dateA = new Date(a.date || a.checkInTime);
        const dateB = new Date(b.date || b.checkInTime);
        return dateA - dateB;
      });
      
      // Set the selected employee with sorted records
      setSelectedEmployee({
        ...employee,
        attendanceRecords: sortedRecords
      });
      
      // Fetch employee attendance calendar
      try {
        const response = await fetch(
          `http://localhost:8080/api/admin/attendance/employee/${employeeId}?startDate=${startDateStr}&endDate=${endDateStr}`, 
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );
        
        if (response.ok) {
          const data = await response.json();
          
          // Process calendar data
          const calendarDays = {};
          data.days.forEach(day => {
            const date = new Date(day.date);
            calendarDays[date.getDate()] = {
              status: day.status,
              checkInTime: day.checkInTime,
              checkOutTime: day.checkOutTime,
              totalHours: day.totalHours
            };
          });
          
          setEmployeeCalendarData({
            employee: employee,
            days: calendarDays,
            summary: data.summary
          });
        }
      } catch (error) {
        console.error('Error fetching employee calendar:', error);
        // Fall back to existing data if API fails
        const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
        const calendarDays = {};
        
        // Initialize all days
        for (let day = 1; day <= daysInMonth; day++) {
          calendarDays[day] = { status: 'ABSENT' };
        }
        
        // Fill in with available data
        sortedRecords.forEach(record => {
          const recordDate = new Date(record.date || record.checkInTime);
          if (recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear) {
            const day = recordDate.getDate();
            calendarDays[day] = {
              status: record.status,
              checkInTime: record.checkInTime,
              checkOutTime: record.checkOutTime,
              totalHours: record.totalHours
            };
          }
        });
        
        setEmployeeCalendarData({
          employee: employee,
          days: calendarDays
        });
      }
      
      setShowEmployeeModal(true);
    } catch (error) {
      console.error('Error in handleEmployeeSelect:', error);
    } finally {
      setLoading(false);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Calculate attendance percentage for an employee
  const calculateAttendancePercentage = (employeeId) => {
    const employeeRecords = attendanceRecords.filter(record => 
      record.userId === employeeId || 
      record.employeeId === employeeId
    );
    
    if (employeeRecords.length === 0) return 0;
    
    const presentDays = employeeRecords.filter(record => 
      record.status === 'PRESENT' || 
      record.status === 'CHECKED_IN' || 
      record.status === 'COMPLETED' ||
      record.status === 'LATE'
    ).length;
    
    return Math.round((presentDays / employeeRecords.length) * 100);
  };

  // Export attendance data to CSV
  const exportToCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Position', 'Date', 'Check-In', 'Check-Out', 'Status', 'Hours'];
    
    const csvData = filteredRecords.map(record => [
      record.employeeId,
      record.employeeName,
      record.department,
      record.position,
      formatDate(record.date || record.checkInTime),
      formatTime(record.checkInTime),
      formatTime(record.checkOutTime),
      record.status,
      record.totalHours ? record.totalHours.toFixed(2) : '--'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_${filterMonth + 1}_${filterYear}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Refresh attendance data
  const refreshData = async () => {
    setLoading(true);
    await fetchAttendanceRecords(employees);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar onSidebarToggle={() => {}} />
      <div className="admin-attendance-container">
      <header className="admin-attendance-header">
        <div className="header-left">
          <h1>Attendance Management</h1>
          <p>Track and manage employee attendance</p>
        </div>
        <div className="header-right">
          <button className="export-btn" onClick={exportToCSV}>
            <FiDownload /> Export CSV
          </button>
          <button className="refresh-btn" onClick={refreshData}>
            <FiRefreshCw /> Refresh
          </button>
          <button className="back-btn" onClick={() => navigate('/admindash')}>
            Back to Dashboard
          </button>
        </div>
      </header>

      {/* Statistics Cards */}
      <div className="attendance-stats-grid">
        <div className="stat-card">
          <div className="stat-icon present-icon">
            <FiUsers />
          </div>
          <div className="stat-content">
            <h3>Total Employees</h3>
            <p>{attendanceStats.totalEmployees}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon present-icon">
            <FiCheckCircle />
          </div>
          <div className="stat-content">
            <h3>Present Today</h3>
            <p>{attendanceStats.presentToday}</p>
            <span className="stat-percentage">
              {attendanceStats.totalEmployees > 0 
                ? Math.round((attendanceStats.presentToday / attendanceStats.totalEmployees) * 100) 
                : 0}%
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon absent-icon">
            <FiXCircle />
          </div>
          <div className="stat-content">
            <h3>Absent Today</h3>
            <p>{attendanceStats.absentToday}</p>
            <span className="stat-percentage">
              {attendanceStats.totalEmployees > 0 
                ? Math.round((attendanceStats.absentToday / attendanceStats.totalEmployees) * 100) 
                : 0}%
            </span>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon average-icon">
            <FiCalendar />
          </div>
          <div className="stat-content">
            <h3>Average Attendance</h3>
            <p>{attendanceStats.averageAttendance}%</p>
            <span className="stat-period">This Month</span>
          </div>
        </div>
      </div>

      {/* Department Statistics */}
      {departmentStats && departmentStats.length > 0 && (
        <div className="department-stats-container">
          <h2>Department Attendance Statistics</h2>
          <div className="department-stats-chart">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={departmentStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="department" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="attendanceRate" name="Attendance Rate (%)" fill="#4CAF50" />
                <Bar dataKey="totalEmployees" name="Total Employees" fill="#2196F3" />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="department-stats-table">
            <table>
              <thead>
                <tr>
                  <th>Department</th>
                  <th>Employees</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Attendance Rate</th>
                </tr>
              </thead>
              <tbody>
                {departmentStats.map((dept, index) => (
                  <tr key={index}>
                    <td>{dept.department}</td>
                    <td>{dept.totalEmployees}</td>
                    <td>{dept.presentCount}</td>
                    <td>{dept.absentCount}</td>
                    <td>{dept.attendanceRate}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Filters and Search */}
      <div className="attendance-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <FiSearch className="search-icon" />
            <input
              type="text"
              placeholder="Search by name, ID or department..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <div className="filter-box">
            <FiFilter className="filter-icon" />
            <select 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="date-filter-container">
          <div className="month-selector">
            <select 
              value={filterMonth} 
              onChange={(e) => setFilterMonth(parseInt(e.target.value))}
            >
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i} value={i}>
                  {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                </option>
              ))}
            </select>
          </div>
          
          <div className="year-selector">
            <select 
              value={filterYear} 
              onChange={(e) => setFilterYear(parseInt(e.target.value))}
            >
              {Array.from({ length: 5 }, (_, i) => {
                const year = new Date().getFullYear() - 2 + i;
                return <option key={year} value={year}>{year}</option>;
              })}
            </select>
          </div>
          
          <button className="apply-filter-btn" onClick={handleDateFilterChange}>
            Apply
          </button>
        </div>
      </div>

      {/* Attendance Graph */}
      <div className="attendance-graph-container">
        <h2>Attendance Trends</h2>
        <div className="graph-wrapper">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={graphData}
              margin={{
                top: 20,
                right: 30,
                left: 20,
                bottom: 5,
              }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="displayDate" />
              <YAxis label={{ value: 'Percentage (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip 
                formatter={(value, name, props) => {
                  if (name === 'Present') {
                    return [`${value}% (${props.payload.presentCount})`, name];
                  } else if (name === 'Absent') {
                    return [`${value}% (${props.payload.absentCount})`, name];
                  }
                  return [value, name];
                }}
              />
              <Legend />
              <Bar dataKey="presentPercentage" name="Present" fill="#27ae60" />
              <Bar dataKey="absentPercentage" name="Absent" fill="#e74c3c" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Employee List */}
      <div className="employee-list-container">
        <h2>Employees ({employees.length}) - {attendanceStats.presentToday} Present Today</h2>
        <div className="employee-grid">
          {employees.length > 0 ? (
            employees
              .filter(employee => 
                employee.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
                employee.position.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .filter(employee => 
                filterDepartment === 'all' || employee.department === filterDepartment
              )
              .map((employee) => {
                const attendancePercentage = calculateAttendancePercentage(employee.id);
                return (
                  <div 
                    key={employee.id} 
                    className="employee-card" 
                    onClick={() => handleEmployeeSelect(employee.id)}
                  >
                    <div className="employee-card-avatar">
                      <img src={employee.avatar || defaultAvatar} alt={employee.name} />
                      <div 
                        className="attendance-indicator" 
                        style={{ 
                          backgroundColor: attendancePercentage > 90 
                            ? '#27ae60' 
                            : attendancePercentage > 75 
                              ? '#f1c40f' 
                              : '#e74c3c' 
                        }}
                        title={`${attendancePercentage}% attendance`}
                      ></div>
                    </div>
                    <div className="employee-card-info">
                      <h3>{employee.name}</h3>
                      <p className="employee-position">{employee.position}</p>
                      <p className="employee-department">{employee.department}</p>
                      
                      {/* Monthly attendance summary */}
                      {(() => {
                        // Get current month's attendance records
                        const currentMonth = new Date().getMonth();
                        const currentYear = new Date().getFullYear();
                        
                        const monthRecords = attendanceRecords.filter(record => {
                          const recordDate = new Date(record.date || record.checkInTime);
                          return (record.userId === employee.id || record.employeeId === employee.id) && 
                                 recordDate.getMonth() === currentMonth &&
                                 recordDate.getFullYear() === currentYear;
                        });
                        
                        // Count present and absent days
                        const presentDays = monthRecords.filter(record => 
                          record.status === 'PRESENT' || 
                          record.status === 'CHECKED_IN' || 
                          record.status === 'COMPLETED' ||
                          record.status === 'LATE'
                        ).length;
                        
                        const absentDays = monthRecords.filter(record => 
                          record.status === 'ABSENT'
                        ).length;
                        
                        return (
                          <div className="monthly-attendance-summary">
                            <span className="present-days">Present: {presentDays}</span>
                            <span className="absent-days">Absent: {absentDays}</span>
                          </div>
                        );
                      })()}
                      
                      <div className="attendance-percentage-small">
                        <div className="percentage-bar">
                          <div 
                            className="percentage-fill" 
                            style={{ width: `${attendancePercentage}%` }}
                          ></div>
                        </div>
                        <span>{attendancePercentage}%</span>
                      </div>
                    </div>
                  </div>
                );
              })
          ) : (
            <div className="no-employees">
              <p>No employees found.</p>
            </div>
          )}
        </div>
      </div>

      {/* Employee Detail Modal */}
      {showEmployeeModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowEmployeeModal(false)}>
          <div className="employee-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={() => setShowEmployeeModal(false)}>×</button>
            
            <div className="employee-detail-header">
              <div className="employee-avatar-large">
                <img src={selectedEmployee.avatar || defaultAvatar} alt={selectedEmployee.name} />
              </div>
              <div className="employee-basic-info">
                <h2>{selectedEmployee.name}</h2>
                <p className="employee-position">{selectedEmployee.position}</p>
                <p className="employee-department">
                  <span className={`department-badge ${selectedEmployee.department.toLowerCase()}`}>
                    {selectedEmployee.department}
                  </span>
                </p>
                <p className="employee-id">ID: {selectedEmployee.employeeId}</p>
              </div>
              <div className="employee-attendance-summary">
                <div className="attendance-percentage-large">
                  <svg viewBox="0 0 36 36" className="circular-chart">
                    <path className="circle-bg"
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <path className="circle"
                      strokeDasharray={`${calculateAttendancePercentage(selectedEmployee.id)}, 100`}
                      d="M18 2.0845
                        a 15.9155 15.9155 0 0 1 0 31.831
                        a 15.9155 15.9155 0 0 1 0 -31.831"
                    />
                    <text x="18" y="20.35" className="percentage">{calculateAttendancePercentage(selectedEmployee.id)}%</text>
                  </svg>
                  <span>Attendance Rate</span>
                </div>
              </div>
            </div>
            
            <div className="employee-attendance-stats">
              <div className="stat-box">
                <h3>Present Days</h3>
                <p>{selectedEmployee.attendanceRecords.filter(record => 
                  record.status === 'PRESENT' || 
                  record.status === 'CHECKED_IN' || 
                  record.status === 'COMPLETED'
                ).length}</p>
              </div>
              <div className="stat-box">
                <h3>Absent Days</h3>
                <p>{selectedEmployee.attendanceRecords.filter(record => 
                  record.status === 'ABSENT'
                ).length}</p>
              </div>
              <div className="stat-box">
                <h3>Late Arrivals</h3>
                <p>{selectedEmployee.attendanceRecords.filter(record => 
                  record.status === 'LATE'
                ).length}</p>
              </div>
              <div className="stat-box">
                <h3>Avg. Hours</h3>
                <p>
                  {selectedEmployee.attendanceRecords.length > 0 
                    ? (selectedEmployee.attendanceRecords.reduce((sum, record) => 
                        sum + (record.totalHours || 0), 0) / 
                        selectedEmployee.attendanceRecords.filter(record => record.totalHours).length
                      ).toFixed(2)
                    : '--'
                  }
                </p>
              </div>
            </div>
            
            {/* Calendar View */}
            <div className="attendance-calendar-container">
              <div className="calendar-header">
                <h3>Attendance Calendar</h3>
                <div className="calendar-controls">
                  <select 
                    value={selectedMonth} 
                    onChange={(e) => {
                      const newMonth = parseInt(e.target.value);
                      setSelectedMonth(newMonth);
                      if (selectedEmployee) {
                        handleEmployeeSelect(selectedEmployee.id);
                      }
                    }}
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i} value={i}>
                        {new Date(2000, i, 1).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <select 
                    value={selectedYear} 
                    onChange={(e) => {
                      const newYear = parseInt(e.target.value);
                      setSelectedYear(newYear);
                      if (selectedEmployee) {
                        handleEmployeeSelect(selectedEmployee.id);
                      }
                    }}
                  >
                    {Array.from({ length: 5 }, (_, i) => {
                      const year = new Date().getFullYear() - 2 + i;
                      return <option key={year} value={year}>{year}</option>;
                    })}
                  </select>
                </div>
              </div>
              
              <div className="calendar-grid">
                {/* Calendar header - days of week */}
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-day-header">{day}</div>
                ))}
                
                {/* Calendar days */}
                {(() => {
                  const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                  const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
                  
                  // Create array for all days in the month
                  const days = [];
                  
                  // Add empty cells for days before the first day of the month
                  for (let i = 0; i < firstDayOfMonth; i++) {
                    days.push(<div key={`empty-${i}`} className="calendar-day empty"></div>);
                  }
                  
                  // Add days of the month
                  for (let day = 1; day <= daysInMonth; day++) {
                    const date = new Date(selectedYear, selectedMonth, day);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    // Get attendance data for this day
                    let dayData = null;
                    
                    // First try to get from the API calendar data if available
                    if (employeeCalendarData && employeeCalendarData.days && employeeCalendarData.days[day]) {
                      dayData = employeeCalendarData.days[day];
                    } else {
                      // Fall back to the attendance records if API data not available
                      const record = selectedEmployee.attendanceRecords.find(rec => {
                        const recordDate = new Date(rec.date || rec.checkInTime);
                        return recordDate.toISOString().split('T')[0] === dateStr;
                      });
                      
                      if (record) {
                        dayData = {
                          status: record.status,
                          checkInTime: record.checkInTime,
                          checkOutTime: record.checkOutTime,
                          totalHours: record.totalHours
                        };
                      }
                    }
                    
                    let statusClass = 'no-record';
                    let statusText = '';
                    let checkInTime = null;
                    let checkOutTime = null;
                    let totalHours = null;
                    
                    if (dayData) {
                      // Treat LATE as PRESENT for consistency
                      if (dayData.status === 'PRESENT' || dayData.status === 'CHECKED_IN' || 
                          dayData.status === 'COMPLETED' || dayData.status === 'LATE') {
                        statusClass = 'present';
                        statusText = 'Present';
                      } else if (dayData.status === 'ABSENT') {
                        statusClass = 'absent';
                        statusText = 'Absent';
                      }
                      
                      checkInTime = dayData.checkInTime;
                      checkOutTime = dayData.checkOutTime;
                      totalHours = dayData.totalHours;
                    } else {
                      // If no record and date is in the past, mark as absent
                      const today = new Date();
                      today.setHours(0, 0, 0, 0);
                      
                      if (date < today && date.getDay() !== 0 && date.getDay() !== 6) { // Not weekend
                        statusClass = 'absent';
                        statusText = 'Absent';
                      }
                    }
                    
                    // Add weekend class for Saturday and Sunday
                    if (date.getDay() === 0 || date.getDay() === 6) {
                      statusClass += ' weekend';
                    }
                    
                    // Create tooltip content with more details
                    let tooltipContent = `${day}: ${statusText}`;
                    if (checkInTime) {
                      tooltipContent += `\nCheck-in: ${formatTime(checkInTime)}`;
                    }
                    if (checkOutTime) {
                      tooltipContent += `\nCheck-out: ${formatTime(checkOutTime)}`;
                    }
                    if (totalHours) {
                      tooltipContent += `\nHours: ${totalHours.toFixed(2)}`;
                    }
                    
                    days.push(
                      <div 
                        key={day} 
                        className={`calendar-day ${statusClass}`}
                        title={tooltipContent}
                      >
                        <span className="day-number">{day}</span>
                        {statusText && (
                          <div className="status-indicator">
                            {statusClass === 'present' ? '✓' : statusClass === 'absent' ? '✗' : ''}
                          </div>
                        )}
                      </div>
                    );
                  }
                  
                  return days;
                })()}
              </div>
              
              <div className="calendar-summary">
                <h4>Monthly Summary</h4>
                <div className="summary-stats">
                  {(() => {
                    // Calculate monthly stats
                    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
                    let presentDays = 0;
                    let absentDays = 0;
                    let workingDays = 0;
                    
                    // Count working days (excluding weekends)
                    for (let day = 1; day <= daysInMonth; day++) {
                      const date = new Date(selectedYear, selectedMonth, day);
                      // Skip weekends (0 = Sunday, 6 = Saturday)
                      if (date.getDay() !== 0 && date.getDay() !== 6) {
                        workingDays++;
                      }
                    }
                    
                    // Count present/absent days from calendar data
                    if (employeeCalendarData && employeeCalendarData.days) {
                      Object.entries(employeeCalendarData.days).forEach(([day, data]) => {
                        if (data.status === 'PRESENT' || data.status === 'CHECKED_IN' || 
                            data.status === 'COMPLETED' || data.status === 'LATE') {
                          presentDays++;
                        } else if (data.status === 'ABSENT') {
                          absentDays++;
                        }
                      });
                    } else {
                      // Fall back to attendance records
                      selectedEmployee.attendanceRecords.forEach(record => {
                        const recordDate = new Date(record.date || record.checkInTime);
                        if (recordDate.getMonth() === selectedMonth && recordDate.getFullYear() === selectedYear) {
                          if (record.status === 'PRESENT' || record.status === 'CHECKED_IN' || 
                              record.status === 'COMPLETED' || record.status === 'LATE') {
                            presentDays++;
                          } else if (record.status === 'ABSENT') {
                            absentDays++;
                          }
                        }
                      });
                    }
                    
                    // Calculate attendance rate
                    const attendanceRate = workingDays > 0 ? Math.round((presentDays / workingDays) * 100) : 0;
                    
                    return (
                      <div className="monthly-stats-grid">
                        <div className="monthly-stat-box">
                          <h5>Working Days</h5>
                          <p>{workingDays}</p>
                        </div>
                        <div className="monthly-stat-box">
                          <h5>Present</h5>
                          <p>{presentDays}</p>
                        </div>
                        <div className="monthly-stat-box">
                          <h5>Absent</h5>
                          <p>{absentDays}</p>
                        </div>
                        <div className="monthly-stat-box">
                          <h5>Attendance Rate</h5>
                          <p>{attendanceRate}%</p>
                        </div>
                      </div>
                    );
                  })()}
                </div>
                
                <div className="calendar-legend">
                  <div className="legend-item">
                    <div className="legend-color present-color"></div>
                    <span>Present</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color absent-color"></div>
                    <span>Absent</span>
                  </div>
                  <div className="legend-item">
                    <div className="legend-color weekend-color"></div>
                    <span>Weekend</span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Attendance Trend */}
            <div className="employee-trend-container">
              <h3>Attendance Trend</h3>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart
                  data={selectedEmployee.attendanceRecords
                    .filter(record => {
                      const recordDate = new Date(record.date || record.checkInTime);
                      return recordDate.getMonth() === selectedMonth && 
                             recordDate.getFullYear() === selectedYear;
                    })
                    .sort((a, b) => new Date(a.date || a.checkInTime) - new Date(b.date || b.checkInTime))
                    .map(record => {
                      const recordDate = new Date(record.date || record.checkInTime);
                      return {
                        date: recordDate.getDate(),
                        displayDate: recordDate.toLocaleDateString('en-US', { day: 'numeric' }),
                        hours: record.totalHours || 0,
                        status: record.status
                      };
                    })}
                  margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="displayDate" />
                  <YAxis label={{ value: 'Hours', angle: -90, position: 'insideLeft' }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="hours" stroke="#3498db" activeDot={{ r: 8 }} name="Work Hours" />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminAttendance;