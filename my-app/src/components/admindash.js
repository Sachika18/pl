import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import './AdminDash.css'; // Make sure to create this CSS file
import defaultAvatar from '../assets/avatar.png';
import MobileMenu from './MobileMenu';
import AnnouncementForm from './AnnouncementForm';
import TaskService from './services/TaskService';
import EmployeeService from './services/EmployeeService';
import DocumentService from './services/DocumentService';

const AdminDash = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [showAnnouncementForm, setShowAnnouncementForm] = useState(false);
  const [showAllAnnouncements, setShowAllAnnouncements] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [departmentStats, setDepartmentStats] = useState({
    hr: { headcount: 0, attendance: 0, tasks: 0 },
    tech: { headcount: 0, attendance: 0, tasks: 0 },
    finance: { headcount: 0, attendance: 0, tasks: 0 },
    marketing: { headcount: 0, attendance: 0, tasks: 0 }
  });
  const [systemStats, setSystemStats] = useState({
    totalEmployees: 0,
    activeNow: 0,
    completedTasks: 0,
    ongoingTasks: 0,
    newTasks: 0,
    tasksDueSoon: 0,
    overdueTasks: 0,
    newEmployees: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  // Toggle sidebar for mobile
  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Close sidebar on route change or screen resize
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 768) {
        setSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location]);
  
  // Fetch announcements when admin data changes
  useEffect(() => {
    if (admin) {
      console.log('Admin data updated, fetching announcements...', {
        adminId: admin.id,
        adminName: `${admin.firstName} ${admin.lastName}`,
        adminDepartment: admin.department,
        adminRole: admin.role
      });
      fetchAnnouncements();
    }
  }, [admin]); // eslint-disable-line react-hooks/exhaustive-deps

  // Update the current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Fetch announcements
  const fetchAnnouncements = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }
      
      // Fetch announcements from API
      const response = await fetch('http://localhost:8080/api/announcements', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch announcements');
      }
      
      const data = await response.json();
      
      // Sort announcements by creation date (newest first)
      const sortedAnnouncements = data.sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );
      
      // Filter announcements based on admin's department
      const userDepartment = admin?.department?.toLowerCase() || '';
      console.log('Admin department:', userDepartment);
      
      // Log all announcements and their target departments
      console.log('All announcements:', sortedAnnouncements.map(a => ({
        title: a.title,
        targetDepartments: a.targetDepartments
      })));
      
      const filteredAnnouncements = sortedAnnouncements.filter(announcement => {
        // Log each announcement's target departments for debugging
        console.log(`Announcement "${announcement.title}" targets:`, announcement.targetDepartments);
        
        // Include announcements targeted to all departments
        if (announcement.targetDepartments.includes('all')) {
          console.log(`Announcement "${announcement.title}" included: targets all departments`);
          return true;
        }
        
        // Include announcements targeted to the admin's department (case-insensitive comparison)
        if (userDepartment && announcement.targetDepartments.some(dept => 
          dept.toLowerCase() === userDepartment.toLowerCase()
        )) {
          console.log(`Announcement "${announcement.title}" included: targets admin's department (${userDepartment})`);
          return true;
        }
        
        // Log the mismatch for debugging
        if (userDepartment) {
          console.log(`Department comparison failed for "${announcement.title}":`, {
            adminDepartment: userDepartment,
            targetDepartments: announcement.targetDepartments.map(d => d.toLowerCase()),
            matches: announcement.targetDepartments.map(d => d.toLowerCase() === userDepartment.toLowerCase())
          });
        }
        
        // If admin has no department but is an admin, show all announcements
        if (!userDepartment && admin?.role === 'admin') {
          console.log(`Announcement "${announcement.title}" included: admin has no department but is an admin`);
          return true;
        }
        
        console.log(`Announcement "${announcement.title}" excluded: not relevant to admin's department (${userDepartment})`);
        return false;
      });
      
      console.log('Filtered announcements:', filteredAnnouncements.length);
      setAnnouncements(filteredAnnouncements);
      
    } catch (error) {
      console.error('Error fetching announcements:', error);
      // If API fails, use mock data and filter based on admin's department
      const mockAnnouncements = [
        {
          _id: '1',
          title: 'Company Meeting',
          content: 'There will be a company-wide meeting on Friday at 3 PM in the main conference room.',
          priority: 'high',
          createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          targetDepartments: ['all'],
          createdBy: 'Admin'
        },
        {
          _id: '2',
          title: 'New Project Launch',
          content: 'We are excited to announce the launch of our new project "Phoenix". More details will be shared soon.',
          priority: 'normal',
          createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          targetDepartments: ['Technology', 'Marketing'],
          createdBy: 'Admin'
        },
        {
          _id: '3',
          title: 'Office Closure',
          content: 'The office will be closed on Monday for maintenance. Please work from home.',
          priority: 'urgent',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          targetDepartments: ['all'],
          createdBy: 'Admin'
        },
        {
          _id: '4',
          title: 'HR Department Update',
          content: 'New HR policies will be effective from next month. Please review the attached documents.',
          priority: 'normal',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
          targetDepartments: ['HR'],
          createdBy: 'Admin'
        },
        {
          _id: '5',
          title: 'Finance Department Meeting',
          content: 'Quarterly budget review meeting on Thursday at 2 PM.',
          priority: 'high',
          createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          targetDepartments: ['Finance'],
          createdBy: 'Admin'
        }
      ];
      
      // Filter mock announcements based on admin's department
      const userDepartment = admin?.department?.toLowerCase() || '';
      console.log('Admin department (mock):', userDepartment);
      
      // Log all mock announcements and their target departments
      console.log('All mock announcements:', mockAnnouncements.map(a => ({
        title: a.title,
        targetDepartments: a.targetDepartments
      })));
      
      const filteredMockAnnouncements = mockAnnouncements.filter(announcement => {
        // Log each announcement's target departments for debugging
        console.log(`Mock announcement "${announcement.title}" targets:`, announcement.targetDepartments);
        
        // Include announcements targeted to all departments
        if (announcement.targetDepartments.includes('all')) {
          console.log(`Mock announcement "${announcement.title}" included: targets all departments`);
          return true;
        }
        
        // Include announcements targeted to the admin's department (case-insensitive comparison)
        if (userDepartment && announcement.targetDepartments.some(dept => 
          dept.toLowerCase() === userDepartment.toLowerCase()
        )) {
          console.log(`Mock announcement "${announcement.title}" included: targets admin's department (${userDepartment})`);
          return true;
        }
        
        // Log the mismatch for debugging
        if (userDepartment) {
          console.log(`Department comparison failed for mock "${announcement.title}":`, {
            adminDepartment: userDepartment,
            targetDepartments: announcement.targetDepartments.map(d => d.toLowerCase()),
            matches: announcement.targetDepartments.map(d => d.toLowerCase() === userDepartment.toLowerCase())
          });
        }
        
        // If admin has no department but is an admin, show all announcements
        if (!userDepartment && admin?.role === 'admin') {
          console.log(`Mock announcement "${announcement.title}" included: admin has no department but is an admin`);
          return true;
        }
        
        console.log(`Mock announcement "${announcement.title}" excluded: not relevant to admin's department (${userDepartment})`);
        return false;
      });
      
      console.log('Filtered mock announcements:', filteredMockAnnouncements.length);
      setAnnouncements(filteredMockAnnouncements);
    }
  };

  // Fetch system statistics
  const fetchSystemStats = async () => {
    try {
      console.log('AdminDash: Fetching system statistics');
      
      // Get employee statistics
      const employeeStats = await EmployeeService.getEmployeeStats();
      console.log('AdminDash: Employee statistics:', employeeStats);
      
      // Get task statistics
      const taskStats = await TaskService.getAdminTaskStats();
      console.log('AdminDash: Task statistics:', taskStats);
      
      // Get attendance statistics from API
      let attendanceStats = {
        totalEmployees: 0,
        presentToday: 0,
        absentToday: 0,
        lateToday: 0,
        averageAttendance: 0
      };
      
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await fetch('http://localhost:8080/api/attendance/stats', {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (response.ok) {
            const data = await response.json();
            attendanceStats = data;
          }
        }
      } catch (attendanceError) {
        console.error('Error fetching attendance stats:', attendanceError);
      }
      
      // Update system stats with real data
      setSystemStats({
        totalEmployees: employeeStats.totalEmployees || 0,
        activeNow: attendanceStats.presentToday || 0,
        completedTasks: taskStats.completedTasks || 0,
        ongoingTasks: taskStats.ongoingTasks || 0,
        newTasks: taskStats.newTasks || 0,
        tasksDueSoon: taskStats.tasksDueSoon || 0,
        overdueTasks: taskStats.overdueTasks || 0,
        newEmployees: employeeStats.newEmployees || 0,
        presentToday: attendanceStats.presentToday || 0,
        absentToday: attendanceStats.absentToday || 0,
        lateToday: attendanceStats.lateToday || 0,
        averageAttendance: attendanceStats.averageAttendance || 0
      });
      
      console.log('AdminDash: Updated system statistics with attendance data');
    } catch (error) {
      console.error('AdminDash: Error fetching system statistics:', error);
    }
  };
  
  // Fetch document activities
  const fetchDocumentActivities = async () => {
    try {
      console.log('AdminDash: Fetching document activities');
      
      // Create an instance of DocumentService
      const documentService = new DocumentService();
      
      // Get activities from DocumentService
      const response = await documentService.getAllActivities();
      
      if (response && response.data) {
        // Format activities for display
        const formattedActivities = response.data.map(activity => ({
          id: activity.id || activity._id || Math.random().toString(36).substring(2, 9),
          type: 'document',
          user: activity.userName || activity.user || 'Unknown User',
          timestamp: new Date(activity.timestamp || activity.createdAt || Date.now()),
          details: activity.description || activity.action || 'Performed an action on a document',
          documentName: activity.documentName || activity.document || 'Unknown Document'
        }));
        
        setRecentActivity(formattedActivities);
        console.log('AdminDash: Updated document activities with real data:', formattedActivities);
      } else {
        throw new Error('No activities data returned');
      }
    } catch (error) {
      console.error('AdminDash: Error fetching document activities:', error);
      
      // Try to get activities from localStorage directly as a fallback
      try {
        const localActivities = localStorage.getItem('document_activities');
        if (localActivities) {
          const parsedActivities = JSON.parse(localActivities);
          
          if (Array.isArray(parsedActivities) && parsedActivities.length > 0) {
            // Format activities from localStorage
            const formattedLocalActivities = parsedActivities.map(activity => ({
              id: activity.id || activity._id || Math.random().toString(36).substring(2, 9),
              type: 'document',
              user: activity.userName || activity.user || 'Unknown User',
              timestamp: new Date(activity.timestamp || activity.createdAt || Date.now()),
              details: activity.description || activity.action || 'Performed an action on a document',
              documentName: activity.documentName || activity.document || 'Unknown Document'
            }));
            
            setRecentActivity(formattedLocalActivities);
            console.log('AdminDash: Using localStorage document activities:', formattedLocalActivities);
            return;
          }
        }
      } catch (localError) {
        console.error('AdminDash: Error parsing localStorage activities:', localError);
      }
      
      // Use mock data as a last resort
      const mockActivities = [
        { 
          id: 1, 
          type: 'document', 
          user: 'John Doe', 
          timestamp: new Date(new Date().setHours(new Date().getHours() - 1)),
          details: 'Uploaded a new document: Q2 Financial Report',
          documentName: 'Q2 Financial Report.pdf'
        },
        { 
          id: 2, 
          type: 'document', 
          user: 'Sarah Smith', 
          timestamp: new Date(new Date().setHours(new Date().getHours() - 2)),
          details: 'Downloaded Employee Handbook',
          documentName: 'Employee Handbook.pdf'
        },
        { 
          id: 3, 
          type: 'document', 
          user: 'Mike Johnson', 
          timestamp: new Date(new Date().setHours(new Date().getHours() - 3)),
          details: 'Shared Project Proposal with Marketing team',
          documentName: 'Project Proposal.docx'
        },
        { 
          id: 4, 
          type: 'document', 
          user: 'Emily Davis', 
          timestamp: new Date(new Date().setHours(new Date().getHours() - 4)),
          details: 'Updated Company Policy document',
          documentName: 'Company Policy.pdf'
        }
      ];
      
      setRecentActivity(mockActivities);
      console.log('AdminDash: Using mock document activities as last resort');
    }
  };
  
  // Fetch employees and calculate department statistics
  const fetchEmployees = async () => {
    try {
      console.log('AdminDash: Fetching employees');
      
      // Get all employees
      const allEmployees = await EmployeeService.getAllEmployees();
      console.log('AdminDash: Employees data:', allEmployees);
      
      if (allEmployees && Array.isArray(allEmployees) && allEmployees.length > 0) {
        // Format employee data
        const formattedEmployees = allEmployees.map(emp => ({
          id: emp.id || emp._id || Math.random().toString(36).substring(2, 9),
          name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
          position: emp.position || emp.jobTitle || 'Employee',
          department: emp.department || 'General',
          status: emp.status || (Math.random() > 0.7 ? 'online' : Math.random() > 0.5 ? 'away' : 'offline'),
          employeeId: emp.employeeId || emp.id || 'N/A',
          email: emp.email || '',
          avatar: emp.avatar || null
        }));
        
        setEmployees(formattedEmployees);
        console.log('AdminDash: Updated employees with real data');
        
        // Calculate department statistics
        const deptCounts = {
          hr: { headcount: 0, attendance: 0, tasks: 0 },
          tech: { headcount: 0, attendance: 0, tasks: 0 },
          finance: { headcount: 0, attendance: 0, tasks: 0 },
          marketing: { headcount: 0, attendance: 0, tasks: 0 }
        };
        
        // Count employees by department
        formattedEmployees.forEach(emp => {
          const dept = emp.department.toLowerCase();
          if (dept.includes('hr') || dept.includes('human')) {
            deptCounts.hr.headcount++;
          } else if (dept.includes('tech') || dept.includes('it') || dept.includes('development')) {
            deptCounts.tech.headcount++;
          } else if (dept.includes('finance') || dept.includes('accounting')) {
            deptCounts.finance.headcount++;
          } else if (dept.includes('marketing') || dept.includes('sales')) {
            deptCounts.marketing.headcount++;
          }
        });
        
        // Get attendance data for departments
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const response = await fetch('http://localhost:8080/api/attendance/department-stats', {
              method: 'GET',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (response.ok) {
              const data = await response.json();
              
              // Update attendance rates if available
              if (data.hr) deptCounts.hr.attendance = data.hr.attendanceRate || 0;
              if (data.tech) deptCounts.tech.attendance = data.tech.attendanceRate || 0;
              if (data.finance) deptCounts.finance.attendance = data.finance.attendanceRate || 0;
              if (data.marketing) deptCounts.marketing.attendance = data.marketing.attendanceRate || 0;
            }
          }
        } catch (error) {
          console.error('Error fetching department attendance stats:', error);
          
          // Set some reasonable attendance rates as fallback
          deptCounts.hr.attendance = 95;
          deptCounts.tech.attendance = 92;
          deptCounts.finance.attendance = 97;
          deptCounts.marketing.attendance = 90;
        }
        
        // Get task data for departments
        try {
          const taskStats = await TaskService.getDepartmentTaskStats();
          
          if (taskStats) {
            if (taskStats.hr) deptCounts.hr.tasks = taskStats.hr.totalTasks || 0;
            if (taskStats.tech) deptCounts.tech.tasks = taskStats.tech.totalTasks || 0;
            if (taskStats.finance) deptCounts.finance.tasks = taskStats.finance.totalTasks || 0;
            if (taskStats.marketing) deptCounts.marketing.tasks = taskStats.marketing.totalTasks || 0;
          }
        } catch (error) {
          console.error('Error fetching department task stats:', error);
          
          // Set some reasonable task counts as fallback
          deptCounts.hr.tasks = Math.round(deptCounts.hr.headcount * 2.5);
          deptCounts.tech.tasks = Math.round(deptCounts.tech.headcount * 2.5);
          deptCounts.finance.tasks = Math.round(deptCounts.finance.headcount * 2.5);
          deptCounts.marketing.tasks = Math.round(deptCounts.marketing.headcount * 2.5);
        }
        
        // Update department stats
        setDepartmentStats(deptCounts);
      } else {
        // Fallback to mock data
        console.log('AdminDash: No employee data found, using mock data');
        setEmployees([
          { id: 1, name: 'John Doe', position: 'Frontend Developer', department: 'Tech', status: 'online', employeeId: '1A002' },
          { id: 2, name: 'Sarah Smith', position: 'HR Manager', department: 'HR', status: 'online', employeeId: '1A003' },
          { id: 3, name: 'Mike Johnson', position: 'UI/UX Designer', department: 'Tech', status: 'away', employeeId: '1A004' },
          { id: 4, name: 'Emily Davis', position: 'Product Manager', department: 'Marketing', status: 'offline', employeeId: '1A005' },
          { id: 5, name: 'David Wilson', position: 'Accountant', department: 'Finance', status: 'online', employeeId: '1A006' },
          { id: 6, name: 'Jennifer Lee', position: 'Backend Developer', department: 'Tech', status: 'online', employeeId: '1A007' },
          { id: 7, name: 'Robert Brown', position: 'DevOps Engineer', department: 'Tech', status: 'away', employeeId: '1A008' },
          { id: 8, name: 'Lisa Wang', position: 'Data Analyst', department: 'Tech', status: 'online', employeeId: '1A009' }
        ]);
      }
    } catch (error) {
      console.error('AdminDash: Error fetching employees:', error);
      
      // Fallback to mock data
      setEmployees([
        { id: 1, name: 'John Doe', position: 'Frontend Developer', department: 'Tech', status: 'online', employeeId: '1A002' },
        { id: 2, name: 'Sarah Smith', position: 'HR Manager', department: 'HR', status: 'online', employeeId: '1A003' },
        { id: 3, name: 'Mike Johnson', position: 'UI/UX Designer', department: 'Tech', status: 'away', employeeId: '1A004' },
        { id: 4, name: 'Emily Davis', position: 'Product Manager', department: 'Marketing', status: 'offline', employeeId: '1A005' },
        { id: 5, name: 'David Wilson', position: 'Accountant', department: 'Finance', status: 'online', employeeId: '1A006' },
        { id: 6, name: 'Jennifer Lee', position: 'Backend Developer', department: 'Tech', status: 'online', employeeId: '1A007' },
        { id: 7, name: 'Robert Brown', position: 'DevOps Engineer', department: 'Tech', status: 'away', employeeId: '1A008' },
        { id: 8, name: 'Lisa Wang', position: 'Data Analyst', department: 'Tech', status: 'online', employeeId: '1A009' }
      ]);
    }
  };

  // Fetch admin info from the backend
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        console.log('Token:', token ? token.substring(0, 20) + '...' : 'No token'); // Only log part of the token for security
        
        // Fetch system statistics
        await fetchSystemStats();
        
        // Fetch employees
        await fetchEmployees();
        
        // Fetch document activities
        await fetchDocumentActivities();

        const response = await fetch('http://localhost:8080/api/dashboard', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          // Log detailed error information
          const errorData = await response.text();
          console.error('Server response:', response.status, errorData);
          
          if (response.status === 500) {
            setError('Internal server error. Please try again later.');
          } else if (response.status === 403) {
            localStorage.removeItem('token');
            navigate('/login');
          } else {
            setError(`Error: ${response.status}`);
          }
          return;
        }

        const data = await response.json();
        console.log("Admin data received:", data);
        console.log("Admin name:", data.firstName, data.lastName);
        console.log("Employee ID:", data.employeeId);
        console.log("Department:", data.department || 'Not specified');
        
        // Ensure department is set (convert to lowercase for consistency)
        const adminData = {
          ...data,
          department: data.department ? data.department.toLowerCase() : '',
          role: data.role || 'admin' // Ensure role is set
        };
        
        setAdmin(adminData);
        
        // We already fetched employees data above, no need to set hardcoded values here
        
      } catch (error) {
        console.error('Error details:', error);
        setError('Unable to connect to the server. Please check your connection.');
        
        // Set mock admin data as fallback
        setAdmin({
          id: 'mock-admin-1',
          firstName: 'Admin',
          lastName: 'User',
          email: 'admin@example.com',
          position: 'Administrator',
          employeeId: '1A001',
          department: 'admin',
          role: 'admin',
          avatar: null
        });
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
    
    // In a real app, you would fetch all these data from your API
  }, [navigate]);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading admin dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-container">
      {/* Sidebar - with mobile toggle class */}
      <aside className={`sidebar admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="logo">
          <h2 style={{ fontSize: '1.5rem', whiteSpace: 'nowrap' }}>WorkLine</h2>
          <span className="admin-badge">Admin</span>
        </div>
        <nav>
          <ul>
            <li className={location.pathname === '/admin' ? 'active' : ''}>
              <span className="menu-icon">🏠</span> Dashboard
            </li>
            <li>
              <Link to="/admin/employees" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">👥</span> Employees
              </Link>
            </li>

            <li>
              <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📅</span> Attendance
              </Link>
            </li>
            <li>
              <Link to="/admin/leaves" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">🗓️</span> Leave Management
              </Link>
            </li>
            <li>
              <Link to="/admintask" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">✓</span> Tasks
              </Link>
            </li>
            <li>
              <Link to="/admin/documents" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">📄</span> Documents
              </Link>
            </li>
            
            <li>
              <Link to="/admin/chat" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">💬</span> Chat
              </Link>
            </li>

            <li>
              <Link to="/admin/settings" style={{ color: 'inherit', textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                <span className="menu-icon">⚙️</span> Settings
              </Link>
            </li>
          </ul>
        </nav>
        <div className="sidebar-footer">
          <button className="logout-button" onClick={() => {
            localStorage.removeItem('token');
            navigate('/login');
          }}>
            <span className="menu-icon">🚪</span> Logout
          </button>
        </div>
      </aside>

      {/* Mobile menu toggle button - only visible on mobile */}
      <MobileMenu toggleSidebar={toggleSidebar} />

      {/* Main Content */}
      <main className="main-content admin-main">
        {/* Header */}
        <header className="admin-header">
          <div className="current-time">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            <div className="date-display">
              {currentTime.toLocaleDateString([], { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </div>
          </div>
          
          
          <div className="user-profile">
            <Link to="/admin/notifications" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div className="notification-bell">
                <span className="notification-icon">🔔</span>
                <span className="notification-badge">7</span>
              </div>
            </Link>
            <div className="user-info">
              <span>{admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Admin User'}</span>
              <div className="user-details">
                <span className="role-badge admin-role">Administrator</span>
                <span className="employee-id-badge">{admin?.employeeId || 'ID: Not assigned'}</span>
              </div>
            </div>
            <img 
              onClick={() => navigate('/admin/profile')}
              src={admin?.avatar || defaultAvatar} 
              alt="Admin avatar" 
              className="avatar" 
            />
          </div>
        </header>

        {/* Welcome Section */}
        <section className="welcome-section admin-welcome">
          <div className="welcome-text">
            <h1>Welcome back, {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Admin'}!</h1>
            <p className="employee-id-welcome">Employee ID: {admin?.employeeId || 'Not assigned'}</p>
            <p>Here's your administrative overview for today.</p>
          </div>
          
          <div className="admin-actions">
            <button 
              className="admin-action-button"
              onClick={() => {
                setShowAnnouncementForm(!showAnnouncementForm);
                if (!showAnnouncementForm) {
                  // Scroll to the announcement form
                  setTimeout(() => {
                    document.getElementById('announcement-section').scrollIntoView({ behavior: 'smooth' });
                  }, 100);
                }
              }}
            >
              <span className="action-icon">✉️</span>
              {showAnnouncementForm ? 'Hide Announcement Form' : 'Send Announcement'}
            </button>
          </div>
        </section>

        {/* Announcements Section */}
        <section className="announcements-section">
          <div className="section-header">
            <h2>Announcements</h2>
            <button onClick={() => setShowAllAnnouncements(!showAllAnnouncements)}>
              {showAllAnnouncements ? 'Show Less' : 'View All'}
            </button>
          </div>
          
          <div className="announcements-container">
            {announcements.length > 0 ? (
              (showAllAnnouncements ? announcements : announcements.slice(0, 3)).map(announcement => (
                <div 
                  key={announcement._id} 
                  className={`announcement-card priority-${announcement.priority}`}
                >
                  <div className="announcement-header">
                    <h3>{announcement.title}</h3>
                    <div className="announcement-meta">
                      <span className="announcement-date">
                        {new Date(announcement.createdAt).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                      <span className={`priority-badge ${announcement.priority}`}>
                        {announcement.priority.charAt(0).toUpperCase() + announcement.priority.slice(1)}
                      </span>
                    </div>
                  </div>
                  
                  <div className="announcement-content">
                    <p>{announcement.content}</p>
                  </div>
                  
                  <div className="announcement-footer">
                    <div className="target-departments">
                      {announcement.targetDepartments.includes('all') ? (
                        <span className="department-tag all">All Departments</span>
                      ) : (
                        announcement.targetDepartments.map(dept => (
                          <span key={dept} className={`department-tag ${dept.toLowerCase()}`}>
                            {dept}
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="no-announcements">
                <p>No announcements available.</p>
                <button 
                  onClick={() => {
                    setShowAnnouncementForm(true);
                    setTimeout(() => {
                      document.getElementById('announcement-section').scrollIntoView({ behavior: 'smooth' });
                    }, 100);
                  }}
                >
                  Create Announcement
                </button>
              </div>
            )}
          </div>
        </section>

        {/* Announcement Form */}
        {showAnnouncementForm && (
          <section id="announcement-section">
            <AnnouncementForm 
              onAnnouncementPosted={fetchAnnouncements} 
              adminDepartment={admin?.department || 'admin'}
            />
          </section>
        )}

        {/* Department Stats */}
        <section className="department-stats-section">
          <div className="section-header">
            <h2>Department Statistics</h2>
            <button>View All</button>
          </div>
          
          <div className="department-stats-grid">
            <div className="department-card">
              <div className="department-header">
                <h3>HR Department</h3>
                <span className="department-icon">👤</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.hr.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>
                    <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {departmentStats.hr.attendance}%
                    </Link>
                  </h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.hr.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Tech Department</h3>
                <span className="department-icon">💻</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.tech.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>
                    <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {departmentStats.tech.attendance}%
                    </Link>
                  </h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.tech.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Finance Department</h3>
                <span className="department-icon">💰</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.finance.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>
                    <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {departmentStats.finance.attendance}%
                    </Link>
                  </h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.finance.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
            
            <div className="department-card">
              <div className="department-header">
                <h3>Marketing Department</h3>
                <span className="department-icon">📈</span>
              </div>
              <div className="department-stats">
                <div className="dept-stat">
                  <p>Headcount</p>
                  <h4>{departmentStats.marketing.headcount}</h4>
                </div>
                <div className="dept-stat">
                  <p>Attendance</p>
                  <h4>
                    <Link to="/admin/attendance" style={{ color: 'inherit', textDecoration: 'none' }}>
                      {departmentStats.marketing.attendance}%
                    </Link>
                  </h4>
                </div>
                <div className="dept-stat">
                  <p>Tasks</p>
                  <h4>{departmentStats.marketing.tasks}</h4>
                </div>
              </div>
              <button className="view-dept-btn">Manage</button>
            </div>
          </div>
        </section>

        {/* Recent Activity */}
        <section className="recent-activity-section">
          <div className="section-header">
            <h2>Recent Document Activity</h2>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button onClick={() => fetchDocumentActivities()}>Refresh</button>
              <Link to="/admin/documents" style={{ textDecoration: 'none' }}>
                <button>View All</button>
              </Link>
            </div>
          </div>
          
          <div className="activity-list">
            {recentActivity.length > 0 ? (
              <>
                {/* Show only the first 3 activities */}
                {recentActivity.slice(0, 3).map(activity => (
                  <div key={activity.id} className={`activity-item ${activity.type}`}>
                    <div className="activity-icon" style={{ backgroundColor: 'rgba(67, 24, 255, 0.1)', color: '#4318FF' }}>
                      📄
                    </div>
                    <div className="activity-content">
                      <h4>{activity.user}</h4>
                      <p>{activity.details}</p>
                      {activity.documentName && (
                        <small className="document-name" style={{ display: 'block', marginTop: '4px', color: '#4318FF' }}>
                          <strong>Document:</strong> {activity.documentName}
                        </small>
                      )}
                      <span className="activity-time" style={{ display: 'block', marginTop: '4px', fontSize: '0.7rem', color: '#A3AED0' }}>
                        {activity.timestamp.toLocaleString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: true,
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                    <div className="activity-actions">
                      <Link to="/admin/documents" style={{ textDecoration: 'none' }}>
                        <button className="view-details" style={{ padding: '5px 12px', backgroundColor: 'transparent', border: '1px solid #e9ecef', borderRadius: '8px', color: '#4318FF', cursor: 'pointer', fontSize: '0.75rem' }}>
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
                
                {/* Show "View All" button if there are more than 3 activities */}
                {recentActivity.length > 3 && (
                  <div style={{ textAlign: 'center', marginTop: '15px' }}>
                    <Link to="/admin/documents" style={{ textDecoration: 'none' }}>
                      <button 
                        style={{ 
                          padding: '8px 15px', 
                          backgroundColor: '#4318FF', 
                          border: 'none', 
                          borderRadius: '12px', 
                          color: 'white', 
                          cursor: 'pointer', 
                          fontSize: '0.875rem' 
                        }}
                      >
                        View All {recentActivity.length} Activities
                      </button>
                    </Link>
                  </div>
                )}
              </>
            ) : (
              <div className="no-activities" style={{ padding: '20px', textAlign: 'center', color: '#707EAE' }}>
                <p>No recent document activities available.</p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', marginTop: '10px' }}>
                  <button 
                    onClick={() => fetchDocumentActivities()}
                    style={{ 
                      padding: '8px 15px', 
                      backgroundColor: 'transparent', 
                      border: '1px solid #e9ecef', 
                      borderRadius: '12px', 
                      color: '#4318FF', 
                      cursor: 'pointer', 
                      fontSize: '0.875rem' 
                    }}
                  >
                    Refresh Activities
                  </button>
                  <Link to="/admin/documents" style={{ textDecoration: 'none' }}>
                    <button 
                      style={{ 
                        padding: '8px 15px', 
                        backgroundColor: '#4318FF', 
                        border: 'none', 
                        borderRadius: '12px', 
                        color: 'white', 
                        cursor: 'pointer', 
                        fontSize: '0.875rem' 
                      }}
                    >
                      Go to Documents
                    </button>
                  </Link>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Quick Actions */}
        
      </main>

      {/* Right Sidebar */}
      <aside className="right-sidebar admin-sidebar-right">
        {/* Admin Profile Summary */}
        <div className="profile-summary">
          <div className="user-profile" style={{ justifyContent: 'center', marginBottom: '1rem' }}>
            <img 
              src={admin?.avatar || defaultAvatar} 
              alt="Admin avatar" 
              className="avatar" 
              style={{ width: '80px', height: '80px' }}
            />
          </div>
          
          <div className="profile-details" style={{ textAlign: 'center' }}>
            <h3>{admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Admin User'}</h3>
            <p className="admin-role">System Administrator</p>
            <p>{admin?.email || 'admin@example.com'}</p>
            <p>Employee ID: {admin?.employeeId || 'Not assigned'}</p>
            <p>Access Level: Full</p>
          </div>
          
          <button
            className="view-profile-btn"
            onClick={() => navigate('/admin/profile')}
          >
            Admin Settings
          </button>
        </div>

        {/* Employee Quick View */}
        <div className="employee-quick-view">
          <div className="section-header">
            <h3>Employee Quick View</h3>
            <button onClick={() => fetchEmployees()}>Refresh</button>
          </div>
          
          <div className="employee-search">
            <input type="text" placeholder="Search employees..." />
          </div>
          
          <div className="employee-list">
            {employees.slice(0, 3).map(employee => (
              <div key={employee.id} className="employee-item">
                <div className="employee-avatar">
                  <img src={employee.avatar || defaultAvatar} alt={employee.name} className="member-avatar" />
                </div>
                <div className="employee-details">
                  <h4>{employee.name}</h4>
                  <div className="employee-info">
                    <span className="employee-id-small">ID: {employee.employeeId}</span>
                    <span className="employee-position">{employee.position}</span>
                  </div>
                  <small>{employee.department}</small>
                </div>
                <div className="employee-actions">
                  <button className="employee-action" title="View Profile">👤</button>
                  
                  
                </div>
              </div>
            ))}
          </div>
          
          <Link to="/admin/employees" className="view-all-link">
            View All Employees ({employees.length})
          </Link>
        </div>

        {/* Today's Summary */}
        <div className="todays-summary">
          <h3>Today's Summary</h3>
          
          <div className="summary-stats">
            <div className="summary-stat">
              <span className="summary-icon">👥</span>
              <div>
                <h4>52/73</h4>
                <p>Checked In</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">🕒</span>
              <div>
                <h4>3</h4>
                <p>Late Arrivals</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">🏠</span>
              <div>
                <h4>12</h4>
                <p>Remote Today</p>
              </div>
            </div>
            
            <div className="summary-stat">
              <span className="summary-icon">📝</span>
              <div>
                <h4>5</h4>
                <p>New Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Notes */}
        <div className="quick-notes admin-notes">
          <h3>Admin Notes</h3>
          <textarea 
            className="notes-area" 
            placeholder="Write important notes here..."
          ></textarea>
          <button className="save-note-btn">Save Note</button>
        </div>
      </aside>
    </div>
  );
};

export default AdminDash;