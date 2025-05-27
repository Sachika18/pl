import React, { useState, useEffect } from 'react';
import './Documents.css'; // Import the CSS file
import './DocumentsExtended.css'; // Import the extended CSS file
import fetchApi from '../utils/fetchApi';
import { 
  File, Upload, Trash2, Eye, Download, Search, 
  Bell, Calendar, CheckSquare, FileText, Settings, 
  LogOut, Filter, AlertCircle, Clock, Plus, Edit, MessageSquare
} from 'lucide-react';
import { Link } from 'react-router-dom';
import Navbar from './Navbar';
import DocumentService from './services/DocumentService';

const Documents = () => {
  const [documents, setDocuments] = useState([
    { id: 1, name: 'Offer Letter.pdf', uploadedDate: '2025-04-15', type: 'Contract', size: '420 KB' },
    { id: 2, name: 'ID Card.jpg', uploadedDate: '2025-03-22', type: 'ID Proof', size: '1.2 MB' },
    { id: 3, name: 'Performance Review Q1.pdf', uploadedDate: '2025-04-10', type: 'Review', size: '580 KB' },
    { id: 4, name: 'Medical Insurance.pdf', uploadedDate: '2025-01-30', type: 'Medical', size: '890 KB' },
    { id: 5, name: 'Emergency Contact.docx', uploadedDate: '2025-02-18', type: 'Personal', size: '340 KB' },
  ]);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [isUploading, setIsUploading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocument, setPreviewDocument] = useState(null);
  const [documentRequests, setDocumentRequests] = useState([]);
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [currentRequest, setCurrentRequest] = useState({
    documentName: '',
    description: '',
    deadline: '',
    forUserId: '',
    forUserName: '',
    forUserEmail: ''
  });
  const [users, setUsers] = useState([]);
  const [dragActive, setDragActive] = useState(false);
  const [recentActivities, setRecentActivities] = useState([]);
  const [adminRequests, setAdminRequests] = useState([]);

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
    
    // Load user documents
    DocumentService.getUserDocuments()
      .then(response => {
        if (response.data && response.data.length > 0) {
          setDocuments(response.data);
        } else {
          // Sample documents if none exist
          const sampleDocuments = [
            { id: 1, name: 'Offer Letter.pdf', uploadedDate: '2025-04-15', type: 'Contract', size: '420 KB' },
            { id: 2, name: 'ID Card.jpg', uploadedDate: '2025-03-22', type: 'ID Proof', size: '1.2 MB' },
            { id: 3, name: 'Performance Review Q1.pdf', uploadedDate: '2025-04-10', type: 'Review', size: '580 KB' }
          ];
          setDocuments(sampleDocuments);
          
          // Save sample documents
          localStorage.setItem('user_documents', JSON.stringify(sampleDocuments));
        }
      })
      .catch(error => {
        console.error('Error loading documents:', error);
      });
    
    // Load user document requests (requests made by the user)
    DocumentService.getUserDocumentRequests('user123')
      .then(response => {
        if (response.data && response.data.length > 0) {
          setDocumentRequests(response.data);
        }
      })
      .catch(error => {
        console.error('Error loading user document requests:', error);
      });
    
    // Load requests for the user (requests made for the user)
    DocumentService.getRequestsForUser('user123')
      .then(response => {
        console.log('Admin requests from API:', response.data);
        if (response.data && response.data.length > 0) {
          setAdminRequests(response.data);
        } else {
          // Sample admin-to-user requests if none exist
          const sampleAdminRequests = [
            {
              id: 101,
              userId: 'admin123',
              userName: 'Admin User',
              documentName: 'Performance Review Document',
              description: 'Please upload your self-assessment for Q2 review',
              requestDate: '2025-04-05',
              status: 'Pending',
              deadline: '2025-04-25',
              forUserId: 'user123',
              forUserName: 'Demo User',
              requestType: 'admin-to-user'
            },
            {
              id: 102,
              userId: 'admin123',
              userName: 'Admin User',
              documentName: 'Training Certificate',
              description: 'Please upload your completed training certificate',
              requestDate: '2025-04-08',
              status: 'Pending',
              deadline: '2025-04-20',
              forUserId: 'user123',
              forUserName: 'Demo User',
              requestType: 'admin-to-user'
            }
          ];
          console.log('Using sample admin requests:', sampleAdminRequests);
          setAdminRequests(sampleAdminRequests);
          
          // Save sample admin requests
          const allRequests = localStorage.getItem('document_requests');
          const parsedRequests = allRequests ? JSON.parse(allRequests) : [];
          localStorage.setItem('document_requests', JSON.stringify([...parsedRequests, ...sampleAdminRequests]));
        }
      })
      .catch(error => {
        console.error('Error loading requests for user:', error);
      });
    
    // Load activities
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
              document: 'ID Card.jpg',
              timestamp: '2025-03-22T10:30:00'
            },
            {
              id: 2,
              type: 'request',
              document: 'Salary Certificate',
              timestamp: '2025-04-10T14:45:00'
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
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 60000); // Update time every minute
    
    return () => clearInterval(timer);
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

  const handleFiles = (files, request = null) => {
    setIsUploading(true);
    
    // Process each file
    const uploadPromises = Array.from(files).map((file, index) => {
      const newDoc = {
        id: Date.now() + index,
        name: file.name,
        uploadedDate: new Date().toISOString().split('T')[0],
        type: getFileType(file.name),
        size: formatFileSize(file.size || 1024 * 1024),
        uploadedBy: 'Demo User',
        forUser: request ? request.userName : 'All Employees',
        forUserId: request ? request.userId : null
      };
      
      // Use DocumentService to upload the document
      // If this is for a request, pass the request ID
      return DocumentService.uploadDocument(
        newDoc, 
        request ? request.id : null
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
            user: 'Demo User',
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
        
        // If this was for a specific request, refresh the requests
        if (request) {
          // Get current user info
          let userName = 'Demo User';
          const token = localStorage.getItem('token');
          if (token) {
            const currentUser = localStorage.getItem('currentUser');
            if (currentUser) {
              try {
                const parsedUser = JSON.parse(currentUser);
                userName = parsedUser.name || 
                          `${parsedUser.firstName || ''} ${parsedUser.lastName || ''}`.trim() || 
                          parsedUser.username || 
                          userName;
              } catch (error) {
                console.error('Error parsing current user from localStorage:', error);
              }
            }
          }
          
          // Refresh requests for user
          DocumentService.getRequestsForUser()
            .then(response => {
              if (response.data && response.data.length > 0) {
                setAdminRequests(response.data);
              }
              
              // Add a completion activity
              const completionActivity = {
                type: 'complete',
                user: userName,
                document: `${request.documentName}`
              };
              
              // If this is a user-to-user request, add the requester name
              if (request.requestType === 'user-to-user') {
                completionActivity.document += ` for ${request.userName}`;
              } else {
                // Try to get admin name
                let adminName = 'Admin';
                try {
                  const adminUser = localStorage.getItem('adminUser');
                  if (adminUser) {
                    const parsedAdmin = JSON.parse(adminUser);
                    adminName = parsedAdmin.name || 'Admin';
                  }
                } catch (error) {
                  console.error('Error parsing admin user from localStorage:', error);
                }
                
                completionActivity.document += ` for ${adminName}`;
              }
              
              return DocumentService.addActivity(completionActivity);
            })
            .then(activityResponse => {
              setRecentActivities([activityResponse.data, ...recentActivities]);
              
              // Also refresh the document requests to update the UI
              DocumentService.getUserDocumentRequests()
                .then(response => {
                  if (response.data && response.data.length > 0) {
                    setDocumentRequests(response.data);
                  }
                })
                .catch(error => {
                  console.error('Error refreshing user document requests:', error);
                });
            })
            .catch(error => {
              console.error('Error refreshing requests:', error);
            });
        }
        
        setIsUploading(false);
        showToastNotification('Document uploaded successfully!');
      })
      .catch(error => {
        console.error('Error uploading documents:', error);
        setIsUploading(false);
        showToastNotification('Error uploading documents. Please try again.');
      });
  };
  
  const openRequestModal = () => {
    setRequestModalOpen(true);
  };

  const closeRequestModal = () => {
    setRequestModalOpen(false);
    setCurrentRequest({
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
    
    // Try to get user info from localStorage or API
    const token = localStorage.getItem('token');
    let userId = 'user123';
    let userName = 'Demo User';
    let userEmail = 'demo.user@example.com';
    let userDepartment = '';
    let userPosition = '';
    
    // If we have a token, try to get user info from localStorage
    if (token) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsedUser = JSON.parse(currentUser);
          userId = parsedUser.id || userId;
          userName = parsedUser.name || 
                    `${parsedUser.firstName || ''} ${parsedUser.lastName || ''}`.trim() || 
                    parsedUser.username || 
                    userName;
          userEmail = parsedUser.email || userEmail;
          userDepartment = parsedUser.department || '';
          userPosition = parsedUser.position || '';
        } catch (error) {
          console.error('Error parsing current user from localStorage:', error);
        }
      }
    }
    
    // Create request data with user info
    const requestData = {
      ...currentRequest,
      userId: userId,
      userName: userName,
      userEmail: userEmail,
      userDepartment: userDepartment,
      userPosition: userPosition,
      // Make sure requestType is set correctly
      requestType: currentRequest.requestType || (currentRequest.forUserId ? 'user-to-user' : 'user-to-admin')
    };
    
    // Use DocumentService to create the request
    DocumentService.createDocumentRequest(requestData)
      .then(response => {
        // Update local state with the new request
        setDocumentRequests([response.data, ...documentRequests]);
        
        // Add activity
        const activityData = {
          type: 'request',
          document: response.data.documentName,
          user: userName
        };
        
        if (requestData.requestType === 'user-to-user') {
          activityData.document += ` from ${requestData.forUserName}`;
        } else {
          // Try to get admin name from localStorage
          let adminName = 'Admin';
          try {
            const adminUser = localStorage.getItem('adminUser');
            if (adminUser) {
              const parsedAdmin = JSON.parse(adminUser);
              adminName = parsedAdmin.name || 'Admin';
            }
          } catch (error) {
            console.error('Error parsing admin user from localStorage:', error);
          }
          
          activityData.document += ` from ${adminName}`;
        }
        
        // Use DocumentService to add the activity
        DocumentService.addActivity(activityData)
          .then(activityResponse => {
            setRecentActivities([activityResponse.data, ...recentActivities]);
          });
        
        closeRequestModal();
        showToastNotification('Document request sent successfully!');
      })
      .catch(error => {
        console.error('Error creating document request:', error);
        showToastNotification('Error sending request. Please try again.');
      });
  };

  const getFileType = (fileName) => {
    const ext = fileName.split('.').pop().toLowerCase();
    if (ext === 'pdf') return 'Contract';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return 'ID Proof';
    if (['doc', 'docx'].includes(ext)) return 'Personal';
    if (['xls', 'xlsx'].includes(ext)) return 'Medical';
    return 'Review';
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleDelete = (id) => {
    const docToDelete = documents.find(doc => doc.id === id);
    setDocuments(documents.filter(doc => doc.id !== id));
    
    // Add to recent activities
    const newActivity = {
      id: Date.now(),
      type: 'delete',
      document: docToDelete.name,
      timestamp: new Date().toISOString()
    };
    
    setRecentActivities([newActivity, ...recentActivities]);
    showToastNotification('Document deleted successfully!');
  };

  const handlePreview = (document) => {
    // Instead of showing a preview, download the document
    handleDownload(document);
  };
  
  const handleDownload = (document) => {
    // In a real application, this would download the actual file
    // For demo purposes, we'll create a dummy file with the document name
    
    // Create a blob with some content
    const blob = new Blob([`This is a demo file for ${document.name}`], { type: 'text/plain' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const a = document.createElement('a');
    a.href = url;
    a.download = document.name;
    
    // Append the link to the body
    document.body.appendChild(a);
    
    // Click the link
    a.click();
    
    // Remove the link
    document.body.removeChild(a);
    
    // Add activity
    const activityData = {
      type: 'download',
      document: document.name,
      user: 'Demo User'
    };
    
    DocumentService.addActivity(activityData)
      .then(response => {
        setRecentActivities([response.data, ...recentActivities]);
      });
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

  const filteredDocuments = documents.filter(doc => {
    let matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.type.toLowerCase().includes(searchQuery.toLowerCase());
    
    let matchesType = selectedType === 'All Types' || doc.type === selectedType;
    
    return matchesSearch && matchesType;
  });

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const formatCurrentTime = (date) => {
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrentDate = (date) => {
    return date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
  };

  return (
    <div>
    <Navbar />
    <div className="documents-container">
      {/* Sidebar */}
      <div className="sidebar">
        <div className="logo-container">
          <h1 className="logo">HRSystem</h1>
        </div>
        
        <nav className="sidebar-nav">
          <Link to="/dashboard" className="nav-item" style={{ "--animation-order": 1, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">🏠</div>
            <span>Dashboard</span>
          </Link>
          
          <Link to="/attendance" className="nav-item" style={{ "--animation-order": 2, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">📅</div>
            <span>Attendance</span>
          </Link>
          
          <Link to="/tasks" className="nav-item" style={{ "--animation-order": 3, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">📝</div>
            <span>Tasks</span>
          </Link>
          
          <Link to="/calendar" className="nav-item" style={{ "--animation-order": 4, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">🗓️</div>
            <span>Calendar</span>
          </Link>
          
          <Link to="/documents" className="nav-item active" style={{ "--animation-order": 5, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">📄</div>
            <span>Documents</span>
          </Link>
          
          <Link to="/notifications" className="nav-item" style={{ "--animation-order": 6, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">🔔</div>
            <span>Notifications</span>
          </Link>
          
          <Link to="/settings" className="nav-item" style={{ "--animation-order": 7, color: 'inherit', textDecoration: 'none' }}>
            <div className="icon-container">⚙️</div>
            <span>Settings</span>
          </Link>
        </nav>
        
        <div className="logout-container">
          <Link to="/login" className="nav-item" style={{ color: 'inherit', textDecoration: 'none' }} onClick={() => localStorage.removeItem('token')}>
            <div className="icon-container">🚪</div>
            <span>Logout</span>
          </Link>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="main-content">
        {/* Header */}
        
        
        {/* Documents Content */}
        <main className="documents-content">
          <div className="welcome-banner">
            <div className="banner-content">
              <h1 className="banner-title">Documents</h1>
              <p className="banner-subtitle">Upload, view and manage your important documents</p>
              
              <div className="user-actions">
                <button className="action-button upload-action" onClick={() => document.getElementById('file-upload').click()}>
                  <Upload size={18} />
                  <span>Upload Document</span>
                </button>
                
                <button className="action-button request-action" onClick={openRequestModal}>
                  <MessageSquare size={18} />
                  <span>Request Document</span>
                </button>
                
                <input 
                  id="file-upload" 
                  type="file" 
                  className="hidden-input" 
                  onChange={handleFileUpload}
                  accept=".pdf,.jpg,.png,.docx,.xlsx"
                  disabled={isUploading}
                  multiple
                />
              </div>
              
              <div 
                className={`drop-area ${dragActive ? 'drag-active' : ''}`}
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
              >
                <div className="drop-content">
                  <Upload size={24} className="drop-icon" />
                  <p>Drag & drop files here to upload</p>
                  <span className="drop-info">
                    Allowed formats: .pdf, .jpg, .png, .docx, .xlsx (Max size: 10MB)
                  </span>
                </div>
              </div>
            </div>
            
            <div className="banner-decoration">
              <FileText size={120} className="banner-icon" />
            </div>
          </div>
          
          {/* Document Requests Section */}
          <div className="requests-container">
            <div className="section-header">
              <h2 className="section-title">Document Requests</h2>
              <div className="request-tabs">
                <button 
                  className="tab-button active" 
                  id="myRequestsTab"
                  onClick={() => {
                    document.getElementById('myRequestsTab').classList.add('active');
                    document.getElementById('adminRequestsTab').classList.remove('active');
                    document.getElementById('myRequestsList').style.display = 'block';
                    document.getElementById('adminRequestsList').style.display = 'none';
                  }}
                >
                  My Requests
                </button>
                <button 
                  className="tab-button" 
                  id="adminRequestsTab"
                  onClick={() => {
                    document.getElementById('adminRequestsTab').classList.add('active');
                    document.getElementById('myRequestsTab').classList.remove('active');
                    document.getElementById('adminRequestsList').style.display = 'block';
                    document.getElementById('myRequestsList').style.display = 'none';
                  }}
                >
                  Requests For Me
                </button>
              </div>
            </div>
            
            {/* My Requests List */}
            <div className="requests-list" id="myRequestsList">
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
                        {/* Show who the request is for */}
                        {request.requestType === 'user-to-user' ? (
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
                          <div className="meta-item">
                            <span className="meta-label">Requested from:</span>
                            <span className="meta-value">Admin</span>
                          </div>
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
                    
                    {request.status === 'Completed' && request.documentId && (
                      <div className="request-actions">
                        <button 
                          className="action-button view-button"
                          onClick={() => {
                            const document = documents.find(doc => doc.id === request.documentId);
                            if (document) {
                              handlePreview(document);
                            }
                          }}
                        >
                          <Eye size={16} />
                          <span>View Document</span>
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'Pending' && (
                      <div className="request-actions">
                        <button 
                          className="action-button cancel-button"
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
                                  user: 'Demo User',
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
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <h3 className="empty-state-title">No document requests</h3>
                  <p className="empty-state-text">
                    You haven't requested any documents yet. Click the "Request Document" button to make a request.
                  </p>
                  <button className="empty-state-button" onClick={openRequestModal}>
                    <MessageSquare size={16} className="mr-2" />
                    Request Document
                  </button>
                </div>
              )}
            </div>
            
            {/* Requests For Me List */}
            <div className="requests-list" id="adminRequestsList" style={{ display: 'none' }}>
              {adminRequests.length > 0 ? (
                adminRequests.map(request => (
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
                        <div className="meta-item">
                          <span className="meta-label">Requested by:</span>
                          <span className="meta-value">{request.userName}</span>
                        </div>
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
                        <input
                          type="file"
                          id={`file-upload-${request.id}`}
                          style={{ display: 'none' }}
                          onChange={(e) => {
                            if (e.target.files && e.target.files[0]) {
                              handleFiles(e.target.files, request);
                            }
                          }}
                        />
                        <button 
                          className="action-button upload-button"
                          onClick={() => document.getElementById(`file-upload-${request.id}`).click()}
                          style={{ display: 'flex' }} /* Force display */
                        >
                          <Upload size={16} />
                          <span>Upload Document</span>
                        </button>
                      </div>
                    )}
                    
                    {request.status === 'Completed' && request.documentId && (
                      <div className="request-actions">
                        <button 
                          className="action-button view-button"
                          onClick={() => {
                            const document = documents.find(doc => doc.id === request.documentId);
                            if (document) {
                              handlePreview(document);
                            }
                          }}
                        >
                          <Eye size={16} />
                          <span>View Document</span>
                        </button>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <div className="empty-state-icon">📄</div>
                  <h3 className="empty-state-title">No requests for you</h3>
                  <p className="empty-state-text">
                    You don't have any document requests from admin or other users yet.
                  </p>
                </div>
              )}
            </div>
          </div>
          
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
                  <option>Contract</option>
                  <option>ID Proof</option>
                  <option>Medical</option>
                  <option>Personal</option>
                  <option>Review</option>
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
                        <td className="document-actions">
                          <button 
                            className="action-button download-button" 
                            title="Download"
                            onClick={() => handleDownload(doc)}
                          >
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
                  <label htmlFor="empty-file-upload" className="empty-state-button">
                    <Plus size={16} className="mr-2" />
                    Upload Document
                  </label>
                  <input 
                    id="empty-file-upload" 
                    type="file" 
                    className="hidden-input" 
                    onChange={handleFileUpload}
                    accept=".pdf,.jpg,.png,.docx"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="activity-container">
            <div className="activity-header">
              <h2 className="section-title">Recent Activities</h2>
              <button className="view-all-button">View All</button>
            </div>
            
            <div className="activity-list">
              <div className="activity-item">
                <div className="activity-icon upload-activity">
                  <Upload size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You uploaded Medical Insurance.pdf</p>
                  <p className="activity-time">Today, 10:45 AM</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon download-activity">
                  <Download size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You downloaded Performance Review Q1.pdf</p>
                  <p className="activity-time">Yesterday, 3:20 PM</p>
                </div>
              </div>
              
              <div className="activity-item">
                <div className="activity-icon delete-activity">
                  <Trash2 size={18} />
                </div>
                <div className="activity-details">
                  <p className="activity-text">You deleted Outdated Policy.docx</p>
                  <p className="activity-time">April 26, 2025</p>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      
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
                <FileText size={64} />
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
      
      {/* Request Document Modal */}
      {requestModalOpen && (
        <div className="modal-overlay" onClick={closeRequestModal}>
          <div className="request-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Request Document</h3>
              <button className="close-button" onClick={closeRequestModal}>×</button>
            </div>
            
            <div className="modal-body">
              <form onSubmit={handleRequestSubmit}>
                <div className="form-group">
                  <label>Assign To</label>
                  <div className="assign-options">
                    <div className="assign-option">
                      <input 
                        type="radio" 
                        id="assignToAdmin" 
                        name="assignTo" 
                        value="admin"
                        defaultChecked
                        onChange={() => {
                          setCurrentRequest({
                            ...currentRequest,
                            forUserId: '',
                            forUserName: '',
                            forUserEmail: '',
                            forUserDepartment: '',
                            forUserPosition: '',
                            requestType: 'user-to-admin'
                          });
                        }}
                      />
                      <label htmlFor="assignToAdmin">Admin</label>
                    </div>
                    <div className="assign-option">
                      <input 
                        type="radio" 
                        id="assignToUser" 
                        name="assignTo" 
                        value="user"
                        onChange={() => {
                          setCurrentRequest({
                            ...currentRequest,
                            requestType: 'user-to-user'
                          });
                        }}
                      />
                      <label htmlFor="assignToUser">Another User</label>
                    </div>
                  </div>
                </div>
                
                {currentRequest.requestType === 'user-to-user' && (
                  <div className="form-group">
                    <label htmlFor="forUser">Select User</label>
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
                        required={currentRequest.requestType === 'user-to-user'}
                      >
                        <option value="">Select User</option>
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
                )}
                
                {currentRequest.requestType === 'user-to-user' && (
                  <div className="form-group">
                    <label htmlFor="userEmail">User Email</label>
                    <input 
                      type="email" 
                      id="userEmail" 
                      value={currentRequest.forUserEmail}
                      readOnly
                      placeholder="Email will be filled automatically"
                    />
                  </div>
                )}
                
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
                    placeholder="Please explain why you need this document and any specific requirements"
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
      
      {/* Toast Notification */}
      {showToast && (
        <div className="toast-notification">
          <div className="toast-icon">✓</div>
          <div className="toast-message">{toastMessage}</div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Documents;