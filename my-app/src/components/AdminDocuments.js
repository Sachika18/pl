import React, { useState, useEffect } from 'react';
import './AdminDocuments.css';
import './DocumentsExtended.css'; // Import the extended CSS file
import { 
  File, Upload, Trash2, Eye, Download, Search, 
  Filter, AlertCircle, Clock, Plus, Edit, MessageSquare, Check, X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import AdminNavbar from './AdminNavbar';
import DocumentService from './services/DocumentService';
import fetchApi from '../utils/fetchApi';

const AdminDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [uploadModalOpen, setUploadModalOpen] = useState(false);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState({
    userId: '',
    userName: '',
    userEmail: '',
    documentName: '',
    description: '',
    deadline: '',
    forUserId: '',
    forUserName: '',
    forUserEmail: ''
  });
  const [users, setUsers] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [dragActive, setDragActive] = useState(false);

  // Load data using DocumentService
  useEffect(() => {
    // Load users from API with fallback to mock data
    const loadUsers = async () => {
      try {
        // First try to get users from API
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Try to get all users from API
            const usersResponse = await fetchApi.get('/users');
            console.log('Users API response:', usersResponse);
            
            if (Array.isArray(usersResponse) && usersResponse.length > 0) {
              // Format users to ensure they have name property
              const formattedUsers = usersResponse.map(user => ({
                ...user,
                // If user doesn't have a name property, create one from firstName and lastName
                name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
              }));
              
              setUsers(formattedUsers);
              return;
            }
          } catch (error) {
            console.error('Error fetching users from API:', error);
          }
        }
        
        // Fallback to DocumentService if API fails
        const response = await DocumentService.getUsers();
        setUsers(response.data);
      } catch (error) {
        console.error('Error loading users:', error);
      }
    };
    
    loadUsers();
    
    // Load all documents
    DocumentService.getAllDocuments()
      .then(response => {
        if (response.data && response.data.length > 0) {
          setDocuments(response.data);
        } else {
          // Sample documents if none exist
          const sampleDocuments = [
            { 
              id: 1, 
              name: 'Company Policy.pdf', 
              uploadedDate: '2025-04-15', 
              type: 'Policy', 
              size: '1.2 MB',
              uploadedBy: 'Admin',
              forUser: 'All Employees'
            },
            { 
              id: 2, 
              name: 'Tax Forms 2025.pdf', 
              uploadedDate: '2025-03-22', 
              type: 'Tax', 
              size: '850 KB',
              uploadedBy: 'Admin',
              forUser: 'All Employees'
            },
          ];
          setDocuments(sampleDocuments);
          
          // Save sample documents
          localStorage.setItem('admin_documents', JSON.stringify(sampleDocuments));
        }
      })
      .catch(error => {
        console.error('Error loading documents:', error);
      });
    
    // Load all document requests
    DocumentService.getAllDocumentRequests()
      .then(response => {
        if (response.data && response.data.length > 0) {
          setDocumentRequests(response.data);
        } else {
          // Sample requests if none exist
          const sampleRequests = [
            {
              id: 1,
              userId: 'user123',
              userName: 'John Doe',
              documentName: 'Salary Certificate',
              description: 'Need salary certificate for bank loan application',
              requestDate: '2025-04-10',
              status: 'Pending',
              deadline: '2025-04-20'
            },
            {
              id: 2,
              userId: 'user456',
              userName: 'Jane Smith',
              documentName: 'Experience Letter',
              description: 'Required for visa application',
              requestDate: '2025-04-08',
              status: 'Completed',
              deadline: '2025-04-15',
              completedDate: '2025-04-12'
            }
          ];
          setDocumentRequests(sampleRequests);
          
          // Save sample requests
          localStorage.setItem('document_requests', JSON.stringify(sampleRequests));
        }
      })
      .catch(error => {
        console.error('Error loading document requests:', error);
      });

    // Load all activities
    DocumentService.getAllActivities()
      .then(response => {
        if (response.data && response.data.length > 0) {
          setRecentActivities(response.data);
        } else {
          // Sample activities if none exist
          const sampleActivities = [
            {
              id: 1,
              type: 'upload',
              user: 'Admin',
              document: 'Company Policy.pdf',
              timestamp: '2025-04-15T10:30:00'
            },
            {
              id: 2,
              type: 'request',
              user: 'John Doe',
              document: 'Salary Certificate',
              timestamp: '2025-04-10T14:45:00'
            },
            {
              id: 3,
              type: 'complete',
              user: 'Admin',
              document: 'Experience Letter for Jane Smith',
              timestamp: '2025-04-12T09:15:00'
            }
          ];
          setRecentActivities(sampleActivities);
          
          // Save sample activities
          localStorage.setItem('document_activities', JSON.stringify(sampleActivities));
        }
      })
      .catch(error => {
        console.error('Error loading activities:', error);
      });
  }, []);

  // We no longer need this useEffect since DocumentService handles persistence
  // The data is now managed by the DocumentService

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  const handleFileUpload = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  const handleFiles = (files) => {
    setIsUploading(true);
    
    // Process each file
    const uploadPromises = Array.from(files).map((file, index) => {
      const newDoc = {
        id: Date.now() + index,
        name: file.name,
        uploadedDate: new Date().toISOString().split('T')[0],
        type: getFileType(file.name),
        size: formatFileSize(file.size || 1024 * 1024),
        uploadedBy: 'Admin',
        forUser: uploadModalOpen && currentRequest ? 
          (currentRequest.requestType === 'admin-to-user' ? currentRequest.forUserName : currentRequest.userName) : 
          'All Employees',
        forUserId: uploadModalOpen && currentRequest ? 
          (currentRequest.requestType === 'admin-to-user' ? currentRequest.forUserId : currentRequest.userId) : 
          null
      };
      
      // Use DocumentService to upload the document
      // If this is for a request, pass the request ID
      return DocumentService.uploadDocument(
        newDoc, 
        uploadModalOpen && currentRequest ? currentRequest.id : null
      );
    });
    
    // Wait for all uploads to complete
    Promise.all(uploadPromises)
      .then(responses => {
        // Get the uploaded documents
        const newDocs = responses.map(response => response.data);
        
        // Update the documents list
        setDocuments([...newDocs, ...documents]);
        
        // Add activities for each uploaded document
        const activityPromises = newDocs.map(doc => {
          const activityData = {
            type: 'upload',
            user: 'Admin',
            document: doc.name
          };
          
          return DocumentService.addActivity(activityData);
        });
        
        // Wait for all activities to be added
        return Promise.all(activityPromises);
      })
      .then(activityResponses => {
        // Get the added activities
        const newActivities = activityResponses.map(response => response.data);
        
        // Update the activities list
        setRecentActivities([...newActivities, ...recentActivities]);
        
        // If this was for a specific request, add a completion activity
        if (uploadModalOpen && currentRequest) {
          // Get the updated request
          DocumentService.getAllDocumentRequests()
            .then(response => {
              const updatedRequests = response.data;
              setDocumentRequests(updatedRequests);
              
              // Add a completion activity
              const completionActivity = {
                type: 'complete',
                user: 'Admin',
                document: currentRequest.requestType === 'admin-to-user' ? 
                  `${currentRequest.documentName} from ${currentRequest.forUserName}` : 
                  `${currentRequest.documentName} for ${currentRequest.userName}`
              };
              
              return DocumentService.addActivity(completionActivity);
            })
            .then(activityResponse => {
              setRecentActivities([activityResponse.data, ...recentActivities]);
              setUploadModalOpen(false);
            })
            .catch(error => {
              console.error('Error updating request status:', error);
            });
        } else {
          setUploadModalOpen(false);
        }
        
        setIsUploading(false);
        showToastNotification('Document(s) uploaded successfully!');
      })
      .catch(error => {
        console.error('Error uploading documents:', error);
        setIsUploading(false);
        showToastNotification('Error uploading documents. Please try again.');
      });
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'Policy';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'Image';
    if (['doc', 'docx'].includes(ext)) return 'Letter';
    if (['xls', 'xlsx'].includes(ext)) return 'Report';
    return 'Other';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = (id) => {
    const docToDelete = documents.find(doc => doc.id === id);
    
    // Use DocumentService to delete the document
    DocumentService.deleteDocument(id)
      .then(() => {
        // Update the documents list
        setDocuments(documents.filter(doc => doc.id !== id));
        
        // Add a delete activity
        const activityData = {
          type: 'delete',
          user: 'Admin',
          document: docToDelete.name
        };
        
        // Use DocumentService to add the activity
        return DocumentService.addActivity(activityData);
      })
      .then(response => {
        // Update the activities list
        setRecentActivities([response.data, ...recentActivities]);
        showToastNotification('Document deleted successfully!');
      })
      .catch(error => {
        console.error('Error deleting document:', error);
        showToastNotification('Error deleting document. Please try again.');
      });
  };

  const handlePreview = (document) => {
    setPreviewDocument(document);
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
    setPreviewDocument(null);
  };

  const showToastNotification = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
    }, 3000);
  };

  const openUploadModal = (request = null) => {
    if (request) {
      setCurrentRequest(request);
    }
    setUploadModalOpen(true);
  };

  const closeUploadModal = () => {
    setUploadModalOpen(false);
    setCurrentRequest(null);
  };

  const openRequestModal = () => {
    setRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
    setCurrentRequest({
      userId: '',
      userName: '',
      userEmail: '',
      documentName: '',
      description: '',
      deadline: '',
      forUserId: '',
      forUserName: '',
      forUserEmail: ''
    });
  };

  const handleRequestSubmit = (e) => {
    e.preventDefault();
    
    // Try to get admin info from localStorage or API
    const token = localStorage.getItem('token');
    let adminId = 'admin';
    let adminName = 'Admin User';
    let adminEmail = 'admin@example.com';
    let adminDepartment = 'Administration';
    let adminPosition = 'System Administrator';
    
    // If we have a token, try to get admin info from localStorage
    if (token) {
      const adminUser = localStorage.getItem('currentUser');
      if (adminUser) {
        try {
          const parsedAdmin = JSON.parse(adminUser);
          adminId = parsedAdmin.id || adminId;
          adminName = parsedAdmin.name || 
                     `${parsedAdmin.firstName || ''} ${parsedAdmin.lastName || ''}`.trim() || 
                     parsedAdmin.username || 
                     adminName;
          adminEmail = parsedAdmin.email || adminEmail;
          adminDepartment = parsedAdmin.department || adminDepartment;
          adminPosition = parsedAdmin.position || adminPosition;
        } catch (error) {
          console.error('Error parsing admin user from localStorage:', error);
        }
      }
    }
    
    // Save admin info to localStorage for other components to use
    localStorage.setItem('adminUser', JSON.stringify({
      id: adminId,
      name: adminName,
      email: adminEmail,
      department: adminDepartment,
      position: adminPosition
    }));
    
    // Add admin information to the request
    const requestWithAdminInfo = {
      ...currentRequest,
      userId: adminId,
      userName: adminName,
      userEmail: adminEmail,
      requestType: 'admin-to-user', // Indicates this is a request from admin to user
      // Include department and position if available
      forUserDepartment: currentRequest.forUserDepartment || '',
      forUserPosition: currentRequest.forUserPosition || ''
    };
    
    // Use DocumentService to create the request
    DocumentService.createDocumentRequest(requestWithAdminInfo)
      .then(response => {
        // Update the requests list
        setDocumentRequests([response.data, ...documentRequests]);
        
        // Add an activity
        const activityData = {
          type: 'request',
          user: 'Admin',
          document: `${response.data.documentName} from ${response.data.forUserName}`
        };
        
        // Use DocumentService to add the activity
        return DocumentService.addActivity(activityData);
      })
      .then(activityResponse => {
        // Update the activities list
        setRecentActivities([activityResponse.data, ...recentActivities]);
        
        closeRequestModal();
        showToastNotification('Document request sent successfully!');
      })
      .catch(error => {
        console.error('Error creating document request:', error);
        showToastNotification('Error sending request. Please try again.');
      });
  };

  const filteredDocuments = documents.filter(doc => {
    let matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (doc.forUser && doc.forUser.toLowerCase().includes(searchQuery.toLowerCase()));
    
    let matchesType = selectedType === 'All Types' || doc.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday, ' + date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      return formatDate(timestamp);
    }
  };

  return (
    <div>
      <AdminNavbar onSidebarToggle={() => {}} />
      <div className="admin-documents-container">
        {/* Sidebar */}
        <div className="sidebar">
          <div className="logo-container">
            <h1 className="logo">HRSystem</h1>
          </div>
          
          <nav className="sidebar-nav">
            <Link to="/dashboard" className="nav-item" style={{ "--animation-order": 1 }}>
              <div className="icon-container">🏠</div>
              <span>Dashboard</span>
            </Link>
            
            <Link to="/attendance" className="nav-item" style={{ "--animation-order": 2 }}>
              <div className="icon-container">📅</div>
              <span>Attendance</span>
            </Link>
            
            <Link to="/tasks" className="nav-item" style={{ "--animation-order": 3 }}>
              <div className="icon-container">📝</div>
              <span>Tasks</span>
            </Link>
            
            <Link to="/calendar" className="nav-item" style={{ "--animation-order": 4 }}>
              <div className="icon-container">🗓️</div>
              <span>Calendar</span>
            </Link>
            
            <Link to="/documents" className="nav-item active" style={{ "--animation-order": 5 }}>
              <div className="icon-container">📄</div>
              <span>Documents</span>
            </Link>
            
            <Link to="/notifications" className="nav-item" style={{ "--animation-order": 6 }}>
              <div className="icon-container">🔔</div>
              <span>Notifications</span>
            </Link>
            
            <Link to="/settings" className="nav-item" style={{ "--animation-order": 7 }}>
              <div className="icon-container">⚙️</div>
              <span>Settings</span>
            </Link>
          </nav>
          
          <div className="logout-container">
            <Link to="/login" className="nav-item">
              <div className="icon-container">🚪</div>
              <span>Logout</span>
            </Link>
          </div>
        </div>
        
        {/* Main Content */}
        <div className="main-content">
          {/* Documents Content */}
          <main className="admin-documents-content">
            <div className="welcome-banner">
              <div className="banner-content">
                <h1 className="banner-title">Document Management</h1>
                <p className="banner-subtitle">Upload, manage and respond to document requests</p>
                
                <div className="admin-actions">
                  <button className="action-button upload-action" onClick={() => openUploadModal()}>
                    <Upload size={18} />
                    <span>Upload Document</span>
                  </button>
                  
                  <button className="action-button request-action" onClick={openRequestModal}>
                    <MessageSquare size={18} />
                    <span>Request Document</span>
                  </button>
                </div>
              </div>
              
              <div className="banner-decoration">
                <File size={120} className="banner-icon" />
              </div>
            </div>
            
            {/* Document Requests Section */}
            <div className="requests-container">
              <div className="section-header">
                <h2 className="section-title">Document Requests</h2>
                <span className="badge">{documentRequests.filter(req => req.status === 'Pending').length} pending</span>
              </div>
              
              <div className="requests-list">
                {documentRequests.length > 0 ? (
                  documentRequests.map(request => (
                    <div 
                      key={request.id} 
                      className={`request-card ${request.status.toLowerCase()}`}
                    >
                      <div className="request-header">
                        <h3 className="request-title">{request.documentName}</h3>
                        <span className={`status-badge ${request.status.toLowerCase()}`}>
                          {request.status}
                        </span>
                      </div>
                      
                      <div className="request-details">
                        <p className="request-description">{request.description}</p>
                        <div className="request-meta">
                          {request.requestType === 'admin-to-user' ? (
                            <>
                              <div className="meta-item">
                                <span className="meta-label">Requested from:</span>
                                <span className="meta-value">{request.forUserName}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">Email:</span>
                                <span className="meta-value">{request.forUserEmail}</span>
                              </div>
                              {request.forUserDepartment && (
                                <div className="meta-item">
                                  <span className="meta-label">Department:</span>
                                  <span className="meta-value">{request.forUserDepartment}</span>
                                </div>
                              )}
                              {request.forUserPosition && (
                                <div className="meta-item">
                                  <span className="meta-label">Position:</span>
                                  <span className="meta-value">{request.forUserPosition}</span>
                                </div>
                              )}
                            </>
                          ) : (
                            <>
                              <div className="meta-item">
                                <span className="meta-label">Requested by:</span>
                                <span className="meta-value">{request.userName}</span>
                              </div>
                              <div className="meta-item">
                                <span className="meta-label">Email:</span>
                                <span className="meta-value">{request.userEmail || 'Not provided'}</span>
                              </div>
                              {request.userDepartment && (
                                <div className="meta-item">
                                  <span className="meta-label">Department:</span>
                                  <span className="meta-value">{request.userDepartment}</span>
                                </div>
                              )}
                              {request.userPosition && (
                                <div className="meta-item">
                                  <span className="meta-label">Position:</span>
                                  <span className="meta-value">{request.userPosition}</span>
                                </div>
                              )}
                            </>
                          )}
                          <div className="meta-item">
                            <span className="meta-label">Requested on:</span>
                            <span className="meta-value">{formatDate(request.requestDate)}</span>
                          </div>
                          <div className="meta-item">
                            <span className="meta-label">Deadline:</span>
                            <span className="meta-value">{formatDate(request.deadline)}</span>
                          </div>
                        </div>
                      </div>
                      
                      {request.status === 'Pending' && (
                        <div className="request-actions">
                          {/* Only show upload button for incoming requests from users */}
                          {!request.requestType && (
                            <button 
                              className="action-button upload-action"
                              onClick={() => openUploadModal(request)}
                            >
                              <Upload size={16} />
                              <span>Upload Document</span>
                            </button>
                          )}
                          
                          {/* Add delete button for admin-to-user requests */}
                          {request.requestType === 'admin-to-user' && (
                            <button 
                              className="action-button delete-action"
                              onClick={() => {
                                DocumentService.updateDocumentRequest(request.id, { status: 'Cancelled' })
                                  .then(response => {
                                    // Update the requests list
                                    const updatedRequests = documentRequests.map(req => 
                                      req.id === request.id ? response.data : req
                                    );
                                    setDocumentRequests(updatedRequests);
                                    
                                    // Add an activity
                                    const activityData = {
                                      type: 'cancel',
                                      user: 'Admin',
                                      document: `Request for ${request.documentName}`
                                    };
                                    
                                    return DocumentService.addActivity(activityData);
                                  })
                                  .then(activityResponse => {
                                    setRecentActivities([activityResponse.data, ...recentActivities]);
                                    showToastNotification('Request cancelled successfully!');
                                  })
                                  .catch(error => {
                                    console.error('Error cancelling request:', error);
                                    showToastNotification('Error cancelling request. Please try again.');
                                  });
                              }}
                            >
                              <Trash2 size={16} />
                              <span>Cancel Request</span>
                            </button>
                          )}
                        </div>
                      )}
                      
                      {request.status === 'Completed' && request.documentId && (
                        <div className="request-actions">
                          <button 
                            className="action-button download-action"
                            onClick={() => {
                              const document = documents.find(doc => doc.id === request.documentId);
                              if (document) {
                                // Download document instead of preview
                                window.open(document.fileUrl, '_blank');
                              }
                            }}
                          >
                            <Download size={16} />
                            <span>Download Document</span>
                          </button>
                        </div>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <h3 className="empty-state-title">No document requests</h3>
                    <p className="empty-state-text">
                      There are no document requests from employees at the moment.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            {/* Documents Table Container */}
            <div className="documents-table-container">
              <div className="table-header">
                <h2 className="section-title">All Documents</h2>
                
                <div className="filters">
                  <div className="search-documents">
                    <input 
                      type="text" 
                      placeholder="Search documents..." 
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    <Search size={18} className="search-icon" />
                  </div>
                  
                  <select 
                    className="type-filter"
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                  >
                    <option>All Types</option>
                    <option>Policy</option>
                    <option>Tax</option>
                    <option>Letter</option>
                    <option>Report</option>
                    <option>Image</option>
                    <option>Other</option>
                  </select>
                </div>
              </div>
              
              <div className="table-wrapper">
                {filteredDocuments.length > 0 ? (
                  <table className="documents-table">
                    <thead>
                      <tr>
                        <th>Document Name</th>
                        <th>Upload Date</th>
                        <th>Type</th>
                        <th>Size</th>
                        <th>For User</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDocuments.map((doc) => (
                        <tr key={doc.id} className="document-row" data-type={doc.type}>
                          <td className="document-name">
                            <File size={20} className="document-icon" />
                            <span>{doc.name}</span>
                          </td>
                          <td className="document-date">{formatDate(doc.uploadedDate)}</td>
                          <td className="document-type">
                            <span className="type-badge">{doc.type}</span>
                          </td>
                          <td className="document-size">{doc.size}</td>
                          <td className="document-user">{doc.forUser || 'All Employees'}</td>
                          <td className="document-actions">
                            <button 
                              className="action-button view-button" 
                              title="View"
                              onClick={() => handlePreview(doc)}
                            >
                              <Eye size={16} />
                            </button>
                            <button className="action-button download-button" title="Download">
                              <Download size={16} />
                            </button>
                            <button 
                              className="action-button delete-button" 
                              title="Delete"
                              onClick={() => handleDelete(doc.id)}
                            >
                              <Trash2 size={16} />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div className="empty-state">
                    <div className="empty-state-icon">📄</div>
                    <h3 className="empty-state-title">No documents found</h3>
                    <p className="empty-state-text">
                      Try uploading a new document or changing your search criteria.
                    </p>
                    <button className="empty-state-button" onClick={() => openUploadModal()}>
                      <Plus size={16} className="mr-2" />
                      Upload Document
                    </button>
                  </div>
                )}
              </div>
            </div>
            
            {/* Recent Activities */}
            <div className="activity-container">
              <div className="activity-header">
                <h2 className="section-title">Recent Activities</h2>
                <button className="view-all-button">View All</button>
              </div>
              
              <div className="activity-list">
                {recentActivities.slice(0, 5).map((activity) => (
                  <div key={activity.id} className="activity-item">
                    <div className={`activity-icon ${activity.type}-activity`}>
                      {activity.type === 'upload' && <Upload size={18} />}
                      {activity.type === 'download' && <Download size={18} />}
                      {activity.type === 'delete' && <Trash2 size={18} />}
                      {activity.type === 'request' && <MessageSquare size={18} />}
                      {activity.type === 'complete' && <Check size={18} />}
                    </div>
                    <div className="activity-details">
                      <p className="activity-text">
                        {activity.user} {getActivityText(activity.type)} {activity.document}
                      </p>
                      <p className="activity-time">{formatTimestamp(activity.timestamp)}</p>
                    </div>
                  </div>
                ))}
                
                {recentActivities.length === 0 && (
                  <div className="empty-activity">
                    <p>No recent activities</p>
                  </div>
                )}
              </div>
            </div>
          </main>
        </div>
      </div>
      
      {/* Upload Document Modal */}
      {uploadModalOpen && (
        <div className="modal-overlay" onClick={closeUploadModal}>
          <div className="upload-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {currentRequest 
                  ? (currentRequest.requestType === 'admin-to-user' 
                     ? `Document Request to ${currentRequest.forUserName}` 
                     : `Upload Document for ${currentRequest.userName}`)
                  : 'Upload Document'}
              </h3>
              <button className="close-button" onClick={closeUploadModal}>×</button>
            </div>
            
            <div className="modal-body">
              {currentRequest && (
                <div className="request-info">
                  <h4>Request Details</h4>
                  <p><strong>Document:</strong> {currentRequest.documentName}</p>
                  <p><strong>Description:</strong> {currentRequest.description}</p>
                  <p><strong>Deadline:</strong> {formatDate(currentRequest.deadline)}</p>
                </div>
              )}
              
              <div 
                className={`upload-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="upload-content">
                  <div className="upload-icon">
                    <Upload size={48} />
                  </div>
                  <h4>Drag & Drop Files Here</h4>
                  <p>or</p>
                  <label htmlFor="file-upload-modal" className="browse-button">
                    Browse Files
                  </label>
                  <input 
                    id="file-upload-modal" 
                    type="file" 
                    className="hidden-input" 
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png,.docx,.xlsx"
                    multiple
                  />
                  <p className="upload-info">
                    Allowed formats: .pdf, .jpg, .png, .docx, .xlsx (Max size: 10MB)
                  </p>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="cancel-button" onClick={closeUploadModal}>Cancel</button>
              <button 
                className="upload-button"
                disabled={isUploading}
              >
                {isUploading ? 'Uploading...' : 'Upload'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Request Document Modal */}
      {requestModalOpen && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Document from Employee</h3>
              <button className="close-button" onClick={closeRequestModal}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleRequestSubmit}>
                <div className="form-group">
                  <label htmlFor="forUser">Request Document From</label>
                  <select
                    id="forUser"
                    value={currentRequest.forUserId}
                    onChange={(e) => {
                      const selectedUser = users.find(user => user.id === e.target.value);
                      setCurrentRequest({
                        ...currentRequest, 
                        forUserId: e.target.value,
                        forUserName: selectedUser ? (
                          selectedUser.name || 
                          `${selectedUser.firstName || ''} ${selectedUser.lastName || ''}`.trim() || 
                          selectedUser.username || 
                          selectedUser.email
                        ) : '',
                        forUserEmail: selectedUser ? selectedUser.email : '',
                        forUserDepartment: selectedUser ? selectedUser.department : '',
                        forUserPosition: selectedUser ? selectedUser.position : ''
                      });
                    }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {users.map(user => {
                      const displayName = user.name || 
                        `${user.firstName || ''} ${user.lastName || ''}`.trim() || 
                        user.username || 
                        user.email;
                      
                      const displayInfo = user.department ? 
                        `${displayName} (${user.department})` : 
                        `${displayName} (${user.email})`;
                      
                      return (
                        <option key={user.id} value={user.id}>{displayInfo}</option>
                      );
                    })}
                  </select>
                </div>
                
                <div className="form-group">
                  <label htmlFor="userEmail">Employee Email</label>
                  <input 
                    type="email" 
                    id="userEmail" 
                    value={currentRequest.forUserEmail}
                    readOnly
                    placeholder="Email will be filled automatically"
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="documentName">Document Name</label>
                  <input 
                    type="text" 
                    id="documentName" 
                    value={currentRequest.documentName}
                    onChange={(e) => setCurrentRequest({...currentRequest, documentName: e.target.value})}
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label htmlFor="description">Description</label>
                  <textarea 
                    id="description" 
                    value={currentRequest.description}
                    onChange={(e) => setCurrentRequest({...currentRequest, description: e.target.value})}
                    required
                  ></textarea>
                </div>
                
                <div className="form-group">
                  <label htmlFor="deadline">Deadline</label>
                  <input 
                    type="date" 
                    id="deadline" 
                    value={currentRequest.deadline}
                    onChange={(e) => setCurrentRequest({...currentRequest, deadline: e.target.value})}
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>
                
                <div className="modal-footer">
                  <button type="button" className="cancel-button" onClick={closeRequestModal}>Cancel</button>
                  <button type="submit" className="submit-button">Send Request</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      
      {/* Document Preview Modal */}
      {isPreviewOpen && (
        <div className="preview-modal" onClick={closePreview}>
          <div className="preview-content" onClick={(e) => e.stopPropagation()}>
            <div className="preview-header">
              <h3>{previewDocument?.name}</h3>
              <button className="close-button" onClick={closePreview}>×</button>
            </div>
            <div className="preview-body">
              <div className="preview-placeholder">
                <File size={64} />
                <p>Preview not available. Please download the document to view it.</p>
              </div>
            </div>
            <div className="preview-footer">
              <button className="download-button">
                <Download size={16} />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-icon">✓</div>
          <div className="toast-message">{toastMessage}</div>
        </div>
      )}
    </div>
  );
};

// Helper function to get activity text based on type
const getActivityText = (type) => {
  switch (type) {
    case 'upload':
      return 'uploaded';
    case 'download':
      return 'downloaded';
    case 'delete':
      return 'deleted';
    case 'request':
      return 'requested';
    case 'complete':
      return 'completed';
    default:
      return 'interacted with';
  }
};

// We now import Check from lucide-react

export default AdminDocuments;