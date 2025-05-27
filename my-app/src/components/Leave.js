import React, { useState } from 'react';
import './Leave.css';

const LeaveApplication = () => {
  const [leaveForm, setLeaveForm] = useState({
    fromDate: '',
    toDate: '',
    leaveType: '',
    reason: ''
  });

  const [leaveHistory, setLeaveHistory] = useState([
    {
      id: 1,
      fromDate: '2024-03-01',
      toDate: '2024-03-03',
      leaveType: 'Sick Leave',
      reason: 'Medical appointment',
      status: 'Approved',
      appliedOn: '2024-02-25'
    },
    {
      id: 2,
      fromDate: '2024-03-15',
      toDate: '2024-03-16',
      leaveType: 'Casual Leave',
      reason: 'Personal work',
      status: 'Pending',
      appliedOn: '2024-03-10'
    }
  ]);

  const leaveTypes = [
    { value: 'sick', label: 'Sick Leave' },
    { value: 'casual', label: 'Casual Leave' },
    { value: 'vacation', label: 'Vacation Leave' },
    { value: 'personal', label: 'Personal Leave' },
    { value: 'other', label: 'Other' }
  ];

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setLeaveForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newLeave = {
      id: leaveHistory.length + 1,
      ...leaveForm,
      status: 'Pending',
      appliedOn: new Date().toISOString().split('T')[0]
    };
    setLeaveHistory(prev => [newLeave, ...prev]);
    setLeaveForm({
      fromDate: '',
      toDate: '',
      leaveType: '',
      reason: ''
    });
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'approved':
        return '#28a745';
      case 'pending':
        return '#ffc107';
      case 'rejected':
        return '#dc3545';
      default:
        return '#6c757d';
    }
  };

  return (
    <div className="leave-application-container">
      <div className="leave-form-section">
        <h2>Apply for Leave</h2>
        <form onSubmit={handleSubmit} className="leave-form">
          <div className="form-group">
            <label htmlFor="fromDate">From Date</label>
            <input
              type="date"
              id="fromDate"
              name="fromDate"
              value={leaveForm.fromDate}
              onChange={handleInputChange}
              required
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="toDate">To Date</label>
            <input
              type="date"
              id="toDate"
              name="toDate"
              value={leaveForm.toDate}
              onChange={handleInputChange}
              required
              min={leaveForm.fromDate || new Date().toISOString().split('T')[0]}
            />
          </div>

          <div className="form-group">
            <label htmlFor="leaveType">Leave Type</label>
            <select
              id="leaveType"
              name="leaveType"
              value={leaveForm.leaveType}
              onChange={handleInputChange}
              required
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map(type => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="reason">Reason</label>
            <textarea
              id="reason"
              name="reason"
              value={leaveForm.reason}
              onChange={handleInputChange}
              required
              rows="4"
              placeholder="Please provide a reason for your leave request"
            />
          </div>

          <button type="submit" className="submit-button">
            Submit Leave Request
          </button>
        </form>
      </div>

      <div className="leave-history-section">
        <h2>Leave History</h2>
        <div className="leave-history-list">
          {leaveHistory.map(leave => (
            <div key={leave.id} className="leave-history-card">
              <div className="leave-header">
                <span className="leave-dates">
                  {leave.fromDate} to {leave.toDate}
                </span>
                <span 
                  className="leave-status"
                  style={{ backgroundColor: getStatusColor(leave.status) }}
                >
                  {leave.status}
                </span>
              </div>
              <div className="leave-details">
                <p><strong>Type:</strong> {leave.leaveType}</p>
                <p><strong>Reason:</strong> {leave.reason}</p>
                <p><strong>Applied on:</strong> {leave.appliedOn}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LeaveApplication; 