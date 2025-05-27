import React, { createContext, useState, useEffect, useContext } from 'react';

// Create a context for theme management
const ThemeContext = createContext();

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

// Theme provider component
export const ThemeProvider = ({ children }) => {
  // Check if dark mode was previously enabled
  const [darkMode, setDarkMode] = useState(() => {
    const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    return savedSettings.darkMode || false;
  });

  // Apply dark mode class to body when darkMode state changes
  useEffect(() => {
    if (darkMode) {
      document.body.classList.add('dark-mode');
    } else {
      document.body.classList.remove('dark-mode');
    }
    
    // Save dark mode preference to localStorage
    const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    localStorage.setItem('userSettings', JSON.stringify({
      ...currentSettings,
      darkMode
    }));
  }, [darkMode]);

  // Toggle dark mode
  const toggleDarkMode = () => {
    setDarkMode(prevMode => !prevMode);
  };

  // Context value
  const value = {
    darkMode,
    toggleDarkMode,
    setDarkMode
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;