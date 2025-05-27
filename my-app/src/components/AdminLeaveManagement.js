import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './AdminLeaveManagement.css';
import AdminNavbar from './AdminNavbar';

const AdminLeaveManagement = () => {
  const navigate = useNavigate();
  const [allLeaves, setAllLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [userBalances, setUserBalances] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('pending'); // 'pending', 'all'

  useEffect(() => {
    // Check if user is admin
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user.position === 'Admin') {
      setIsAdmin(true);
      fetchAllLeaves();
    } else {
      setError('Access denied. Admin privileges required.');
      setLoading(false);
    }
  }, []);

  const fetchAllLeaves = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if user is admin
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.position !== 'Admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      // Fetch all leaves
      const allLeavesResponse = await axios.get('http://localhost:8080/api/leaves/admin/all-leaves', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setAllLeaves(allLeavesResponse.data);
      
      // Filter pending leaves
      const pending = allLeavesResponse.data.filter(leave => leave.status === 'PENDING');
      setPendingLeaves(pending);
      
      // Fetch leave balances for each user
      const userIds = [...new Set(allLeavesResponse.data.map(leave => leave.userId))];
      const balances = {};
      
      for (const userId of userIds) {
        try {
          const balanceResponse = await axios.get(`http://localhost:8080/api/leaves/admin/user-balance/${userId}`, {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          balances[userId] = balanceResponse.data;
        } catch (err) {
          console.error(`Error fetching balance for user ${userId}:`, err);
        }
      }
      
      setUserBalances(balances);
      
    } catch (err) {
      console.error('Error fetching leaves:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(err.response?.data?.error || 'Failed to fetch leaves');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleApproveLeave = async (leaveId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // Check if user is admin
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.position !== 'Admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.put(`http://localhost:8080/api/leaves/admin/approve/${leaveId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Leave approved successfully');
      
      // Refresh the list of all leaves
      fetchAllLeaves();
      
    } catch (err) {
      console.error('Error approving leave:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(err.response?.data?.error || 'Failed to approve leave');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRejectLeave = async (leaveId) => {
    try {
      setLoading(true);
      setError(null);
      setSuccessMessage('');
      
      // Check if user is admin
      const user = JSON.parse(localStorage.getItem('user') || '{}');
      if (user.position !== 'Admin') {
        setError('Access denied. Admin privileges required.');
        setLoading(false);
        return;
      }
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await axios.put(`http://localhost:8080/api/leaves/admin/reject/${leaveId}`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSuccessMessage('Leave rejected');
      
      // Refresh the list of all leaves
      fetchAllLeaves();
      
    } catch (err) {
      console.error('Error rejecting leave:', err);
      if (err.response?.status === 403) {
        setError('Access denied. Admin privileges required.');
        // Redirect to login after 3 seconds
        setTimeout(() => {
          navigate('/login');
        }, 3000);
      } else {
        setError(err.response?.data?.error || 'Failed to reject leave');
      }
    } finally {
      setLoading(false);
    }
  };

  const calculateLeaveDays = (fromDate, toDate) => {
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const diffTime = Math.abs(to - from);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
    return diffDays;
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const viewLeaveDetails = (leave) => {
    setSelectedLeave(leave);
  };

  const closeLeaveDetails = () => {
    setSelectedLeave(null);
  };

  if (loading && pendingLeaves.length === 0) {
    return (
      <div className="admin-leave-management">
        <h2>Leave Management</h2>
        <div className="loading-spinner">Loading...</div>
      </div>
    );
  }
  
  if (error && error.includes('Access denied')) {
    return (
      <div className="admin-leave-management">
        <h2>Leave Management</h2>
        <div className="error-container" style={{ textAlign: 'center', padding: '2rem' }}>
          <div className="error-message" style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>
            {error}
          </div>
          <p style={{ marginBottom: '1.5rem' }}>
            You need administrator privileges to access this page.
          </p>
          <button 
            onClick={() => navigate('/login')} 
            style={{
              padding: '0.5rem 1rem',
              background: '#4318FF',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              marginRight: '1rem'
            }}
          >
            Go to Login
          </button>
          <button 
            onClick={() => navigate('/dashboard')} 
            style={{
              padding: '0.5rem 1rem',
              background: '#e9ecef',
              color: '#495057',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
    <AdminNavbar onSidebarToggle={() => {}} />
    <div className="admin-leave-management">
      <h2>Leave Management</h2>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="leave-management-actions">
        <button onClick={fetchAllLeaves} disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>
      
      <div className="leave-tabs">
        <button 
          className={`tab-button ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests
        </button>
        <button 
          className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All Requests
        </button>
      </div>
      
      {activeTab === 'pending' && pendingLeaves.length === 0 ? (
        <div className="no-leaves-message">No pending leave requests</div>
      ) : activeTab === 'all' && allLeaves.length === 0 ? (
        <div className="no-leaves-message">No leave requests found</div>
      ) : (
        <div className="leave-requests-table">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Leave Type</th>
                <th>From</th>
                <th>To</th>
                <th>Days</th>
                <th>Balance</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {(activeTab === 'pending' ? pendingLeaves : allLeaves).map(leave => {
                const days = calculateLeaveDays(leave.fromDate, leave.toDate);
                const userBalance = userBalances[leave.userId];
                let balanceInfo = 'N/A';
                
                if (userBalance) {
                  if (leave.leaveType === 'Sick') {
                    balanceInfo = `${userBalance.sickLeave.remaining}/${userBalance.sickLeave.total}`;
                  } else if (leave.leaveType === 'Casual') {
                    balanceInfo = `${userBalance.casualLeave.remaining}/${userBalance.casualLeave.total}`;
                  } else if (leave.leaveType === 'Earned') {
                    balanceInfo = `${userBalance.earnedLeave.remaining}/${userBalance.earnedLeave.total}`;
                  }
                }
                
                return (
                  <tr key={leave.id}>
                    <td>{leave.userEmail}</td>
                    <td>{leave.leaveType}</td>
                    <td>{formatDate(leave.fromDate)}</td>
                    <td>{formatDate(leave.toDate)}</td>
                    <td>{days}</td>
                    <td>{balanceInfo}</td>
                    <td>
                      <span className={`status-badge status-${leave.status.toLowerCase()}`}>
                        {leave.status}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button 
                        className="view-button"
                        onClick={() => viewLeaveDetails(leave)}
                      >
                        View
                      </button>
                      {leave.status === 'PENDING' && (
                        <>
                          <button 
                            className="approve-button"
                            onClick={() => handleApproveLeave(leave.id)}
                            disabled={loading}
                          >
                            Approve
                          </button>
                          <button 
                            className="reject-button"
                            onClick={() => handleRejectLeave(leave.id)}
                            disabled={loading}
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {leave.status !== 'PENDING' && (
                        <span className="status-message">
                          {leave.status === 'APPROVED' ? 'Approved' : 'Rejected'}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      
      {selectedLeave && (
        <div className="leave-details-modal">
          <div className="leave-details-content">
            <span className="close-button" onClick={closeLeaveDetails}>&times;</span>
            <h3>Leave Request Details</h3>
            
            <div className="leave-detail">
              <span className="detail-label">Employee:</span>
              <span className="detail-value">{selectedLeave.userEmail}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">Leave Type:</span>
              <span className="detail-value">{selectedLeave.leaveType}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">From:</span>
              <span className="detail-value">{formatDate(selectedLeave.fromDate)}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">To:</span>
              <span className="detail-value">{formatDate(selectedLeave.toDate)}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">Days:</span>
              <span className="detail-value">{calculateLeaveDays(selectedLeave.fromDate, selectedLeave.toDate)}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">Status:</span>
              <span className={`status-badge status-${selectedLeave.status.toLowerCase()}`}>
                {selectedLeave.status}
              </span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">Applied On:</span>
              <span className="detail-value">{formatDate(selectedLeave.appliedOn)}</span>
            </div>
            
            <div className="leave-detail">
              <span className="detail-label">Reason:</span>
              <span className="detail-value reason-text">{selectedLeave.reason}</span>
            </div>
            
            <div className="leave-detail-actions">
              <button 
                className="approve-button"
                onClick={() => {
                  handleApproveLeave(selectedLeave.id);
                  closeLeaveDetails();
                }}
                disabled={loading}
              >
                Approve
              </button>
              <button 
                className="reject-button"
                onClick={() => {
                  handleRejectLeave(selectedLeave.id);
                  closeLeaveDetails();
                }}
                disabled={loading}
              >
                Reject
              </button>
              <button 
                className="cancel-button"
                onClick={closeLeaveDetails}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default AdminLeaveManagement;