import React, { useState, useEffect } from 'react';
import { FiArrowLeft, FiHome, FiCalendar, FiFileText, FiSettings, FiMenu, FiBell, FiLogOut } from 'react-icons/fi';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import './Navbar.css';
import defaultAvatar from '../assets/avatar.png';

const Navbar = ({ onSidebarToggle }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch user info from the backend (similar to how Dashboard.jsx does it)
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found: Redirecting to login');
          navigate('/login');
          return;
        }

        // Fetch user data
        const response = await fetch('http://localhost:8080/api/dashboard', {
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
            setError('Failed to fetch user info');
            console.error('Failed to fetch user info');
          }
          return;
        }

        const data = await response.json();
        setUser(data);
      } catch (error) {
        console.error('Error fetching user info:', error);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

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

  // If still loading or error, show minimal navbar
  if (loading || error) {
    return (
      <header className="navbar">
        <div className="navbar-left">
          <button className="menu-btn" onClick={onSidebarToggle}>
            <FiMenu size={20} />
          </button>
          <div className="logo">HRSystem</div>
        </div>
      </header>
    );
  }

  // Get user initials for avatar placeholder
  const getUserInitials = () => {
    if (user && user.firstName) {
      const firstInitial = user.firstName.charAt(0);
      const lastInitial = user.lastName ? user.lastName.charAt(0) : '';
      return (firstInitial + lastInitial).toUpperCase();
    }
    return 'U';
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
        <div className="logo">HRSystem</div>

        <nav className="nav-links">
          <Link to="/dashboard" className={`nav-link ${location.pathname === '/dashboard' ? 'active' : ''}`}>
            <FiHome size={18} /> Dashboard
          </Link>
          <Link to="/attendance" className={`nav-link ${location.pathname === '/attendance' ? 'active' : ''}`}>
            <FiCalendar size={18} /> Attendance
          </Link>
          <Link to="/tasks" className={`nav-link ${location.pathname === '/tasks' ? 'active' : ''}`}>
            <FiFileText size={18} /> Tasks
          </Link>
          <Link to="/settings" className={`nav-link ${location.pathname === '/settings' ? 'active' : ''}`}>
            <FiSettings size={18} /> Settings
          </Link>
        </nav>
      </div>

      <div className="navbar-right">
        <form className="search-bar" onSubmit={handleSearchSubmit}>
          <input 
            type="text" 
            placeholder="Search..." 
            value={searchQuery}
            onChange={handleSearchChange}
          />
        </form>
        
        <Link to="/enhancednotifications" className="notifications">
          <FiBell size={20} />
          <span className="notification-badge">3</span>
        </Link>
        
        <div className="profile" onClick={() => navigate('/profile')}>
          <div className="profile-info">
            <p className="profile-name">
              {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : 'User'}
            </p>
            <p className="profile-role">{user?.position || 'Employee'}</p>
          </div>
          {user?.avatar ? (
            <img src={user.avatar} alt="User avatar" className="profile-avatar" />
          ) : (
            <div className="profile-avatar-initials">{getUserInitials()}</div>
          )}
        </div>

        <button className="logout-button-nav" onClick={handleLogout}>
          <FiLogOut size={20} />
        </button>
      </div>
    </header>
  );
};

export default Navbar;

