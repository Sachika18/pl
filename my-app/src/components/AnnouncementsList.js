import React, { useState, useEffect } from 'react';
import './AnnouncementsList.css';

const AnnouncementsList = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedAnnouncement, setExpandedAnnouncement] = useState(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('Authentication token not found');
        }

        const response = await fetch('http://localhost:8080/api/announcements/active', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          }
        });

        if (!response.ok) {
          throw new Error(`Error: ${response.status}`);
        }

        const data = await response.json();
        
        // Sort announcements by priority and date
        const sortedAnnouncements = data.sort((a, b) => {
          // First sort by priority
          const priorityOrder = { 'urgent': 0, 'high': 1, 'normal': 2, 'low': 3 };
          const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
          
          if (priorityDiff !== 0) return priorityDiff;
          
          // Then sort by date (newest first)
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        
        setAnnouncements(sortedAnnouncements);
      } catch (error) {
        console.error('Error fetching announcements:', error);
        setError(error.message);
        
        // Use mock data as fallback
        const mockAnnouncements = [
          {
            id: '1',
            title: 'System Maintenance',
            content: 'The HR system will be down for maintenance this Saturday from 10 PM to 2 AM. Please complete any pending tasks before this time.',
            priority: 'high',
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '2',
            title: 'New Benefits Package',
            content: 'We are excited to announce our new employee benefits package. Details will be shared in the upcoming town hall meeting.',
            priority: 'normal',
            createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString()
          },
          {
            id: '3',
            title: 'Q2 Review Schedule',
            priority: 'urgent',
            createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
            expiryDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            content: 'The Q2 performance reviews will begin next week. Make sure to complete your self-assessment by Friday.'
          }
        ];
        
        setAnnouncements(mockAnnouncements);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  const toggleExpand = (id) => {
    if (expandedAnnouncement === id) {
      setExpandedAnnouncement(null);
    } else {
      setExpandedAnnouncement(id);
    }
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const getPriorityClass = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'priority-urgent';
      case 'high':
        return 'priority-high';
      case 'normal':
        return 'priority-normal';
      case 'low':
        return 'priority-low';
      default:
        return 'priority-normal';
    }
  };

  const getPriorityLabel = (priority) => {
    return priority.charAt(0).toUpperCase() + priority.slice(1);
  };

  if (loading) {
    return <div className="loading-spinner-small"></div>;
  }

  if (error && announcements.length === 0) {
    return <div className="announcements-error">Error loading announcements: {error}</div>;
  }

  if (announcements.length === 0) {
    return <div className="no-announcements">No announcements at this time.</div>;
  }

  return (
    <section className="announcements-section">
      <div className="section-header">
        <h2>Announcements</h2>
        <button>View All</button>
      </div>
      
      <div className="announcements-list">
        {announcements.map((announcement) => (
          <div 
            key={announcement.id} 
            className={`announcement-card ${getPriorityClass(announcement.priority)}`}
          >
            <div className="announcement-header">
              <h3>{announcement.title}</h3>
              <span className={`priority-badge ${getPriorityClass(announcement.priority)}`}>
                {getPriorityLabel(announcement.priority)}
              </span>
            </div>
            <p className="announcement-date">
              Posted: {formatDate(announcement.createdAt)}
            </p>
            <p className="announcement-content">
              {expandedAnnouncement === announcement.id 
                ? announcement.content 
                : announcement.content.length > 100 
                  ? `${announcement.content.substring(0, 100)}...` 
                  : announcement.content}
            </p>
            <div className="announcement-actions">
              {announcement.content.length > 100 && (
                <button 
                  className="btn-read-more"
                  onClick={() => toggleExpand(announcement.id)}
                >
                  {expandedAnnouncement === announcement.id ? 'Show Less' : 'Read More'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default AnnouncementsList;