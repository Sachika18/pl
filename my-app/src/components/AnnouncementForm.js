import React, { useState, useEffect } from 'react';
import './AnnouncementForm.css';

const AnnouncementForm = ({ onAnnouncementPosted, adminDepartment = 'admin' }) => {
  const [announcement, setAnnouncement] = useState({
    title: '',
    content: '',
    priority: 'normal',
    targetDepartments: [],
    expiryDate: '',
    createdByDepartment: adminDepartment
  });
  
  // Log admin department for debugging
  useEffect(() => {
    console.log('AnnouncementForm: Admin department:', adminDepartment);
  }, [adminDepartment]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState({
    show: false,
    success: false,
    message: ''
  });

  // Updated department IDs to match MongoDB exactly
  const departments = [
    { id: 'all', name: 'All Departments' },
    { id: 'HR Department', name: 'HR Department' },
    { id: 'Tech Department', name: 'Tech Department' },
    { id: 'Finance Department', name: 'Finance Department' },
    { id: 'Marketing Department', name: 'Marketing Department' },
    
  ];
  
  // Log departments for debugging
  useEffect(() => {
    console.log('AnnouncementForm: Available departments:', departments.map(d => d.id));
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAnnouncement(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDepartmentChange = (e) => {
    const { value, checked } = e.target;
    
    if (value === 'all' && checked) {
      // If "All Departments" is selected, clear other selections
      setAnnouncement(prev => ({
        ...prev,
        targetDepartments: ['all']
      }));
    } else if (value === 'all' && !checked) {
      // If "All Departments" is unselected, clear all selections
      setAnnouncement(prev => ({
        ...prev,
        targetDepartments: []
      }));
    } else {
      // Handle individual department selection
      setAnnouncement(prev => {
        // Remove 'all' from the array if it exists
        const updatedDepts = prev.targetDepartments.filter(dept => dept !== 'all');
        
        if (checked) {
          return {
            ...prev,
            targetDepartments: [...updatedDepts, value]
          };
        } else {
          return {
            ...prev,
            targetDepartments: updatedDepts.filter(dept => dept !== value)
          };
        }
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!announcement.title.trim()) {
      setSubmitStatus({
        show: true,
        success: false,
        message: 'Please enter an announcement title'
      });
      return;
    }
    
    if (!announcement.content.trim()) {
      setSubmitStatus({
        show: true,
        success: false,
        message: 'Please enter announcement content'
      });
      return;
    }
    
    if (announcement.targetDepartments.length === 0) {
      setSubmitStatus({
        show: true,
        success: false,
        message: 'Please select at least one department'
      });
      return;
    }

    try {
      setIsSubmitting(true);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('Authentication token not found');
      }
      
      // Prepare the announcement data
      const announcementData = {
        ...announcement,
        createdAt: new Date().toISOString(),
        // If no expiry date is set, default to 7 days from now
        expiryDate: announcement.expiryDate || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        createdByDepartment: adminDepartment,
        // Store the department that created this announcement
        createdBy: 'Admin'
      };
      
      // Send the announcement to the backend
      const response = await fetch('http://localhost:8080/api/announcements', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(announcementData)
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to post announcement');
      }
      
      const data = await response.json();
      
      // Show success message
      setSubmitStatus({
        show: true,
        success: true,
        message: 'Announcement posted successfully!'
      });
      
      // Reset form
      setAnnouncement({
        title: '',
        content: '',
        priority: 'normal',
        targetDepartments: [],
        expiryDate: '',
        createdByDepartment: adminDepartment
      });
      
      // Hide success message after 3 seconds
      setTimeout(() => {
        setSubmitStatus(prev => ({ ...prev, show: false }));
      }, 3000);
      
      // Call the callback to refresh announcements list
      if (onAnnouncementPosted) {
        onAnnouncementPosted();
      }
      
    } catch (error) {
      console.error('Error posting announcement:', error);
      
      setSubmitStatus({
        show: true,
        success: false,
        message: error.message || 'Failed to post announcement. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="announcement-form-container">
      <div className="section-header">
        <h2>Post Announcement</h2>
      </div>
      
      {submitStatus.show && (
        <div className={`status-message ${submitStatus.success ? 'success' : 'error'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="announcement-form">
        <div className="form-group">
          <label htmlFor="title">Announcement Title</label>
          <input
            type="text"
            id="title"
            name="title"
            value={announcement.title}
            onChange={handleInputChange}
            placeholder="Enter announcement title"
            className="form-control"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="content">Announcement Content</label>
          <textarea
            id="content"
            name="content"
            value={announcement.content}
            onChange={handleInputChange}
            placeholder="Enter announcement details"
            className="form-control"
            rows="4"
          />
        </div>
        
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="priority">Priority Level</label>
            <select
              id="priority"
              name="priority"
              value={announcement.priority}
              onChange={handleInputChange}
              className="form-control"
            >
              <option value="low">Low</option>
              <option value="normal">Normal</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="expiryDate">Expiry Date (Optional)</label>
            <input
              type="date"
              id="expiryDate"
              name="expiryDate"
              value={announcement.expiryDate}
              onChange={handleInputChange}
              className="form-control"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>
        </div>
        
        <div className="form-group">
          <label>Target Departments</label>
          <div className="checkbox-group">
            {departments.map(dept => (
              <div key={dept.id} className="checkbox-item">
                <input
                  type="checkbox"
                  id={`dept-${dept.id}`}
                  name="targetDepartments"
                  value={dept.id}
                  checked={announcement.targetDepartments.includes(dept.id)}
                  onChange={handleDepartmentChange}
                />
                <label htmlFor={`dept-${dept.id}`}>{dept.name}</label>
              </div>
            ))}
          </div>
        </div>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Posting...' : 'Post Announcement'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AnnouncementForm;