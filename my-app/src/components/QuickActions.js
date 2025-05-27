import React from 'react';

const QuickActions = ({ user }) => {
  // Check if user exists before accessing user.role
  const isAdmin = user && (user.role === 'admin' || user.role === 'manager');
  
  return (
    <section className="quick-actions-section">
      <div className="section-header">
        <h2>{isAdmin ? 'Admin Actions' : 'Quick Actions'}</h2>
      </div>
      
      <div className="quick-actions-grid">
        <button className="action-button">
          <span className="action-icon">📝</span>
          <span>Request Time Off</span>
        </button>
        <button className="action-button">
          <span className="action-icon">🔄</span>
          <span>Submit Timesheet</span>
        </button>
        <button className="action-button">
          <span className="action-icon">📊</span>
          <span>View Reports</span>
        </button>
        <button className="action-button">
          <span className="action-icon">📄</span>
          <span>Access Documents</span>
        </button>
        
        {isAdmin && (
          <>
            <button className="action-button admin">
              <span className="action-icon">👥</span>
              <span>Manage Team</span>
            </button>
            <button className="action-button admin">
              <span className="action-icon">📢</span>
              <span>Create Announcement</span>
            </button>
            <button className="action-button admin">
              <span className="action-icon">✅</span>
              <span>Approve Requests</span>
            </button>
            <button className="action-button admin">
              <span className="action-icon">⚙️</span>
              <span>System Settings</span>
            </button>
          </>
        )}
      </div>
    </section>
  );
};

export default QuickActions;