

import React, { useState, useEffect } from 'react';
import fetchApi from '../utils/fetchApi';
import { mockUsers, mockTasks, createMockTask } from '../utils/mockData';
import { fixTaskStatuses, clearAllTaskData } from '../utils/taskStatusFix';
import './Admintask.css';
import AdminNavbar from './AdminNavbar';

const AdminTaskPage = () => {
  const [users, setUsers] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  
  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    dueDate: '',
  });

  // Function to fetch tasks
  const fetchTasks = async () => {
    try {
      console.log('Refreshing tasks...');
      
      // First, clean up any tasks with 'ongoing' status in localStorage
      try {
        console.log('Checking localStorage for tasks with ongoing status...');
        const storedTasks = localStorage.getItem('workline_admin_tasks');
        const tasksJson = localStorage.getItem('workline_tasks');
        
        // Fix admin tasks
        if (storedTasks) {
          let adminTasks = JSON.parse(storedTasks);
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
                console.log(`Fixed task status in localStorage: ${oldStatus} -> ${newStatus}`);
              }
              
              return { ...task, status: newStatus };
            }
            return task;
          });
          
          if (modified) {
            localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
            console.log('Updated admin tasks in localStorage with fixed status values');
          }
        }
        
        // Fix all tasks
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
                console.log(`Fixed task status in localStorage: ${oldStatus} -> ${newStatus}`);
              }
              
              return { ...task, status: newStatus };
            }
            return task;
          });
          
          if (modified) {
            localStorage.setItem('workline_tasks', JSON.stringify(allTasks));
            console.log('Updated all tasks in localStorage with fixed status values');
          }
        }
      } catch (cleanupErr) {
        console.error('Error cleaning up localStorage:', cleanupErr);
      }
      
      // Try different endpoints in sequence until one works
      let tasksResponse;
      let endpoint = '';
      
      try {
        // First get the current user's ID from dashboard
        const token = localStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }
        
        // Get user information first
        const userResponse = await fetchApi.get('/dashboard');
        const userId = userResponse.id;
        
        if (!userId) {
          throw new Error('Could not determine user ID');
        }
        
        // For admin, we should use the base /tasks endpoint first to get ALL tasks
        endpoint = '/tasks';
        console.log('Trying endpoint:', endpoint);
        
        // Add query parameters for pagination and sorting
        const queryParams = '?page=0&size=100&sort=createdAt,desc';
        tasksResponse = await fetchApi.get(endpoint + queryParams);
      } catch (tasksErr) {
        console.log('Base tasks endpoint failed:', tasksErr);
        console.log('Trying my-tasks endpoint as fallback');
        
        // Then try the my-tasks endpoint as fallback
        endpoint = '/tasks/my-tasks';
        console.log('Trying endpoint:', endpoint);
        tasksResponse = await fetchApi.get(endpoint);
      }
      
      console.log(`Tasks refresh response from ${endpoint}:`, tasksResponse);
      
      if (Array.isArray(tasksResponse)) {
        // If we got tasks, update the state
        setTasks(tasksResponse);
        
        // Also save to localStorage for offline access
        try {
          localStorage.setItem('workline_admin_tasks', JSON.stringify(tasksResponse));
          console.log('Saved admin tasks to localStorage');
        } catch (storageErr) {
          console.error('Error saving tasks to localStorage:', storageErr);
        }
      } else {
        console.error('Invalid tasks data format:', tasksResponse);
        
        // Try to get tasks from localStorage
        try {
          const storedTasks = localStorage.getItem('workline_admin_tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
              console.log('Using tasks from localStorage:', parsedTasks);
              setTasks(parsedTasks);
              return;
            }
          }
        } catch (localErr) {
          console.error('Error getting tasks from localStorage:', localErr);
        }
        
        // Don't overwrite existing tasks with mock data on refresh
        if (tasks.length === 0) {
          setTasks(mockTasks);
        }
      }
    } catch (taskErr) {
      console.error('Error refreshing tasks:', taskErr);
      
      // Try to get tasks from localStorage
      try {
        const storedTasks = localStorage.getItem('workline_admin_tasks');
        if (storedTasks) {
          const parsedTasks = JSON.parse(storedTasks);
          if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
            console.log('Using tasks from localStorage after error:', parsedTasks);
            setTasks(parsedTasks);
            return;
          }
        }
      } catch (localErr) {
        console.error('Error getting tasks from localStorage:', localErr);
      }
      
      // Don't overwrite existing tasks with mock data on refresh
      if (tasks.length === 0) {
        setTasks(mockTasks);
      }
    }
  };

  // Fetch users and tasks on component mount
  useEffect(() => {
    // First, clean up any invalid task status values in localStorage
    try {
      console.log('Cleaning up localStorage task status values...');
      const storedTasks = localStorage.getItem('workline_admin_tasks');
      const tasksJson = localStorage.getItem('workline_tasks');
      
      // Fix admin tasks
      if (storedTasks) {
        let adminTasks = JSON.parse(storedTasks);
        let modified = false;
        
        adminTasks = adminTasks.map(task => {
          if (task.status) {
            const oldStatus = task.status;
            // Convert to uppercase and ensure it's a valid enum
            let newStatus = task.status.toUpperCase();
            
            // Map any invalid statuses to valid ones
            if (newStatus === 'ONGOING') newStatus = 'IN_PROGRESS';
            if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(newStatus)) {
              newStatus = 'PENDING';
            }
            
            if (oldStatus !== newStatus) {
              modified = true;
              console.log(`Fixed task status: ${oldStatus} -> ${newStatus}`);
              return { ...task, status: newStatus };
            }
          }
          return task;
        });
        
        if (modified) {
          localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
          console.log('Updated admin tasks in localStorage with fixed status values');
        }
      }
      
      // Fix all tasks
      if (tasksJson) {
        let allTasks = JSON.parse(tasksJson);
        let modified = false;
        
        allTasks = allTasks.map(task => {
          if (task.status) {
            const oldStatus = task.status;
            // Convert to uppercase and ensure it's a valid enum
            let newStatus = task.status.toUpperCase();
            
            // Map any invalid statuses to valid ones
            if (newStatus === 'ONGOING') newStatus = 'IN_PROGRESS';
            if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(newStatus)) {
              newStatus = 'PENDING';
            }
            
            if (oldStatus !== newStatus) {
              modified = true;
              console.log(`Fixed task status: ${oldStatus} -> ${newStatus}`);
              return { ...task, status: newStatus };
            }
          }
          return task;
        });
        
        if (modified) {
          localStorage.setItem('workline_tasks', JSON.stringify(allTasks));
          console.log('Updated all tasks in localStorage with fixed status values');
        }
      }
      
      // Check for individual task status updates
      const allKeys = Object.keys(localStorage);
      const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
      
      if (taskStatusKeys.length > 0) {
        console.log(`Found ${taskStatusKeys.length} individual task status updates to fix`);
        
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
                if (newStatus === 'ONGOING') newStatus = 'IN_PROGRESS';
                if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(newStatus)) {
                  newStatus = 'PENDING';
                }
                
                if (oldStatus !== newStatus) {
                  taskStatus.status = newStatus;
                  localStorage.setItem(key, JSON.stringify(taskStatus));
                  console.log(`Fixed individual task status: ${oldStatus} -> ${newStatus}`);
                }
              }
            }
          } catch (parseErr) {
            console.error(`Error fixing task status from ${key}:`, parseErr);
          }
        });
      }
    } catch (cleanupErr) {
      console.error('Error cleaning up localStorage:', cleanupErr);
    }
    
    const fetchData = async () => {
      setLoading(true);
      console.log('Starting API calls...');
      
      let errorMessage = null;
      
      // Try to fetch user data
      try {
        console.log('Fetching users...');
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found');
          // Use mock data instead of redirecting
          console.log('Using mock user data as fallback');
          setUsers(mockUsers);
        } else {
          // Try to fetch all users first (admin should have access to all users)
          try {
            const usersResponse = await fetchApi.get('/users');
            console.log('Users response:', usersResponse);
            
            if (Array.isArray(usersResponse) && usersResponse.length > 0) {
              setUsers(usersResponse);
            } else {
              // If users endpoint returns empty or invalid data, try dashboard endpoint
              try {
                const dashboardResponse = await fetchApi.get('/dashboard');
                console.log('Dashboard response:', dashboardResponse);
                
                const currentUser = dashboardResponse;
                if (currentUser && currentUser.id) {
                  // Combine current user with mock users (excluding duplicates)
                  const combinedUsers = [
                    currentUser,
                    ...mockUsers.filter(user => user.id !== currentUser.id)
                  ];
                  setUsers(combinedUsers);
                } else {
                  setUsers(mockUsers);
                }
              } catch (dashboardErr) {
                console.error('Error fetching dashboard data:', dashboardErr);
                setUsers(mockUsers);
              }
            }
          } catch (usersErr) {
            console.error('Error fetching all users:', usersErr);
            
            // Try dashboard endpoint as fallback
            try {
              const dashboardResponse = await fetchApi.get('/dashboard');
              console.log('Dashboard response (fallback):', dashboardResponse);
              
              const currentUser = dashboardResponse;
              if (currentUser && currentUser.id) {
                const combinedUsers = [
                  currentUser,
                  ...mockUsers.filter(user => user.id !== currentUser.id)
                ];
                setUsers(combinedUsers);
              } else {
                setUsers(mockUsers);
              }
            } catch (dashboardErr) {
              console.error('Error fetching dashboard data:', dashboardErr);
              setUsers(mockUsers);
              errorMessage = 'Using demo mode due to server issues. Some features may be limited.';
            }
          }
        }
      } catch (error) {
        console.error('Unexpected error in user fetch logic:', error);
        setUsers(mockUsers);
        errorMessage = 'Using demo mode due to unexpected errors. Some features may be limited.';
      }
      
      // Try to fetch tasks data
      try {
        // First check localStorage for cached tasks
        try {
          const storedTasks = localStorage.getItem('workline_admin_tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
              console.log('Using cached tasks from localStorage:', parsedTasks);
              setTasks(parsedTasks);
              
              // Still fetch from API in the background to update cache
              fetchTasks().catch(err => {
                console.error('Background task refresh failed:', err);
              });
              
              // Skip the loading state since we already have data
              setLoading(false);
              return;
            }
          }
        } catch (cacheErr) {
          console.error('Error reading cached tasks:', cacheErr);
        }
        
        // If no cached tasks, fetch from API
        await fetchTasks();
      } catch (taskErr) {
        console.error('Error in initial task fetch:', taskErr);
        
        // Try localStorage one more time
        try {
          const storedTasks = localStorage.getItem('workline_admin_tasks');
          if (storedTasks) {
            const parsedTasks = JSON.parse(storedTasks);
            if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
              console.log('Using cached tasks after API error:', parsedTasks);
              setTasks(parsedTasks);
              setLoading(false);
              return;
            }
          }
        } catch (finalCacheErr) {
          console.error('Final cache read error:', finalCacheErr);
        }
        
        // Use mock tasks data as last resort
        console.log('Using mock tasks data as fallback');
        setTasks(mockTasks);
        
        if (!errorMessage) {
          errorMessage = 'Using demo task data due to server issues. Some features may be limited.';
        }
      }
      
      // Set error message if needed
      if (errorMessage) {
        setError(errorMessage);
        // Clear error after 5 seconds
        setTimeout(() => setError(null), 2500);
      }
      
      setLoading(false);
    };

    fetchData();
    
    // Add a button to clear localStorage if needed
    window.clearWorklineTasks = () => {
      try {
        localStorage.removeItem('workline_tasks');
        localStorage.removeItem('workline_admin_tasks');
        
        // Also clear individual task status updates
        const allKeys = Object.keys(localStorage);
        const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
        
        taskStatusKeys.forEach(key => {
          localStorage.removeItem(key);
        });
        
        console.log('Cleared all task data from localStorage');
        alert('Task data cleared. Please refresh the page.');
      } catch (err) {
        console.error('Error clearing localStorage:', err);
        alert('Error clearing task data: ' + err.message);
      }
    };
    
    // Set up a periodic refresh for tasks
    const refreshInterval = setInterval(() => {
      console.log('Running periodic task refresh...');
      fetchTasks().catch(err => {
        console.error('Periodic task refresh failed:', err);
      });
    }, 30000); // Refresh every 30 seconds
    
    // Clean up interval on component unmount
    return () => {
      clearInterval(refreshInterval);
    };
  }, []);  // Note: fetchTasks is defined in the component, so it doesn't need to be a dependency

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create a copy of the form data to avoid modifying the state directly
    const taskData = { ...formData };
    
    // Ensure we have a due date (required by the backend)
    if (!taskData.dueDate) {
      // Set default due date to 7 days from now if not provided
      const defaultDueDate = new Date();
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      taskData.dueDate = defaultDueDate.toISOString().split('T')[0];
    }
    
    // Add createdAt if not present
    if (!taskData.createdAt) {
      taskData.createdAt = new Date().toISOString();
    }
    
    // Add status if not present or ensure it's in the correct format
    if (!taskData.status) {
      taskData.status = 'PENDING'; // Use uppercase for backend enum
    } else if (typeof taskData.status === 'string') {
      // Convert to uppercase to match backend enum
      taskData.status = taskData.status.toUpperCase();
      
      // Map ONGOING to IN_PROGRESS for backend compatibility
      if (taskData.status === 'ONGOING') {
        taskData.status = 'IN_PROGRESS';
      }
      
      // Ensure it's one of the valid enum values
      if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(taskData.status)) {
        console.warn(`Invalid status value: ${taskData.status}, defaulting to PENDING`);
        taskData.status = 'PENDING';
      }
    }
    
    console.log('Submitting task with data:', taskData);
    
    try {
      // Attempt to create task via API
      const response = await fetchApi.post('/tasks', taskData);
      console.log('Task created successfully:', response);
      
      // Add the new task to the tasks list immediately for better UX
      if (response && response.id) {
        // Create a complete task object with all necessary fields
        const newTask = {
          ...response,
          // Ensure these fields exist even if the API doesn't return them
          status: response.status || taskData.status || 'PENDING',
          createdAt: response.createdAt || taskData.createdAt || new Date().toISOString(),
          lastUpdated: new Date().toISOString()
        };
        
        setTasks(prevTasks => [...prevTasks, newTask]);
        
        // Also update localStorage
        try {
          const storedTasks = localStorage.getItem('workline_admin_tasks');
          let adminTasks = storedTasks ? JSON.parse(storedTasks) : [];
          adminTasks.push(newTask);
          localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
          console.log('Updated admin tasks in localStorage');
        } catch (storageErr) {
          console.error('Error updating localStorage:', storageErr);
        }
      }
      
      // Add a small delay before refreshing to ensure the server has processed the request
      setTimeout(async () => {
        try {
          console.log('Refreshing tasks after creation...');
          // Refresh tasks from the server to ensure we have the latest data
          await fetchTasks();
        } catch (refreshErr) {
          console.error('Error refreshing tasks after creation:', refreshErr);
          // The task was already added to the list above, so no need to handle this error further
          
          // Try to get tasks from localStorage as fallback
          try {
            const storedTasks = localStorage.getItem('workline_admin_tasks');
            if (storedTasks) {
              const parsedTasks = JSON.parse(storedTasks);
              if (Array.isArray(parsedTasks) && parsedTasks.length > 0) {
                console.log('Using tasks from localStorage after refresh error:', parsedTasks);
                setTasks(parsedTasks);
              }
            }
          } catch (localErr) {
            console.error('Error getting tasks from localStorage:', localErr);
          }
        }
      }, 1500); // Increased delay to give server more time to process
      
      // Show success message
      setSuccessMessage('Task created successfully!');
      setTimeout(() => setSuccessMessage(''), 2000);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
      });
      
    } catch (err) {
      console.error('Error creating task:', err);
      
      // Log detailed error information
      if (err.status) {
        console.error('Error status:', err.status);
        console.error('Error data:', err.data);
      } else {
        console.error('Error message:', err.message);
      }
      
      // Create a mock task as fallback
      const mockTask = createMockTask(taskData);
      console.log('Created mock task:', mockTask);
      setTasks(prevTasks => [...prevTasks, mockTask]);
      
      // Also update localStorage with the mock task
      try {
        const storedTasks = localStorage.getItem('workline_admin_tasks');
        let adminTasks = storedTasks ? JSON.parse(storedTasks) : [];
        adminTasks.push(mockTask);
        localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
        console.log('Updated admin tasks in localStorage with mock task');
      } catch (storageErr) {
        console.error('Error updating localStorage:', storageErr);
      }
      
      // Show a modified success message
      setSuccessMessage('Task created in demo mode. Server connection issues detected.');
      setTimeout(() => setSuccessMessage(''), 2500);
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        assignedTo: '',
        dueDate: '',
      });
    }
  };

  // Delete a task
  const handleDeleteTask = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        // First, remove the task from local state immediately for better UX
        setTasks(prevTasks => prevTasks.filter(task => 
          task.id !== taskId && 
          (task._id !== taskId) && 
          (task.id?.toString() !== taskId?.toString())
        ));
        
        // Also update localStorage
        try {
          const storedTasks = localStorage.getItem('workline_admin_tasks');
          if (storedTasks) {
            let adminTasks = JSON.parse(storedTasks);
            adminTasks = adminTasks.filter(task => 
              task.id !== taskId && 
              (task._id !== taskId) && 
              (task.id?.toString() !== taskId?.toString())
            );
            localStorage.setItem('workline_admin_tasks', JSON.stringify(adminTasks));
            console.log('Updated admin tasks in localStorage after deletion');
          }
        } catch (storageErr) {
          console.error('Error updating localStorage after deletion:', storageErr);
        }
        
        // Attempt to delete via API
        await fetchApi.delete(`/tasks/${taskId}`);
        console.log('Task deleted successfully:', taskId);
        
        // Add a small delay before refreshing to ensure the server has processed the request
        setTimeout(async () => {
          try {
            // Refresh tasks from the server to ensure we have the latest data
            await fetchTasks();
          } catch (refreshErr) {
            console.error('Error refreshing tasks after deletion:', refreshErr);
            // Task was already removed from UI, so no further action needed
          }
        }, 1000); // Increased delay to give server more time
        
        setSuccessMessage('Task deleted successfully!');
        setTimeout(() => setSuccessMessage(''), 2000);
      } catch (err) {
        console.error('Error deleting task:', err);
        
        // Log detailed error information
        if (err.status) {
          console.error('Error status:', err.status);
          console.error('Error data:', err.data);
        } else {
          console.error('Error message:', err.message);
        }
        
        // Task was already removed from the local state above
        setSuccessMessage('Task removed in demo mode. Server connection issues detected.');
        setTimeout(() => setSuccessMessage(''), 2500);
      }
    }
  };

  // Get user full name by ID with robust error handling
  const getUserFullName = (userId) => {
    try {
      if (!userId) {
        console.log('No user ID provided');
        return 'Unassigned';
      }
      
      if (!users || !Array.isArray(users) || users.length === 0) {
        console.log('No users available');
        return 'User #' + userId.substring(0, 5);
      }
      
      // Try to find user by exact ID match first
      let user = users.find(user => user.id === userId);
      
      // If not found, try case-insensitive comparison (helps with MongoDB ObjectId vs string issues)
      if (!user) {
        user = users.find(user => 
          user.id && userId && 
          user.id.toString().toLowerCase() === userId.toString().toLowerCase()
        );
      }
      
      // If still not found, try substring match (in case of truncated IDs)
      if (!user && userId.length > 5) {
        user = users.find(user => 
          user.id && user.id.includes(userId) || 
          (userId.includes(user.id))
        );
      }
      
      // If user is found, return their name
      if (user) {
        const firstName = user.firstName || '';
        const lastName = user.lastName || '';
        const fullName = `${firstName} ${lastName}`.trim();
        
        return fullName || 'User #' + userId.substring(0, 5);
      }
      
      // Log the issue for debugging
      console.log('User not found with ID:', userId);
      console.log('Available users:', users.map(u => ({ id: u.id, name: `${u.firstName} ${u.lastName}` })));
      
      // Return a formatted user ID as fallback
      return 'User #' + userId.substring(0, 5);
    } catch (error) {
      console.error('Error getting user name:', error);
      return 'User #' + (userId ? userId.substring(0, 5) : 'Unknown');
    }
  };

  // Format status for display with error handling
  const formatStatus = (status) => {
    try {
      if (!status) return 'Pending';
      
      // Handle case where status might be an object instead of a string
      const statusText = typeof status === 'string' ? status : String(status);
      
      // Convert from backend enum format (e.g., "PENDING") to display format (e.g., "Pending")
      switch (statusText.toUpperCase()) {
        case 'PENDING':
          return 'Pending';
        case 'ONGOING':
        case 'IN_PROGRESS':
          return 'In Progress';
        case 'COMPLETED':
          return 'Completed';
        case 'CANCELLED':
        case 'CANCELED':
          return 'Cancelled';
        default:
          // For any other status, just capitalize first letter
          return statusText.charAt(0).toUpperCase() + statusText.slice(1).toLowerCase();
      }
    } catch (error) {
      console.error('Error formatting status:', error);
      return 'Pending';
    }
  };

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div>
      <AdminNavbar />
      <div className="admin-task-container">
      <div className="admin-header">
        <h1>Task Management</h1>
        <div className="admin-actions">
          <button 
            className="refresh-button" 
            onClick={() => {
              fetchTasks();
              setSuccessMessage('Tasks refreshed');
              setTimeout(() => setSuccessMessage(''), 1500);
            }}
          >
            Refresh Tasks
          </button>
          
          <button 
            className="fix-status-button" 
            onClick={() => {
              const fixed = fixTaskStatuses();
              setSuccessMessage(`Fixed ${fixed} task status values. Refreshing data...`);
              
              // Refresh tasks after fixing
              setTimeout(() => {
                fetchTasks().catch(err => {
                  console.error('Task refresh after fixing statuses failed:', err);
                });
                
                // Clear success message after 3 seconds
                setTimeout(() => {
                  setSuccessMessage('');
                }, 3000);
              }, 1000);
            }}
            title="Fix any 'ongoing' status values in localStorage to 'IN_PROGRESS'"
          >
            Fix Task Statuses
          </button>
          
          <button 
            className="clear-data-button" 
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all task data from localStorage? This cannot be undone.')) {
                clearAllTaskData();
                setSuccessMessage('All task data cleared. Refreshing...');
                
                // Refresh after clearing
                setTimeout(() => {
                  window.location.reload();
                }, 1500);
              }
            }}
            title="Clear all task data from localStorage"
          >
            Clear Task Data
          </button>
        </div>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {successMessage && <div className="success-message">{successMessage}</div>}
      
      <div className="task-form-container">
        <h2>Create New Task</h2>
        <form onSubmit={handleSubmit} className="task-form">
          <div className="form-group">
            <label htmlFor="title">Task Title</label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="assignedTo">Assign To</label>
            <select
              id="assignedTo"
              name="assignedTo"
              value={formData.assignedTo}
              onChange={handleInputChange}
              required
            >
              <option value="">Select a user</option>
              {users.map(user => (
                <option key={user.id} value={user.id}>
                  {user.firstName} {user.lastName} ({user.position})
                </option>
              ))}
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="dueDate">Due Date</label>
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate}
              onChange={handleInputChange}
              required
            />
          </div>
          
          <button type="submit" className="submit-btn">Create Task</button>
        </form>
      </div>
      
      <div className="tasks-overview">
        <h2>All Tasks</h2>
        
        {tasks.length === 0 ? (
          <p className="no-tasks">No tasks have been created yet.</p>
        ) : (
          <table className="tasks-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Assigned To</th>
                <th>Due Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {tasks.map(task => {
                try {
                  // Log task for debugging
                  console.log('Rendering task:', task);
                  
                  // Get task ID safely
                  const taskId = task.id || task._id || '';
                  
                  // Safely get status with fallback - convert to lowercase for CSS classes
                  let status = 'pending';
                  if (task.status) {
                    // Map backend enum values to CSS class names
                    const statusUpper = task.status.toUpperCase();
                    if (statusUpper === 'PENDING') status = 'pending';
                    else if (statusUpper === 'ONGOING' || statusUpper === 'IN_PROGRESS') status = 'ongoing';
                    else if (statusUpper === 'COMPLETED') status = 'completed';
                    else if (statusUpper === 'CANCELLED' || statusUpper === 'CANCELED') status = 'cancelled';
                    else status = task.status.toLowerCase();
                  }
                  
                  // Safely format date with fallback
                  let formattedDate = 'No date';
                  try {
                    if (task.dueDate) {
                      formattedDate = new Date(task.dueDate).toLocaleDateString();
                    }
                  } catch (dateError) {
                    console.error('Error formatting date:', dateError);
                  }
                  
                  // Get assigned user safely
                  const assignedTo = task.assignedTo || task.assignedToId || '';
                  
                  return (
                    <tr key={taskId || Math.random().toString()} className={`status-${status}`}>
                      <td>{task.title || 'Untitled Task'}</td>
                      <td>{getUserFullName(assignedTo)}</td>
                      <td>{formattedDate}</td>
                      <td>
                        <span className={`status-badge ${status}`}>
                          {formatStatus(task.status)}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteTask(taskId)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  );
                } catch (renderError) {
                  console.error('Error rendering task row:', renderError, task);
                  return null; // Skip rendering this row if there's an error
                }
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
    </div>
  );
};

export default AdminTaskPage;