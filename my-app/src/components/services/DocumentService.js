import api from '../../utils/api';
import fetchApi from '../../utils/fetchApi';

// This service handles document-related operations
// It now uses the backend API with localStorage fallback for offline support

class DocumentService {
  // Get all documents (for admin)
  async getAllDocuments() {
    try {
      // Try to get documents from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/documents');
          console.log('Documents API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            localStorage.setItem('admin_documents', JSON.stringify(response));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching documents from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const documents = localStorage.getItem('admin_documents');
      return {
        data: documents ? JSON.parse(documents) : []
      };
    } catch (error) {
      console.error('Error getting documents:', error);
      return Promise.reject(error);
    }
  }

  // Get user documents
  async getUserDocuments(userId = null) {
    try {
      // Try to get documents from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/documents/user');
          console.log('User documents API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            localStorage.setItem('user_documents', JSON.stringify(response));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching user documents from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const documents = localStorage.getItem('user_documents');
      const parsedDocs = documents ? JSON.parse(documents) : [];
      
      // If userId is provided, filter documents for that user
      const filteredDocs = userId 
        ? parsedDocs.filter(doc => doc.forUserId === userId || doc.forUser === 'All Employees')
        : parsedDocs;
      
      return {
        data: filteredDocs
      };
    } catch (error) {
      console.error('Error getting user documents:', error);
      return Promise.reject(error);
    }
  }

  // Upload a document
  async uploadDocument(documentData, forRequestId = null) {
    try {
      // Try to upload document to API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          // Create FormData for file upload
          const formData = new FormData();
          
          // Add document metadata
          formData.append('name', documentData.name);
          formData.append('type', documentData.type);
          formData.append('size', documentData.size);
          
          if (documentData.forUser) {
            formData.append('forUser', documentData.forUser);
          }
          
          if (documentData.forUserId) {
            formData.append('forUserId', documentData.forUserId);
          }
          
          if (forRequestId) {
            formData.append('forRequestId', forRequestId);
          }
          
          // If we have an actual file object, add it
          if (documentData.file) {
            formData.append('file', documentData.file);
          }
          
          // Use fetch directly for FormData
          const url = `${fetchApi.getBaseUrl()}/documents`;
          const options = {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`
            },
            body: formData
          };
          
          const response = await fetch(url, options);
          if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
          }
          
          const uploadedDoc = await response.json();
          console.log('Document upload API response:', uploadedDoc);
          
          // Update local cache
          this.updateLocalDocumentCache(uploadedDoc);
          
          return { data: uploadedDoc };
        } catch (error) {
          console.error('Error uploading document to API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      // Add request ID if provided
      const docWithRequestId = forRequestId 
        ? { ...documentData, forRequestId } 
        : documentData;
      
      // Ensure the document has a unique ID
      if (!docWithRequestId.id) {
        docWithRequestId.id = Date.now() + Math.random();
      }
      
      // Update local storage
      this.updateLocalDocumentCache(docWithRequestId);
      
      // If this is for a request, update the request status
      if (forRequestId) {
        this.updateDocumentRequest(forRequestId, {
          status: 'Completed',
          completedDate: new Date().toISOString().split('T')[0],
          documentId: docWithRequestId.id
        });
      }
      
      return {
        data: docWithRequestId
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to update local document cache
  updateLocalDocumentCache(document) {
    // Update admin documents
    let adminDocuments = localStorage.getItem('admin_documents');
    adminDocuments = adminDocuments ? JSON.parse(adminDocuments) : [];
    
    // Check if document already exists (by ID)
    const existingAdminDocIndex = adminDocuments.findIndex(doc => doc.id === document.id);
    if (existingAdminDocIndex >= 0) {
      // Update existing document
      adminDocuments[existingAdminDocIndex] = document;
    } else {
      // Add new document
      adminDocuments = [document, ...adminDocuments];
    }
    
    localStorage.setItem('admin_documents', JSON.stringify(adminDocuments));
    
    // Update user documents
    let userDocuments = localStorage.getItem('user_documents');
    userDocuments = userDocuments ? JSON.parse(userDocuments) : [];
    
    // Check if document already exists (by ID)
    const existingUserDocIndex = userDocuments.findIndex(doc => doc.id === document.id);
    if (existingUserDocIndex >= 0) {
      // Update existing document
      userDocuments[existingUserDocIndex] = document;
    } else {
      // Add new document
      userDocuments = [document, ...userDocuments];
    }
    
    localStorage.setItem('user_documents', JSON.stringify(userDocuments));
  }

  // Delete a document
  async deleteDocument(documentId) {
    try {
      // Try to delete document from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          await fetchApi.delete(`/documents/${documentId}`);
          console.log('Document delete API response successful');
          
          // Update local cache after successful API call
          this.removeDocumentFromLocalCache(documentId);
          
          return { data: { id: documentId } };
        } catch (error) {
          console.error('Error deleting document from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      this.removeDocumentFromLocalCache(documentId);
      
      return {
        data: { id: documentId }
      };
    } catch (error) {
      console.error('Error deleting document:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to remove document from local cache
  removeDocumentFromLocalCache(documentId) {
    // Remove from admin documents
    let adminDocuments = localStorage.getItem('admin_documents');
    adminDocuments = adminDocuments ? JSON.parse(adminDocuments) : [];
    adminDocuments = adminDocuments.filter(doc => doc.id !== documentId);
    localStorage.setItem('admin_documents', JSON.stringify(adminDocuments));
    
    // Remove from user documents
    let userDocuments = localStorage.getItem('user_documents');
    userDocuments = userDocuments ? JSON.parse(userDocuments) : [];
    userDocuments = userDocuments.filter(doc => doc.id !== documentId);
    localStorage.setItem('user_documents', JSON.stringify(userDocuments));
    
    // Check if this document was for a request and update the request status
    let requests = localStorage.getItem('document_requests');
    if (requests) {
      requests = JSON.parse(requests);
      const relatedRequest = requests.find(req => req.documentId === documentId);
      
      if (relatedRequest) {
        this.updateDocumentRequest(relatedRequest.id, {
          status: 'Pending',
          completedDate: null,
          documentId: null
        });
      }
    }
  }

  // Get all document requests
  async getAllDocumentRequests() {
    try {
      // Try to get requests from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/document-requests');
          console.log('Document requests API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            localStorage.setItem('document_requests', JSON.stringify(response));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching document requests from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const requests = localStorage.getItem('document_requests');
      return {
        data: requests ? JSON.parse(requests) : []
      };
    } catch (error) {
      console.error('Error getting document requests:', error);
      return Promise.reject(error);
    }
  }

  // Get user document requests (requests made by the user)
  async getUserDocumentRequests(userId = null) {
    try {
      // Try to get user requests from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/document-requests/user');
          console.log('User document requests API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            // We'll store these separately to avoid conflicts with all requests
            const allRequests = localStorage.getItem('document_requests');
            const parsedAllRequests = allRequests ? JSON.parse(allRequests) : [];
            
            // Replace user requests in the all requests array
            const currentUserId = this.getCurrentUserId(userId);
            const filteredRequests = parsedAllRequests.filter(req => req.userId !== currentUserId);
            const updatedRequests = [...response, ...filteredRequests];
            
            localStorage.setItem('document_requests', JSON.stringify(updatedRequests));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching user document requests from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const currentUserId = this.getCurrentUserId(userId);
      const requests = localStorage.getItem('document_requests');
      const allRequests = requests ? JSON.parse(requests) : [];
      const userRequests = allRequests.filter(req => req.userId === currentUserId);
      
      return {
        data: userRequests
      };
    } catch (error) {
      console.error('Error getting user document requests:', error);
      return Promise.reject(error);
    }
  }
  
  // Get requests for a user (requests made for the user)
  async getRequestsForUser(userId = null) {
    try {
      // Try to get requests for user from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/document-requests/for-user');
          console.log('Requests for user API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            // We'll store these separately to avoid conflicts with all requests
            const allRequests = localStorage.getItem('document_requests');
            const parsedAllRequests = allRequests ? JSON.parse(allRequests) : [];
            
            // Replace requests for this user in the all requests array
            const currentUserId = this.getCurrentUserId(userId);
            const filteredRequests = parsedAllRequests.filter(req => req.forUserId !== currentUserId);
            const updatedRequests = [...response, ...filteredRequests];
            
            localStorage.setItem('document_requests', JSON.stringify(updatedRequests));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching requests for user from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const currentUserId = this.getCurrentUserId(userId);
      const requests = localStorage.getItem('document_requests');
      const allRequests = requests ? JSON.parse(requests) : [];
      const requestsForUser = allRequests.filter(req => req.forUserId === currentUserId);
      
      return {
        data: requestsForUser
      };
    } catch (error) {
      console.error('Error getting requests for user:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to get current user ID
  getCurrentUserId(userId = null) {
    // If userId is provided, use it
    if (userId) {
      return userId;
    }
    
    // Try to get current user from localStorage
    const token = localStorage.getItem('token');
    if (token) {
      const currentUser = localStorage.getItem('currentUser');
      if (currentUser) {
        try {
          const parsedUser = JSON.parse(currentUser);
          if (parsedUser.id) {
            return parsedUser.id;
          }
        } catch (error) {
          console.error('Error parsing current user from localStorage:', error);
        }
      }
    }
    
    // Fallback for demo
    return 'user123';
  }

  // Create a document request
  async createDocumentRequest(requestData) {
    try {
      // Try to create request via API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.post('/document-requests', requestData);
          console.log('Create document request API response:', response);
          
          // Update local cache
          this.addRequestToLocalCache(response);
          
          return { data: response };
        } catch (error) {
          console.error('Error creating document request via API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const newRequest = {
        id: Date.now().toString(),
        ...requestData,
        requestDate: new Date().toISOString().split('T')[0],
        status: 'Pending'
      };
      
      this.addRequestToLocalCache(newRequest);
      
      return {
        data: newRequest
      };
    } catch (error) {
      console.error('Error creating document request:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to add request to local cache
  addRequestToLocalCache(request) {
    let requests = localStorage.getItem('document_requests');
    requests = requests ? JSON.parse(requests) : [];
    
    // Add the new request
    requests = [request, ...requests];
    localStorage.setItem('document_requests', JSON.stringify(requests));
  }

  // Update a document request
  async updateDocumentRequest(requestId, updateData) {
    try {
      // Try to update request via API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.patch(`/document-requests/${requestId}/status`, { 
            status: updateData.status 
          });
          console.log('Update document request API response:', response);
          
          // Update local cache
          this.updateRequestInLocalCache(requestId, updateData);
          
          return { data: response };
        } catch (error) {
          console.error('Error updating document request via API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const updatedRequest = this.updateRequestInLocalCache(requestId, updateData);
      
      return {
        data: updatedRequest
      };
    } catch (error) {
      console.error('Error updating document request:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to update request in local cache
  updateRequestInLocalCache(requestId, updateData) {
    let requests = localStorage.getItem('document_requests');
    requests = requests ? JSON.parse(requests) : [];
    
    // Find the request to update
    const requestToUpdate = requests.find(req => req.id === requestId);
    if (!requestToUpdate) {
      return null;
    }
    
    // Update the request
    const updatedRequest = { ...requestToUpdate, ...updateData };
    
    // Replace in the array
    requests = requests.map(req => 
      req.id === requestId ? updatedRequest : req
    );
    
    localStorage.setItem('document_requests', JSON.stringify(requests));
    
    return updatedRequest;
  }

  // Add activity
  async addActivity(activityData) {
    try {
      // Try to add activity via API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.post('/document-activities', activityData);
          console.log('Add activity API response:', response);
          
          // Update local cache
          this.addActivityToLocalCache(response);
          
          return { data: response };
        } catch (error) {
          console.error('Error adding activity via API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const newActivity = {
        id: Date.now().toString(),
        ...activityData,
        timestamp: new Date().toISOString()
      };
      
      this.addActivityToLocalCache(newActivity);
      
      return {
        data: newActivity
      };
    } catch (error) {
      console.error('Error adding activity:', error);
      return Promise.reject(error);
    }
  }
  
  // Helper method to add activity to local cache
  addActivityToLocalCache(activity) {
    let activities = localStorage.getItem('document_activities');
    activities = activities ? JSON.parse(activities) : [];
    
    // Add the new activity
    activities = [activity, ...activities];
    localStorage.setItem('document_activities', JSON.stringify(activities));
  }

  // Get all activities
  async getAllActivities() {
    try {
      // Try to get activities from API
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const response = await fetchApi.get('/document-activities');
          console.log('Activities API response:', response);
          
          // Cache the response in localStorage for offline use
          if (Array.isArray(response)) {
            localStorage.setItem('document_activities', JSON.stringify(response));
            return { data: response };
          }
        } catch (error) {
          console.error('Error fetching activities from API:', error);
        }
      }
      
      // Fallback to localStorage if API fails
      const activities = localStorage.getItem('document_activities');
      return {
        data: activities ? JSON.parse(activities) : []
      };
    } catch (error) {
      console.error('Error getting activities:', error);
      return Promise.reject(error);
    }
  }
  
  // Get users from API with fallback to mock data
  async getUsers() {
    try {
      // Try to get token
      const token = localStorage.getItem('token');
      
      if (!token) {
        console.log('No token found, using mock data');
        return this.getMockUsers();
      }
      
      try {
        // First try to get current user from dashboard
        const dashboardResponse = await fetchApi.get('/dashboard');
        console.log('Dashboard response:', dashboardResponse);
        
        try {
          // Then try to get all users
          const usersResponse = await fetchApi.get('/users');
          console.log('Users response:', usersResponse);
          
          if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            // Format users to ensure they have name property
            const formattedUsers = usersResponse.map(user => ({
              ...user,
              // If user doesn't have a name property, create one from firstName and lastName
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
            }));
            
            // Save to localStorage for offline use
            localStorage.setItem('users', JSON.stringify(formattedUsers));
            
            return Promise.resolve({
              data: formattedUsers
            });
          } else {
            // If users endpoint returns empty or invalid data, use current user + mock data
            return this.combineCurrentUserWithMockUsers(dashboardResponse);
          }
        } catch (usersErr) {
          console.error('Error fetching all users:', usersErr);
          // Use current user + mock data
          return this.combineCurrentUserWithMockUsers(dashboardResponse);
        }
      } catch (dashboardErr) {
        console.error('Error fetching dashboard data:', dashboardErr);
        
        // Try users endpoint directly
        try {
          const usersResponse = await fetchApi.get('/users');
          if (Array.isArray(usersResponse) && usersResponse.length > 0) {
            // Format users to ensure they have name property
            const formattedUsers = usersResponse.map(user => ({
              ...user,
              name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username || user.email
            }));
            
            localStorage.setItem('users', JSON.stringify(formattedUsers));
            
            return Promise.resolve({
              data: formattedUsers
            });
          } else {
            return this.getMockUsers();
          }
        } catch (finalUsersErr) {
          console.error('Final attempt to fetch users failed:', finalUsersErr);
          return this.getMockUsers();
        }
      }
    } catch (error) {
      console.error('Unexpected error in getUsers:', error);
      return this.getMockUsers();
    }
  }
  
  // Helper method to get mock users
  getMockUsers() {
    // Check if users exist in localStorage
    let users = localStorage.getItem('users');
    
    if (users) {
      users = JSON.parse(users);
    } else {
      // Sample users for demo
      users = [
        { id: 'user123', name: 'John Doe', email: 'john.doe@example.com', department: 'Engineering', position: 'Software Developer' },
        { id: 'user456', name: 'Jane Smith', email: 'jane.smith@example.com', department: 'HR', position: 'HR Manager' },
        { id: 'user789', name: 'Bob Johnson', email: 'bob.johnson@example.com', department: 'Finance', position: 'Accountant' },
        { id: 'user101', name: 'Alice Williams', email: 'alice.williams@example.com', department: 'Marketing', position: 'Marketing Specialist' },
        { id: 'user102', name: 'Michael Brown', email: 'michael.brown@example.com', department: 'Engineering', position: 'QA Engineer' },
        { id: 'user103', name: 'Emily Davis', email: 'emily.davis@example.com', department: 'Sales', position: 'Sales Representative' },
        { id: 'user104', name: 'David Wilson', email: 'david.wilson@example.com', department: 'IT', position: 'System Administrator' },
        { id: 'user105', name: 'Sarah Martinez', email: 'sarah.martinez@example.com', department: 'Customer Support', position: 'Support Specialist' },
        { id: 'user106', name: 'James Taylor', email: 'james.taylor@example.com', department: 'Product', position: 'Product Manager' },
        { id: 'user107', name: 'Jennifer Anderson', email: 'jennifer.anderson@example.com', department: 'Legal', position: 'Legal Advisor' }
      ];
      
      // Save to localStorage
      localStorage.setItem('users', JSON.stringify(users));
    }
    
    return Promise.resolve({
      data: users
    });
  }
  
  // Helper method to combine current user with mock users
  combineCurrentUserWithMockUsers(currentUser) {
    if (currentUser && currentUser.id) {
      // Format current user to ensure it has name property
      const formattedCurrentUser = {
        ...currentUser,
        name: currentUser.name || 
              `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim() || 
              currentUser.username || 
              currentUser.email
      };
      
      // Get mock users
      const mockUsersResponse = this.getMockUsers();
      const mockUsers = mockUsersResponse.data;
      
      // Combine current user with mock users (excluding duplicates)
      const combinedUsers = [
        formattedCurrentUser,
        ...mockUsers.filter(user => user.id !== formattedCurrentUser.id)
      ];
      
      return Promise.resolve({
        data: combinedUsers
      });
    } else {
      return this.getMockUsers();
    }
  }
  
  // Add a new user (for demo purposes)
  addUser(userData) {
    try {
      // In a real implementation, this would be an API call:
      // return api.post('/users', userData);
      
      let users = localStorage.getItem('users');
      users = users ? JSON.parse(users) : [];
      
      // Generate a unique ID
      const newUser = {
        id: 'user' + Date.now(),
        ...userData
      };
      
      users.push(newUser);
      localStorage.setItem('users', JSON.stringify(users));
      
      return Promise.resolve({
        data: newUser
      });
    } catch (error) {
      console.error('Error adding user:', error);
      return Promise.reject(error);
    }
  }
}

export default new DocumentService();