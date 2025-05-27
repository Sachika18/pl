import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AttendanceSummary from './AttendanceSummary';
import { FiHome, FiUser, FiSettings, FiArrowLeft, FiAlertCircle } from 'react-icons/fi';
import './Dashboard.css';
import axios from 'axios';
import Navbar from './Navbar';

const Attendance = () => {
  const navigate = useNavigate();
  const [leaveForm, setLeaveForm] = useState({
    from: '',
    to: '',
    type: '',
    reason: ''
  });
  const [leaveSubmitted, setLeaveSubmitted] = useState(false);
  const [submitMessage, setSubmitMessage] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [userLeaves, setUserLeaves] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Fetch user's leave applications and balance when component mounts
    fetchUserLeaves();
    fetchLeaveBalance();
  }, []);

  const fetchUserLeaves = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8080/api/leaves/user', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUserLeaves(response.data);
    } catch (error) {
      console.error('Error fetching leave data:', error);
    }
  };
  
  const fetchLeaveBalance = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.get('http://localhost:8080/api/leaves/balance', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setLeaveBalance(response.data);
    } catch (error) {
      console.error('Error fetching leave balance:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveChange = (e) => {
    setLeaveForm({ ...leaveForm, [e.target.name]: e.target.value });
  };

  const handleLeaveSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitMessage('');
    
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await axios.post('http://localhost:8080/api/leaves/apply-json', 
        leaveForm,
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      
      setLeaveSubmitted(true);
      setSubmitMessage(response.data.message || 'Leave application submitted successfully!');
      
      // Reset form
      setLeaveForm({
        from: '',
        to: '',
        type: '',
        reason: ''
      });
      
      // Refresh leave list and balance
      fetchUserLeaves();
      fetchLeaveBalance();
    } catch (error) {
      setLeaveSubmitted(false);
      setSubmitError(error.response?.data?.error || 'Failed to submit leave application');
      console.error('Error submitting leave application:', error);
    }
  };

  return (
    <div>
    <Navbar />
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
     

      {/* Main Content */}
      <div style={{ 
        flex: 1, 
        padding: '1rem', 
        background: 'var(--bg-light)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden'
      }}>
        <div style={{ 
          display: 'flex', 
          gap: '2rem', 
          background: 'white', 
          borderRadius: 'var(--border-radius-lg)', 
          boxShadow: 'var(--shadow-sm)', 
          flex: 1,
          overflow: 'hidden',
          height: 'calc(100vh - 5rem)',
          maxWidth: '1400px',
          margin: '0 auto',
          width: '100%'
        }}>
          {/* Left: Attendance Summary */}
          <div style={{ flex: '1.5', padding: '1rem', overflow: 'auto' }}>
            <AttendanceSummary userLeaves={userLeaves} />
          </div>
          
          {/* Divider */}
          <div style={{ width: 1, background: 'var(--bg-lighter)', alignSelf: 'stretch' }} />
          
          {/* Right: Leave Application */}
          <div style={{ flex: 1, padding: '1rem', overflow: 'auto' }}>
            <section className="welcome-section" style={{ marginBottom: '1rem', padding: '1rem', borderRadius: 'var(--border-radius-lg)', boxShadow: 'none', background: 'transparent' }}>
              <div className="welcome-text">
                <h1 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', fontWeight: 700,color:'black' }}>Leave Application</h1>
                <p style={{ fontSize: '0.9rem' }}>Apply for your leave here.</p>
              </div>
            </section>
            
            {/* Leave Balance Section */}
            {leaveBalance && (
              <div style={{ 
                marginBottom: '1.5rem', 
                background: '#f8f9fa', 
                borderRadius: '8px', 
                padding: '1rem',
                border: '1px solid #e9ecef'
              }}>
                <h3 style={{ fontSize: '1rem', marginBottom: '0.75rem', fontWeight: 600 }}>
                  Your Leave Balance
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem' }}>
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'white', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>Sick Leave</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#05CD99' }}>
                      {leaveBalance.sickLeave.remaining}/{leaveBalance.sickLeave.total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Remaining</div>
                  </div>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'white', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>Casual Leave</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#4318FF' }}>
                      {leaveBalance.casualLeave.remaining}/{leaveBalance.casualLeave.total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Remaining</div>
                  </div>
                  
                  <div style={{ 
                    padding: '0.75rem', 
                    background: 'white', 
                    borderRadius: '6px',
                    border: '1px solid #e9ecef',
                    textAlign: 'center'
                  }}>
                    <div style={{ fontSize: '0.8rem', color: '#6c757d', marginBottom: '0.25rem' }}>Earned Leave</div>
                    <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#FFB547' }}>
                      {leaveBalance.earnedLeave.remaining}/{leaveBalance.earnedLeave.total}
                    </div>
                    <div style={{ fontSize: '0.75rem', color: '#6c757d' }}>Remaining</div>
                  </div>
                </div>
              </div>
            )}
            
            <form className="attendance-summary" onSubmit={handleLeaveSubmit} style={{ boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="from" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>From</label>
                <input
                  type="date"
                  id="from"
                  name="from"
                  className="search-bar"
                  value={leaveForm.from}
                  onChange={handleLeaveChange}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="to" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>To</label>
                <input
                  type="date"
                  id="to"
                  name="to"
                  className="search-bar"
                  value={leaveForm.to}
                  onChange={handleLeaveChange}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="type" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Leave Type</label>
                <select
                  id="type"
                  name="type"
                  className="search-bar"
                  value={leaveForm.type}
                  onChange={handleLeaveChange}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                >
                  <option value="">Select type</option>
                  <option value="Casual">Casual</option>
                  <option value="Sick">Sick</option>
                  <option value="Earned">Earned</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="reason" style={{ display: 'block', marginBottom: 4, color: 'var(--text-secondary)', fontWeight: 500, fontSize: '0.9rem' }}>Reason</label>
                <textarea
                  id="reason"
                  name="reason"
                  className="notes-area"
                  value={leaveForm.reason}
                  onChange={handleLeaveChange}
                  placeholder="Reason for leave..."
                  style={{ width: '100%', height: '80px', padding: '0.5rem' }}
                />
              </div>
              <button 
                type="submit" 
                className="submit-button"
                style={{ 
                  padding: '0.75rem 1.5rem',
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 'var(--border-radius)',
                  cursor: 'pointer',
                  transition: 'background 0.2s',
                  width: '100%',
                  marginTop: '1rem'
                }}
              >
                Apply
              </button>
              {submitMessage && (
                <div style={{ color: 'var(--success)', marginTop: 8, textAlign: 'center', fontWeight: 500, fontSize: '0.9rem' }}>
                  {submitMessage}
                </div>
              )}
              {submitError && (
                <div style={{ color: 'var(--danger)', marginTop: 8, textAlign: 'center', fontWeight: 500, fontSize: '0.9rem' }}>
                  {submitError}
                </div>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 900px) {
          .main-content > div { flex-direction: column !important; }
          .main-content > div > div[style*='width: 1px'] { display: none !important; }
        }
      `}</style>
    </div>
    </div>
    
  );
};

export default Attendance;