import React from 'react';
import { useTheme } from '../context/ThemeContext';
import './DarkModeToggle.css';

const DarkModeToggle = () => {
  const { darkMode, toggleDarkMode } = useTheme();

  return (
    <div className="dark-mode-toggle">
      <label className="toggle-switch">
        <input 
          type="checkbox" 
          checked={darkMode} 
          onChange={toggleDarkMode}
        />
        <span className="toggle-slider"></span>
        <span className="toggle-label">{darkMode ? '🌙' : '☀️'}</span>
      </label>
    </div>
  );
};

export default DarkModeToggle;