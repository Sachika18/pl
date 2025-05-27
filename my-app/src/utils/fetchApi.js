// A fetch-based API utility to replace axios

const API_BASE_URL = 'http://localhost:8080/api';

// Helper function to get the base URL
const getBaseUrl = () => {
  return API_BASE_URL;
};

// Helper function to normalize task status values
const normalizeTaskStatus = (data) => {
  if (!data) return data;
  
  // If it's a task object with a status field
  if (data.status) {
    // Convert to uppercase
    let status = data.status.toUpperCase();
    
    // Map ONGOING to IN_PROGRESS for backend compatibility
    if (status === 'ONGOING') {
      console.log(`Normalizing task status from ${status} to IN_PROGRESS`);
      data.status = 'IN_PROGRESS';
    }
  }
  
  // If it's an array of tasks
  if (Array.isArray(data)) {
    data.forEach(item => {
      if (item && item.status) {
        // Convert to uppercase
        let status = item.status.toUpperCase();
        
        // Map ONGOING to IN_PROGRESS for backend compatibility
        if (status === 'ONGOING') {
          console.log(`Normalizing task status from ${status} to IN_PROGRESS`);
          item.status = 'IN_PROGRESS';
        }
      }
    });
  }
  
  return data;
};

// Add a global function to fix task statuses in localStorage
window.fixWorklineTaskStatuses = () => {
  try {
    let fixed = 0;
    
    // Fix admin tasks
    const adminTasksJson = localStorage.getItem('workline_admin_tasks');
    if (adminTasksJson) {
      let adminTasks = JSON.parse(adminTasksJson);
      let modified = false;
      
      adminTasks = adminTasks.map(task => {
        if (task.status) {
          const oldStatus = task.status;
          // Convert to uppercase and ensure it's a valid enum
          let newStatus = task.status.toUpperCase();
          
          // Map any invalid statuses to valid ones
          if (newStatus === 'ONGOING') {
            newStatus = 'IN_PROGRESS';
            modified = true;
            fixed++;
            console.log(`Fixed admin task status: ${oldStatus} -> ${newStatus}`);
          }
          
          return { ...task, status: newStatus };
        }
        return task;
      });
      
      if (modified) {
        localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
      }
    }
    
    // Fix all tasks
    const tasksJson = localStorage.getItem('workline_tasks');
    if (tasksJson) {
      let allTasks = JSON.parse(tasksJson);
      let modified = false;
      
      allTasks = allTasks.map(task => {
        if (task.status) {
          const oldStatus = task.status;
          // Convert to uppercase and ensure it's a valid enum
          let newStatus = task.status.toUpperCase();
          
          // Map any invalid statuses to valid ones
          if (newStatus === 'ONGOING') {
            newStatus = 'IN_PROGRESS';
            modified = true;
            fixed++;
            console.log(`Fixed task status: ${oldStatus} -> ${newStatus}`);
          }
          
          return { ...task, status: newStatus };
        }
        return task;
      });
      
      if (modified) {
        localStorage.setItem('workline_tasks', JSON.stringify(allTasks));
      }
    }
    
    // Fix individual task status updates
    const allKeys = Object.keys(localStorage);
    const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
    
    taskStatusKeys.forEach(key => {
      try {
        const taskStatusJson = localStorage.getItem(key);
        if (taskStatusJson) {
          const taskStatus = JSON.parse(taskStatusJson);
          if (taskStatus && taskStatus.status) {
            const oldStatus = taskStatus.status;
            // Convert to uppercase and ensure it's a valid enum
            let newStatus = taskStatus.status.toUpperCase();
            
            // Map any invalid statuses to valid ones
            if (newStatus === 'ONGOING') {
              taskStatus.status = 'IN_PROGRESS';
              localStorage.setItem(key, JSON.stringify(taskStatus));
              fixed++;
              console.log(`Fixed individual task status: ${oldStatus} -> ${newStatus}`);
            }
          }
        }
      } catch (parseErr) {
        console.error(`Error fixing task status from ${key}:`, parseErr);
      }
    });
    
    console.log(`Fixed ${fixed} task status values in localStorage`);
    alert(`Fixed ${fixed} task status values. Please refresh the page.`);
    
    return fixed;
  } catch (e) {
    console.error('Error fixing task statuses:', e);
    alert('Error fixing task statuses: ' + e.message);
    return 0;
  }
};

// Helper function to handle common fetch options
const createFetchOptions = (method, data = null) => {
  const token = localStorage.getItem('token');
  
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    }
  };
  
  // Add authorization header if token exists
  if (token) {
    options.headers.Authorization = `Bearer ${token}`;
  }
  
  // Add body for POST, PUT, PATCH requests
  if (data && ['POST', 'PUT', 'PATCH'].includes(method)) {
    // Normalize task status values before sending to the API
    const normalizedData = normalizeTaskStatus(data);
    options.body = JSON.stringify(normalizedData);
  }
  
  return options;
};

// Helper function to handle response
const handleResponse = async (response) => {
  console.log(`Response status: ${response.status} for ${response.url}`);
  
  // Check if the response is ok (status in the range 200-299)
  if (!response.ok) {
    console.error(`Error response for ${response.url}:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...response.headers.entries()])
    });
    
    // Handle authentication errors
    if (response.status === 401 || response.status === 403) {
      console.error('Authentication error detected');
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      // Only redirect if we're not already on the login page
      if (!window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    
    // For 400 errors, provide more context
    if (response.status === 400) {
      console.error('Bad request error. This might be due to missing or invalid parameters.');
      
      // Check if it's a task status enum error
      if (response.url.includes('/tasks')) {
        console.error('If you are seeing a "No enum constant" error for task status, run this in the console to fix it:');
        console.error('window.fixWorklineTaskStatuses()');
      }
    }
    
    // For 500 errors, provide more context
    if (response.status === 500) {
      console.error('Server error occurred. This might be due to a database connection issue or an unhandled exception on the server.');
    }
    
    // Try to parse error response
    let errorData;
    try {
      const text = await response.text();
      console.log('Error response text:', text);
      try {
        errorData = text ? JSON.parse(text) : { message: response.statusText };
      } catch (jsonError) {
        console.error('Error parsing JSON response:', jsonError);
        errorData = { message: text || response.statusText };
      }
    } catch (e) {
      console.error('Error reading response text:', e);
      errorData = { message: response.statusText };
    }
    
    console.error('Error data:', errorData);
    
    // Create an error object with additional information
    const error = new Error(errorData.message || `HTTP error! Status: ${response.status}`);
    error.status = response.status;
    error.data = errorData;
    throw error;
  }
  
  // For empty responses (like 204 No Content)
  if (response.status === 204) {
    return null;
  }
  
  // Parse JSON response
  return await response.json();
};

// API methods
const fetchApi = {
  // Get base URL
  getBaseUrl: () => {
    return API_BASE_URL;
  },
  
  // GET request
  get: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('GET');
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`GET ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // POST request
  post: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('POST', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`POST ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // PUT request
  put: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('PUT', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`PUT ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // PATCH request
  patch: async (endpoint, data) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('PATCH', data);
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`PATCH ${endpoint} error:`, error);
      throw error;
    }
  },
  
  // DELETE request
  delete: async (endpoint) => {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const options = createFetchOptions('DELETE');
      
      const response = await fetch(url, options);
      return await handleResponse(response);
    } catch (error) {
      console.error(`DELETE ${endpoint} error:`, error);
      throw error;
    }
  }
};

export default fetchApi;