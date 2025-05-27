import React, { useState, useEffect, useCallback } from 'react';
import { FiCalendar, FiClock, FiCheck, FiBarChart2 } from 'react-icons/fi';
// Removed circular import: import AttendanceSummary from './AttendanceSummary';

const AttendanceSummary = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [attendanceHistory, setAttendanceHistory] = useState([]);
  const [userLeaves, setUserLeaves] = useState([]);
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [checkInTime, setCheckInTime] = useState(null);
  const [checkOutTime, setCheckOutTime] = useState(null);
  const [totalHours, setTotalHours] = useState(0);
  const [monthly, setMonthly] = useState(true);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(1)),
    to: new Date()
  });
  const [dataFetchTrigger, setDataFetchTrigger] = useState(0);

  // Helper function to get token
  const getToken = () => {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return token;
  };

  // Fetch today's attendance status
  const fetchTodayAttendance = useCallback(async () => {
    try {
      const token = getToken();

      const response = await fetch('http://localhost:8080/api/attendance/today', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch today\'s attendance');
      }

      const data = await response.json();
      
      if (data && data.id) {
        setTodayAttendance(data);
        setIsCheckedIn(data.status === 'CHECKED_IN');
        
        if (data.checkInTime) {
          setCheckInTime(new Date(data.checkInTime));
        }
        
        if (data.checkOutTime) {
          setCheckOutTime(new Date(data.checkOutTime));
        }
        
        if (data.totalHours) {
          setTotalHours(data.totalHours);
        } else if (data.checkInTime && data.status === 'CHECKED_IN') {
          // Calculate ongoing hours
          const now = new Date();
          const checkIn = new Date(data.checkInTime);
          const hours = (now - checkIn) / (1000 * 60 * 60);
          setTotalHours(hours);
        }
      }
    } catch (err) {
      console.error('Error fetching today\'s attendance:', err);
      setError(err.message);
    }
  }, []);

  // Set up the periodic polling only once when component mounts
  useEffect(() => {
    // Initial fetch
    fetchTodayAttendance();
    
    let timer = null;
    
    // Only set up polling if user is checked in
    if (isCheckedIn) {
      console.log('Setting up attendance polling interval - checked in');
      timer = setInterval(() => {
        console.log('Polling for attendance update');
        fetchTodayAttendance();
      }, 300000); // Every 5 minutes instead of every minute to reduce server load
    }
    
    return () => {
      if (timer) {
        console.log('Cleaning up attendance polling interval');
        clearInterval(timer);
      }
    };
  }, [fetchTodayAttendance, isCheckedIn]); // Keep isCheckedIn in dependencies to restart timer when status changes

  // Fetch attendance history
  const fetchAttendanceHistory = useCallback(async () => {
    try {
      setLoading(true);
      const token = getToken();

      const fromDate = dateRange.from.toISOString().split('T')[0];
      const toDate = dateRange.to.toISOString().split('T')[0];

      const response = await fetch(
        `http://localhost:8080/api/attendance/history?fromDate=${fromDate}&toDate=${toDate}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch attendance history');
      }

      const data = await response.json();
      setAttendanceHistory(data);
    } catch (err) {
      console.error('Error fetching attendance history:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [dateRange.from, dateRange.to]);

  // Fetch user leave history - with error handling for 404
  const fetchUserLeaves = useCallback(async () => {
    try {
      const token = getToken();

      const response = await fetch('http://localhost:8080/api/leaves/history', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      // Check if endpoint is not found (404) and silently handle it
      if (response.status === 404) {
        console.log('Leave history endpoint not implemented yet');
        setUserLeaves([]);
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch leave history');
      }

      const data = await response.json();
      setUserLeaves(data);
    } catch (err) {
      console.error('Error fetching leave history:', err);
      // Don't retry on error - just set empty array
      setUserLeaves([]);
    }
  }, []);

  // Controlled data fetching that depends on date range changes or manual refresh
  useEffect(() => {
    fetchAttendanceHistory();
  }, [fetchAttendanceHistory, dateRange, dataFetchTrigger]);

  // Fetch leaves data only once when component mounts
  useEffect(() => {
    fetchUserLeaves();
  }, [fetchUserLeaves]);

  // Handle check in/out
  const handleCheckInOut = async () => {
    try {
      const token = getToken();

      const endpoint = isCheckedIn ? 'checkout' : 'checkin';
      const response = await fetch(`http://localhost:8080/api/attendance/${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error(`Failed to ${isCheckedIn ? 'check out' : 'check in'}`);
      }

      const data = await response.json();

      if (data && data.attendance) {
        setTodayAttendance(data.attendance);
        
        if (!isCheckedIn) {
          // Just checked in
          setIsCheckedIn(true);
          setCheckInTime(new Date(data.attendance.checkInTime));
        } else {
          // Just checked out
          setIsCheckedIn(false);
          setCheckOutTime(new Date(data.attendance.checkOutTime));
          setTotalHours(data.attendance.totalHours || 0);
        }
        
        // Trigger a refresh of the attendance history data
        setDataFetchTrigger(prev => prev + 1);
      }
    } catch (err) {
      console.error(`Error during ${isCheckedIn ? 'check out' : 'check in'}:`, err);
      setError(err.message);
    }
  };

  // Handle date range change
  const handleDateRangeChange = (periodType) => {
    const today = new Date();
    let from = new Date();
    
    if (periodType === 'month') {
      // Current month
      from = new Date(today.getFullYear(), today.getMonth(), 1);
      setMonthly(true);
    } else if (periodType === 'week') {
      // Current week (starting Sunday)
      const day = today.getDay();
      from = new Date(today);
      from.setDate(today.getDate() - day);
      setMonthly(false);
    } else if (periodType === 'custom') {
      // Keep existing date range, just toggle view
      setMonthly(false);
      return;
    }
    
    setDateRange({ from, to: today });
  };

  // Format date for display
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatTime = (date) => {
    if (!date) return '--:--';
    return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (loading && !todayAttendance) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading attendance data...</p>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <section className="welcome-section" style={{ marginBottom: '1.5rem', padding: '1rem' }}>
        <div className="welcome-text">
          <h1 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Attendance Management</h1>
          <p style={{ fontSize: '0.9rem' }}>Track and manage your attendance records</p>
        </div>
        
        <div className="check-in-section">
          <button
            className={`check-in-button ${isCheckedIn ? 'checked-in' : ''}`}
            onClick={handleCheckInOut}
            style={{
              backgroundColor: isCheckedIn ? '#FF5252' : '#05CD99',
              color: 'white',
              border: 'none',
              padding: '0.75rem 1.5rem',
              borderRadius: 'var(--border-radius-md)',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            {isCheckedIn ? (
              <>
                <FiClock /> Check Out
              </>
            ) : (
              <>
                <FiCheck /> Check In
              </>
            )}
          </button>
        </div>
      </section>

      {/* Today's Status Card */}
      <div style={{ 
        background: 'white', 
        padding: '1.5rem', 
        borderRadius: 'var(--border-radius-md)', 
        boxShadow: 'var(--shadow-sm)',
        marginBottom: '1.5rem'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text-primary)' }}>Today's Status</h2>
          <div style={{ 
            padding: '0.25rem 0.75rem',
            borderRadius: 'var(--border-radius-sm)',
            fontSize: '0.875rem',
            fontWeight: 500,
            background: isCheckedIn ? 'rgba(5, 205, 153, 0.1)' : (checkInTime && checkOutTime) ? 'rgba(5, 205, 153, 0.1)' : 'rgba(255, 181, 71, 0.1)',
            color: isCheckedIn ? 'var(--success)' : (checkInTime && checkOutTime) ? 'var(--success)' : 'var(--warning)'
          }}>
            {isCheckedIn ? 'Currently Working' : (checkInTime && checkOutTime) ? 'Completed' : 'Not Started'}
          </div>
        </div>
        
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
          gap: '1.5rem'
        }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Check-in Time</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: checkInTime ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
              <FiClock size={20} color="var(--primary)" />
              {checkInTime ? formatTime(checkInTime) : '--:--'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Check-out Time</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 600,
              color: checkOutTime ? 'var(--text-primary)' : 'var(--text-secondary)'
            }}>
              <FiClock size={20} color="var(--primary)" />
              {checkOutTime ? formatTime(checkOutTime) : (isCheckedIn ? 'Not checked out' : '--:--')}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Work Duration</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 600
            }}>
              <FiBarChart2 size={20} color="var(--primary)" />
              {totalHours > 0 ? `${totalHours.toFixed(2)} hours` : '--'}
            </div>
          </div>
          
          <div>
            <div style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>Date</div>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              fontSize: '1.25rem',
              fontWeight: 600
            }}>
              <FiCalendar size={20} color="var(--primary)" />
              {formatDate(new Date())}
            </div>
          </div>
        </div>
      </div>

      {/* Attendance History and Summary */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* History Filter Controls */}
        <div style={{ 
          background: 'white', 
          padding: '1rem', 
          borderRadius: 'var(--border-radius-md)', 
          boxShadow: 'var(--shadow-sm)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 600 }}>Attendance Records</h2>
            
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
                onClick={() => handleDateRangeChange('month')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  background: monthly ? 'var(--primary)' : 'var(--bg-light)',
                  color: monthly ? 'white' : 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Monthly
              </button>
              <button 
                onClick={() => handleDateRangeChange('week')}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  border: 'none',
                  background: !monthly ? 'var(--primary)' : 'var(--bg-light)',
                  color: !monthly ? 'white' : 'var(--text-primary)',
                  fontWeight: 500,
                  cursor: 'pointer'
                }}
              >
                Weekly
              </button>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-primary)' }}>
              <strong>Period:</strong> {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div>
                <label htmlFor="fromDate" style={{ fontSize: '0.875rem', marginRight: '0.5rem' }}>From:</label>
                <input 
                  type="date" 
                  id="fromDate"
                  value={dateRange.from.toISOString().split('T')[0]}
                  onChange={(e) => setDateRange({...dateRange, from: new Date(e.target.value)})}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>
              
              <div>
                <label htmlFor="toDate" style={{ fontSize: '0.875rem', marginRight: '0.5rem' }}>To:</label>
                <input 
                  type="date" 
                  id="toDate"
                  value={dateRange.to.toISOString().split('T')[0]}
                  onChange={(e) => {
                    const newDate = new Date(e.target.value);
                    // Don't allow dates in the future
                    if (newDate <= new Date()) {
                      setDateRange({...dateRange, to: newDate});
                      handleDateRangeChange('custom');
                    }
                  }}
                  max={new Date().toISOString().split('T')[0]}
                  style={{
                    padding: '0.4rem',
                    borderRadius: 'var(--border-radius-sm)',
                    border: '1px solid var(--border-color)'
                  }}
                />
              </div>
            </div>
          </div>
        </div>
        
        {/* Attendance Records Table */}
        <div style={{ 
          background: 'white', 
          padding: '1rem', 
          borderRadius: 'var(--border-radius-md)', 
          boxShadow: 'var(--shadow-sm)',
          overflowX: 'auto'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Check-in</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Check-out</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Work Hours</th>
                <th style={{ padding: '0.75rem', textAlign: 'left', fontWeight: 600, color: 'var(--text-primary)' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ padding: '1rem', textAlign: 'center' }}>Loading...</td>
                </tr>
              ) : attendanceHistory.length > 0 ? (
                attendanceHistory.map((record) => (
                  <tr key={record.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>
                      {formatDate(record.checkInTime || record.date)}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>
                      {record.checkInTime ? formatTime(record.checkInTime) : '--:--'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>
                      {record.checkOutTime ? formatTime(record.checkOutTime) : '--:--'}
                    </td>
                    <td style={{ padding: '0.75rem', color: 'var(--text-primary)' }}>
                      {record.totalHours ? `${record.totalHours.toFixed(2)}` : '--'}
                    </td>
                    <td style={{ padding: '0.75rem' }}>
                      <span style={{
                        display: 'inline-block',
                        padding: '0.25rem 0.5rem',
                        borderRadius: 'var(--border-radius-sm)',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        background: record.status === 'COMPLETED' ? 'rgba(5, 205, 153, 0.1)' : 
                                  record.status === 'CHECKED_IN' ? 'rgba(67, 24, 255, 0.1)' : 
                                  'rgba(255, 181, 71, 0.1)',
                        color: record.status === 'COMPLETED' ? 'var(--success)' : 
                              record.status === 'CHECKED_IN' ? 'var(--primary)' : 
                              'var(--warning)'
                      }}>
                        {record.status === 'COMPLETED' ? 'Completed' : 
                         record.status === 'CHECKED_IN' ? 'Working' : 
                         record.status === 'ABSENT' ? 'Absent' : 
                         record.status}
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-secondary)' }}>
                    No attendance records found for the selected period
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Attendance Summary Stats - Inline instead of recursive component */}
        <div className="attendance-summary-stats">
          <h3>Summary</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Total Days</span>
              <span className="stat-value">{attendanceHistory.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Hours</span>
              <span className="stat-value">
                {attendanceHistory.reduce((sum, record) => sum + (record.totalHours || 0), 0).toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;