import React from 'react';
import { 
  FiGrid, 
  FiUsers, 
  FiFolder, 
  FiBell, 
  FiFileText,
  FiClock,
  FiCalendar,
  FiUser,
  FiUserPlus
} from 'react-icons/fi';

const Sidebar = () => {
  const menuItems = [
    { icon: <FiGrid size={20} />, label: 'Dashboard', active: true },
    { icon: <FiUsers size={20} />, label: 'Employees' },
    { icon: <FiFolder size={20} />, label: 'Documents' },
    { icon: <FiBell size={20} />, label: 'Announcements' },
    { icon: <FiFileText size={20} />, label: 'Profile' },
    { icon: <FiClock size={20} />, label: 'Attendance' },
    { icon: <FiCalendar size={20} />, label: 'Leave' },
    { icon: <FiUser size={20} />, label: 'Tasks' },
    { icon: <FiUserPlus size={20} />, label: 'Recruitment' },
  ];

  return (
    <div className="sidebar">
      <div className="logo">
        HRSystem
      </div>
      <nav>
        {menuItems.map((item, index) => (
          <div key={index} className={`menu-item ${item.active ? 'active' : ''}`}>
            {item.icon}
            <span>{item.label}</span>
          </div>
        ))}
      </nav>
      <div className="profile-section">
        <img src="https://via.placeholder.com/40" alt="Profile" />
        <div className="profile-info">
          <div className="profile-name">Sara Abraham</div>
          <div className="profile-role">Admin</div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar; 