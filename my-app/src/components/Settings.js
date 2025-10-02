import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Settings.css';
import { useTheme } from '../context/ThemeContext';
import { API_URL } from '../utils/constants';

const Settings = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { darkMode, setDarkMode } = useTheme();
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [language, setLanguage] = useState('english');
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [saveStatus, setSaveStatus] = useState('');
  
  // Check if we're in the admin route
  const isAdminRoute = location.pathname.includes('/admin/');

  // Check if user is logged in and fetch user data
  useEffect(() => {
    const fetchUserInfo = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found: Redirecting to login');
          navigate('/login');
          return;
        }
        
        // Update page title based on route
        document.title = isAdminRoute ? 'Admin Settings | WorkLine' : 'Settings | WorkLine';

        // Load saved settings from localStorage
        const savedSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
        if (savedSettings.notificationsEnabled !== undefined) setNotificationsEnabled(savedSettings.notificationsEnabled);
        if (savedSettings.language) setLanguage(savedSettings.language);

        try {
          // Fetch user data
          const response = await fetch(`${API_URL}/dashboard`, {
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
              return;
            } else {
              throw new Error('Failed to fetch user info');
            }
          }

          const userData = await response.json();
          setUser(userData);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          
          // Use mock user data as fallback
          setUser({
            id: 'mock-user-1',
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo.user@example.com',
            position: 'Employee',
            avatar: null
          });
        }
      } catch (error) {
        console.error('Error in fetchUserInfo:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserInfo();
  }, [navigate]);

  // Save non-theme settings to localStorage
  useEffect(() => {
    // Save settings to localStorage
    const currentSettings = JSON.parse(localStorage.getItem('userSettings') || '{}');
    localStorage.setItem('userSettings', JSON.stringify({
      ...currentSettings,
      notificationsEnabled,
      language
    }));
  }, [notificationsEnabled, language]);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    const settings = {
      darkMode,
      notificationsEnabled,
      language
    };
    localStorage.setItem('userSettings', JSON.stringify(settings));
    
    // Show success message
    setSaveStatus('Settings saved successfully!');
    setTimeout(() => setSaveStatus(''), 3000);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-container">
      <div className="settings-header">
        <h1>{isAdminRoute ? 'Admin Settings' : 'Settings'}</h1>
        <p>Manage your {isAdminRoute ? 'admin portal' : 'application'} preferences</p>
      </div>

      <div className="settings-content">
        <div className="settings-card">
          <h2>Appearance</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Dark Mode</h3>
              <p>Switch between light and dark theme</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={darkMode} 
                  onChange={() => setDarkMode(!darkMode)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Notifications</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Enable Notifications</h3>
              <p>Receive alerts for important updates</p>
            </div>
            <div className="setting-control">
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={notificationsEnabled} 
                  onChange={() => setNotificationsEnabled(!notificationsEnabled)}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Language</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Display Language</h3>
              <p>Select your preferred language</p>
            </div>
            <div className="setting-control">
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className="language-select"
              >
                <option value="english">English</option>
                <option value="spanish">Spanish</option>
                <option value="french">French</option>
                <option value="german">German</option>
              </select>
            </div>
          </div>
        </div>

        <div className="settings-card">
          <h2>Account</h2>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Email</h3>
              <p>{user?.email || 'user@example.com'}</p>
            </div>
            <div className="setting-control">
              <button className="change-button">Change</button>
            </div>
          </div>
          
          <div className="setting-item">
            <div className="setting-info">
              <h3>Password</h3>
              <p>••••••••</p>
            </div>
            <div className="setting-control">
              <button className="change-button">Change</button>
            </div>
          </div>
        </div>
        
        {isAdminRoute && (
          <div className="settings-card">
            <h2>Admin Controls</h2>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>System Maintenance Mode</h3>
                <p>Temporarily disable user access for maintenance</p>
              </div>
              <div className="setting-control">
                <label className="toggle-switch">
                  <input 
                    type="checkbox" 
                    checked={false} 
                    onChange={() => alert('This feature is not yet implemented')}
                  />
                  <span className="toggle-slider"></span>
                </label>
              </div>
            </div>
            
            <div className="setting-item">
              <div className="setting-info">
                <h3>Data Backup</h3>
                <p>Create a backup of all system data</p>
              </div>
              <div className="setting-control">
                <button className="change-button" onClick={() => alert('Backup feature not yet implemented')}>Backup Now</button>
              </div>
            </div>
          </div>
        )}

        <div className="settings-actions">
          <button className="save-settings-btn" onClick={handleSaveSettings}>
            Save Settings
          </button>
          {saveStatus && <div className="save-status">{saveStatus}</div>}
        </div>
      </div>
    </div>
  );
};

export default Settings;