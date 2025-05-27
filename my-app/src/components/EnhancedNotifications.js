import { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Bell, Settings, CheckCircle, Calendar, Mail, FileText, AlertTriangle, Clock, X, Filter, ArrowDown, Inbox, Archive, Trash2, PlusCircle, ChevronDown, Pin, MoreVertical, Home, User, ChevronLeft } from 'lucide-react';
import './EnhancedNotifications.css';
import Navbar from './Navbar';  
export default function EnhancedNotifications() {
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchNotifications();
  }, [activeTab]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      let endpoint = '/api/notifications';
      if (activeTab === 'unread') {
        endpoint = '/api/notifications/unread';
      } else if (activeTab === 'pinned') {
        endpoint = '/api/notifications/pinned';
      }

      const response = await axios.get(`http://localhost:8080${endpoint}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Format notifications from backend
      const formattedNotifications = response.data.map(notification => ({
        id: notification.id,
        title: notification.title,
        description: notification.description,
        time: formatTimeAgo(notification.createdAt),
        type: notification.type,
        priority: notification.priority,
        isUnread: !notification.read,
        isPinned: notification.pinned,
        actions: notification.actions || []
      }));
      
      setNotifications(formattedNotifications);
      
      // Fetch unread count
      const countResponse = await axios.get('http://localhost:8080/api/notifications/count', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setUnreadCount(countResponse.data.count);
      
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };
  
  const formatTimeAgo = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);
    
    if (diffDay > 0) {
      return diffDay === 1 ? 'Yesterday' : `${diffDay} days ago`;
    } else if (diffHour > 0) {
      return `${diffHour} hour${diffHour > 1 ? 's' : ''} ago`;
    } else if (diffMin > 0) {
      return `${diffMin} min ago`;
    } else {
      return 'Just now';
    }
  };
  
  const handleMarkAsRead = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.put(`http://localhost:8080/api/notifications/${id}/read`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, isUnread: false } : notification
        )
      );
      
      // Refresh unread count
      fetchNotifications();
      
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };
  
  const handleTogglePin = async (id) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;
      
      await axios.put(`http://localhost:8080/api/notifications/${id}/pin`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Update local state
      setNotifications(prevNotifications => 
        prevNotifications.map(notification => 
          notification.id === id ? { ...notification, isPinned: !notification.isPinned } : notification
        )
      );
      
      // Refresh notifications if on pinned tab
      if (activeTab === 'pinned') {
        fetchNotifications();
      }
      
    } catch (err) {
      console.error('Error toggling pin status:', err);
    }
  };
  
  const handleNotificationAction = (action, notification) => {
    // Mark notification as read when any action is taken
    if (notification.isUnread) {
      handleMarkAsRead(notification.id);
    }
    
    // Handle different actions based on the action text
    switch (action) {
      case 'View Details':
        if (notification.type === 'leave') {
          // Navigate to leave details
          window.location.href = '/leave-management';
        }
        break;
        
      case 'View Task':
        // Navigate to task details
        window.location.href = '/tasks';
        break;
        
      case 'Mark Complete':
        // Navigate to task details to mark as complete
        window.location.href = '/tasks';
        break;
        
      case 'Acknowledge':
        // Just mark as read
        break;
        
      default:
        console.log(`Action not implemented: ${action}`);
    }
  };
  
  // Sample notification data for demo purposes (will be used if backend is not available)
  const sampleNotifications = [
    {
      id: 1,
      title: 'Team Meeting Scheduled',
      description: 'The weekly team meeting has been scheduled for tomorrow at 10:00 AM.',
      time: '10 min ago',
      type: 'event',
      priority: 'high',
      isUnread: true,
      isPinned: true,
      actions: ['View Details', 'Add to Calendar']
    },
    {
      id: 2,
      title: 'Project Deadline Reminder',
      description: 'The UX Design project deadline is this Friday. Please ensure all deliverables are submitted by 5:00 PM.',
      time: '1 hour ago',
      type: 'document',
      priority: 'high',
      isUnread: true,
      isPinned: false,
      actions: ['View Project', 'Request Extension']
    },
    {
      id: 3,
      title: 'New Task Assignment',
      description: 'You have been assigned a new task: "Update the notification component UI".',
      time: '3 hours ago',
      type: 'message',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['View Task', 'Mark Complete']
    },
    {
      id: 4,
      title: 'Leave Request Approved',
      description: 'Your leave request for May 15-16 has been approved by HR.',
      time: 'Yesterday',
      type: 'leave',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['View Details']
    },
    {
      id: 5,
      title: 'System Maintenance',
      description: 'The HR system will be undergoing maintenance on Saturday from 10:00 PM to 2:00 AM.',
      time: 'Yesterday',
      type: 'system',
      priority: 'medium',
      isUnread: false,
      isPinned: false,
      actions: ['Set Reminder']
    }
  ];
  
  // Use sample data if there's an error or no notifications
  const displayNotifications = notifications.length > 0 ? notifications : (error ? sampleNotifications : []);

  // Filter notifications based on search query
  const filteredNotifications = displayNotifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          notification.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Get notification icon based on type
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'message':
        return <Mail size={16} />;
      case 'event':
        return <Calendar size={16} />;
      case 'leave':
        return <CheckCircle size={16} />;
      case 'document':
        return <FileText size={16} />;
      case 'system':
        return <AlertTriangle size={16} />;
      default:
        return <Bell size={16} />;
    }
  };

  // Get notification icon class based on type
  const getNotificationIconClass = (type) => {
    switch (type) {
      case 'message':
        return 'message-icon';
      case 'event':
        return 'event-icon';
      case 'leave':
        return 'leave-icon';
      case 'document':
        return 'document-icon';
      case 'system':
        return 'system-icon';
      default:
        return '';
    }
  };

  

  return (
    <div>
    <Navbar />
    <div className="w-full">
      

      {/* Main Content */}
      <div className="enhanced-notifications-container w-full px-4 py-6">
        <div className="notifications-header">
          <div className="notifications-title">
            <h2>
              <Bell size={18} />
              Notifications
              {unreadCount > 0 && <span className="notification-count">{unreadCount}</span>}
            </h2>
            <div className="notifications-actions">
              <button className="action-btn" onClick={() => setShowSettings(!showSettings)}>
                <Settings size={16} />
              </button>
            </div>
          </div>
          
          <div className="notifications-tabs">
            <button 
              className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`} 
              onClick={() => setActiveTab('all')}
            >
              All
            </button>
            <button 
              className={`tab-btn ${activeTab === 'unread' ? 'active' : ''}`} 
              onClick={() => setActiveTab('unread')}
            >
              Unread
            </button>
            <button 
              className={`tab-btn ${activeTab === 'pinned' ? 'active' : ''}`} 
              onClick={() => setActiveTab('pinned')}
            >
              Pinned
            </button>
          </div>

          <div className="notifications-actions">
            <div className="search-container">
              <Search size={16} className="search-icon" />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Search notifications..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button className="clear-search" onClick={() => setSearchQuery('')}>
                  <X size={14} />
                </button>
              )}
            </div>
            <div className="filter-dropdown">
              <button className="filter-btn">
                <Filter size={14} />
                Filter
                <ChevronDown size={14} />
              </button>
              <div className="filter-dropdown-content">
                <button>All Types</button>
                <button>Messages</button>
                <button>Events</button>
                <button>Documents</button>
                <button>System</button>
              </div>
            </div>
            <button className="action-btn mark-read" onClick={fetchNotifications} title="Refresh notifications">
              <Inbox size={16} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="settings-panel">
            <div className="settings-header">
              <h3>Notification Settings</h3>
              <button className="close-settings" onClick={() => setShowSettings(false)}>
                <X size={16} />
              </button>
            </div>
            <div className="settings-options">
              <div className="setting-option">
                <label>Email notifications</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-option">
                <label>Desktop notifications</label>
                <input type="checkbox" defaultChecked />
              </div>
              <div className="setting-option">
                <label>Sound alerts</label>
                <input type="checkbox" />
              </div>
              <div className="setting-option">
                <label>Show priority badges</label>
                <input type="checkbox" defaultChecked />
              </div>
            </div>
          </div>
        )}

        <div className="date-separator">
          <span>Today</span>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.isUnread ? 'unread' : ''} ${notification.isPinned ? 'pinned' : ''} ${notification.priority === 'high' ? 'high-priority' : notification.priority === 'medium' ? 'medium-priority' : ''}`}
              >
                {notification.isUnread && <div className="unread-indicator"></div>}
                <div 
                  className="notification-content"
                  onClick={() => notification.isUnread && handleMarkAsRead(notification.id)}
                >
                  <div className="notification-icon-container">
                    <div className={`notification-icon ${getNotificationIconClass(notification.type)}`}>
                      {getNotificationIcon(notification.type)}
                    </div>
                  </div>
                  <div className="notification-details">
                    <div className="notification-header">
                      <h3>{notification.title}</h3>
                      <div className="notification-metadata">
                        {notification.priority === 'high' && (
                          <span className="priority-badge high">High</span>
                        )}
                        {notification.priority === 'medium' && (
                          <span className="priority-badge medium">Medium</span>
                        )}
                        <div className="notification-time">
                          <Clock size={12} />
                          {notification.time}
                        </div>
                      </div>
                    </div>
                    <p className="notification-description">{notification.description}</p>
                    <div className="notification-actions">
                      {notification.actions.map((action, index) => (
                        <button 
                          key={index} 
                          className="notification-action-btn"
                          onClick={() => handleNotificationAction(action, notification)}
                        >
                          {action}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="notification-controls">
                  <button 
                    className={`control-btn pin-btn ${notification.isPinned ? 'active' : ''}`}
                    onClick={() => handleTogglePin(notification.id)}
                  >
                    <Pin size={14} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="no-notifications">
              <Bell size={48} />
              <h3>No notifications found</h3>
              <p>There are no notifications matching your current filters.</p>
              <button className="reset-filter-btn" onClick={() => {setActiveTab('all'); setSearchQuery('');}}>
                Reset Filters
              </button>
            </div>
          )}
        </div>

        <button className="view-more-btn">
          View More
        </button>
      </div>
    </div>
    </div>
  );
}