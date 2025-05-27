import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiHome, FiUsers, FiCalendar, FiFileText, FiClipboard, FiMenu, FiBell, FiLogOut } from 'react-icons/fi';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './AdminNavbar.css'; // Make sure this CSS file exists and is properly imported

const AdminNavbar = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [admin, setAdmin] = useState({
    firstName: 'Admin',
    lastName: 'User',
    role: 'System Administrator'
  }); // Default values to ensure rendering
  const [loading, setLoading] = useState(false); // Set to false to render full navbar immediately
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch admin info from the backend - this can be uncommented once API works
  /*
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found: Redirecting to login');
          navigate('/login');
          return;
        }

        // Fetch admin data
        const response = await fetch('http://localhost:8080/api/admin/profile', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          if (response.status === 403) {
            console.error('Forbidden: Redirecting to login');
            navigate('/login');
          } else {
            setError('Failed to fetch admin info');
            console.error('Failed to fetch admin info');
          }
          return;
        }

        const data = await response.json();
        setAdmin(data);
      } catch (error) {
        console.error('Error fetching admin info:', error);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchAdminInfo();
  }, [navigate]);
  */

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    // Implement search functionality here
    console.log('Searching for:', searchQuery);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // Get admin initials for avatar placeholder
  const getAdminInitials = () => {
    if (admin && admin.firstName) {
      const firstInitial = admin.firstName.charAt(0);
      const lastInitial = admin.lastName ? admin.lastName.charAt(0) : '';
      return (firstInitial + lastInitial).toUpperCase();
    }
    return 'A';
  };

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={onSidebarToggle}>
          <FiMenu size={20} />
        </button>
        <button className="back-btn" onClick={() => navigate(-1)}>
          <FiArrowLeft size={20} />
        </button>
        <div className="logo">WorkLine <span className="admin-badge">Admin</span></div>

        <nav className="nav-links">
          <Link to="/admin/dashboard" className={`nav-link ${location.pathname === '/admin/dashboard' ? 'active' : ''}`}>
            <FiHome size={18} /> Dashboard
          </Link>
          <Link to="/admin/employees" className={`nav-link ${location.pathname === '/admin/employees' ? 'active' : ''}`}>
            <FiUsers size={18} /> Employees
          </Link>
          <Link to="/admin/attendance" className={`nav-link ${location.pathname === '/admin/attendance' ? 'active' : ''}`}>
            <FiCalendar size={18} /> Attendance
          </Link>
          <Link to="/admin/leaves" className={`nav-link ${location.pathname === '/admin/leaves' ? 'active' : ''}`}>
            <FiClipboard size={18} /> Leaves
          </Link>
          <Link to="/admin/documents" className={`nav-link ${location.pathname === '/admin/documents' ? 'active' : ''}`}>
            <FiFileText size={18} /> Documents
          </Link>
        </nav>
      </div>

      <div className="navbar-right">
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Search admin portal..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </form>
        
        <Link to="/admin/notifications" className="notifications">
          <FiBell size={20} />
          <span className="notification-badge">5</span>
        </Link>
        
        <div className="profile" onClick={() => navigate('/admin/profile')}>
          <div className="profile-info">
            <p className="profile-name">
              {admin?.firstName ? `${admin.firstName} ${admin.lastName || ''}`.trim() : 'Admin'}
            </p>
            <p className="profile-role">System Administrator</p>
          </div>
          <div className="profile-avatar-initials">{getAdminInitials()}</div>
        </div>

        <button className="logout-button-nav" onClick={handleLogout}>
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;