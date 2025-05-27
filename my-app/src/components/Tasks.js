import React, { useState, useEffect } from 'react';
import { mockTasks } from '../utils/mockData';
import './Tasks.css';
import Navbar from './Navbar';
import TaskService from './services/TaskService';

const TaskPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedTask, setSelectedTask] = useState(null);

  // Fetch tasks for the logged-in user
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        setError(null);
        console.log('Tasks: Fetching tasks for logged-in user');
        
        const token = localStorage.getItem('token');
        const userEmail = localStorage.getItem('userEmail');
        
        if (!token) {
          console.log('Tasks: No authentication token found. Using mock data.');
          setTasks(mockTasks);
          setLoading(false);
          setError('Using demo mode. Some features may be limited.');
          setTimeout(() => setError(null), 2500);
          return;
        }
        
        // First check localStorage for the most up-to-date task data
        try {
          console.log('Tasks: Checking localStorage for tasks');
          const localTasks = await TaskService.getMyTasks();
          
          if (Array.isArray(localTasks) && localTasks.length > 0) {
            console.log('Tasks: Found tasks in TaskService:', localTasks);
            setTasks(localTasks);
            setLoading(false);
            return;
          }
        } catch (localErr) {
          console.error('Tasks: Error getting tasks from TaskService:', localErr);
        }
        
        // Use the API endpoint that gets tasks for the current user
        try {
          console.log('Tasks: Fetching from my-tasks endpoint');
          const tasksResponse = await fetch('http://localhost:8080/api/tasks/my-tasks', {
            method: 'GET',
            headers: { 
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!tasksResponse.ok) {
            throw new Error(`HTTP error! Status: ${tasksResponse.status}`);
          }
          
          const tasksData = await tasksResponse.json();
          console.log('Tasks: Received data from my-tasks endpoint:', tasksData);
          
          if (Array.isArray(tasksData)) {
            // Save to localStorage for offline use
            if (tasksData.length > 0) {
              console.log('Tasks: Saving API tasks to localStorage');
              localStorage.setItem('workline_tasks', JSON.stringify(tasksData));
            }
            
            // Accept empty arrays as valid responses
            setTasks(tasksData);
            setLoading(false);
          } else {
            // Only throw an error if the response is not an array
            throw new Error('Invalid response format from my-tasks endpoint');
          }
        } catch (tasksErr) {
          console.error('Tasks: Error fetching tasks from my-tasks endpoint:', tasksErr);
          
          // Fallback: try to get user ID first, then fetch tasks
          try {
            console.log('Tasks: Trying fallback method with user ID');
            // Try to get user ID from dashboard endpoint
            const userResponse = await fetch('http://localhost:8080/api/dashboard', {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!userResponse.ok) {
              throw new Error(`HTTP error! Status: ${userResponse.status}`);
            }
            
            const userData = await userResponse.json();
            const userId = userData.id;
            console.log('Tasks: Got user ID:', userId);
            
            if (!userId) {
              throw new Error('User ID is undefined');
            }
            
            // Then fetch tasks assigned to this user
            const userTasksResponse = await fetch(`http://localhost:8080/api/tasks/user/${userId}`, {
              method: 'GET',
              headers: { 
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              }
            });
            
            if (!userTasksResponse.ok) {
              throw new Error(`HTTP error! Status: ${userTasksResponse.status}`);
            }
            
            const userTasksData = await userTasksResponse.json();
            console.log('Tasks: Got user tasks:', userTasksData);
            
            if (Array.isArray(userTasksData)) {
              // Save to localStorage for offline use
              if (userTasksData.length > 0) {
                console.log('Tasks: Saving user tasks to localStorage');
                localStorage.setItem('workline_tasks', JSON.stringify(userTasksData));
              }
              
              setTasks(userTasksData);
              setLoading(false);
            } else {
              throw new Error('Invalid response from user tasks endpoint');
            }
          } catch (fallbackErr) {
            console.error('Tasks: Error in fallback task fetching:', fallbackErr);
            
            // Try to get tasks from localStorage as another fallback
            try {
              console.log('Tasks: Checking localStorage for tasks as fallback');
              const tasksJson = localStorage.getItem('workline_tasks');
              
              if (tasksJson) {
                const allTasks = JSON.parse(tasksJson);
                console.log('Tasks: Found all tasks in localStorage:', allTasks);
                
                // Filter tasks for current user
                const userTasks = allTasks.filter(task => 
                  task.assignedTo === userEmail || 
                  task.assignedToEmail === userEmail ||
                  task.assignedToName === userEmail
                );
                
                if (userTasks.length > 0) {
                  console.log('Tasks: Filtered tasks for current user:', userTasks);
                  setTasks(userTasks);
                  setLoading(false);
                  setError('Using locally stored tasks. Some data may be outdated.');
                  setTimeout(() => setError(null), 2500);
                  return;
                }
              }
            } catch (localStorageErr) {
              console.error('Tasks: Error getting tasks from localStorage:', localStorageErr);
            }
            
            // Final fallback: use mock data
            console.log('Tasks: Using mock task data as fallback');
            
            // Filter mock tasks to show only those assigned to mock-user-1
            // This simulates tasks assigned to the current user
            const userMockTasks = mockTasks.filter(task => 
              task.assignedTo === 'mock-user-1' || task.assignedTo === 'mock-user-2'
            );
            
            setTasks(userMockTasks);
            setLoading(false);
            setError('Using demo mode due to server issues. Some features may be limited.');
            setTimeout(() => setError(null), 2500);
          }
        }
      } catch (err) {
        console.error('Tasks: Error fetching tasks:', err);
        
        // Ultimate fallback: use mock data
        console.log('Tasks: Using mock task data as final fallback');
        
        // Filter mock tasks to show only those assigned to mock-user-1
        const userMockTasks = mockTasks.filter(task => 
          task.assignedTo === 'mock-user-1' || task.assignedTo === 'mock-user-2'
        );
        
        setTasks(userMockTasks);
        setLoading(false);
        setError('Using demo mode. Server connection issues detected.');
        setTimeout(() => setError(null), 2500);
      }
    };

    fetchTasks();
    
    // Set up a periodic check for task status updates
    const checkForUpdatesInterval = setInterval(() => {
      console.log('Tasks: Checking for task status updates');
      // Refresh tasks to ensure we have the latest status
      fetchTasks();
    }, 15000); // Check every 15 seconds
    
    return () => {
      clearInterval(checkForUpdatesInterval);
    };
  }, []);

  // Update task status
  const updateTaskStatus = async (taskId, newStatus) => {
    try {
      console.log(`Tasks: Updating task ${taskId} status to ${newStatus}`);
      setError(null);
      
      // Always update UI immediately for better user experience
      updateLocalTaskStatus(taskId, newStatus);
      
      // Show initial feedback
      setError(`Updating task status to ${newStatus.toLowerCase()}...`);
      
      const token = localStorage.getItem('token');
      
      if (!token) {
        // No token, just update the UI and localStorage in demo mode
        try {
          await TaskService.updateTaskStatus(taskId, newStatus);
          console.log('Tasks: Status updated in localStorage (demo mode)');
          setError('Status updated in demo mode only.');
          setTimeout(() => setError(null), 2000);
        } catch (storageErr) {
          console.error('Tasks: Error updating status in localStorage:', storageErr);
          setError('Status updated in UI only. Could not save changes.');
          setTimeout(() => setError(null), 2000);
        }
        return;
      }
      
      try {
        // Use TaskService to update status (will try API first, then fallback to localStorage)
        const updatedTask = await TaskService.updateTaskStatus(taskId, newStatus);
        console.log('Tasks: Status updated successfully:', updatedTask);
        
        // Make sure UI is in sync with the returned task
        if (updatedTask && updatedTask.status) {
          updateLocalTaskStatus(taskId, updatedTask.status);
        }
        
        // Show success message with offline indicator if needed
        if (updatedTask && updatedTask._pendingSync) {
          setError(`Task marked as ${newStatus.toLowerCase()} (offline mode - will sync later)`);
        } else {
          setError(`Task marked as ${newStatus.toLowerCase()}`);
        }
        setTimeout(() => setError(null), 3000);
        
        // Refresh task list after a short delay to ensure consistency
        setTimeout(() => {
          console.log('Tasks: Refreshing task list after status update');
          // We could add a refresh function here if needed
        }, 500);
      } catch (apiErr) {
        console.error('Tasks: Error updating task status:', apiErr);
        
        // UI is already updated, just show a message about sync status
        setError('Status updated locally. Changes will sync when connection is restored.');
        setTimeout(() => setError(null), 2000);
      }
    } catch (err) {
      console.error('Tasks: Unexpected error updating task status:', err);
      
      // UI is already updated, just show a message about the error
      setError('Status updated locally. Server connection issues detected.');
      setTimeout(() => setError(null), 2000);
      
      // Try one more time to save to localStorage as a last resort
      try {
        const fallbackTask = {
          id: taskId,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
        
        localStorage.setItem(`task_status_${taskId}`, JSON.stringify(fallbackTask));
        console.log('Tasks: Saved status to localStorage as last resort');
      } catch (finalErr) {
        console.error('Tasks: Final error saving status:', finalErr);
      }
    }
  };
  
  // Helper function to update task status in local state
  const updateLocalTaskStatus = (taskId, newStatus) => {
    try {
      console.log(`Tasks: Updating local UI state for task ${taskId} to ${newStatus}`);
      
      // Check if the task exists in the current tasks array
      const taskExists = tasks.some(task => 
        task.id === taskId || 
        (task._id && task._id === taskId) || 
        (task.id && task.id.toString() === taskId.toString())
      );
      
      if (taskExists) {
        // Update task in tasks array
        setTasks(tasks.map(task => {
          // Match on id or _id
          if (task.id === taskId || 
              (task._id && task._id === taskId) || 
              (task.id && task.id.toString() === taskId.toString())) {
            return { 
              ...task, 
              status: newStatus,
              lastUpdated: new Date().toISOString() 
            };
          }
          return task;
        }));
      } else {
        console.warn(`Tasks: Task ${taskId} not found in current state, cannot update UI`);
        // We could add the task to the state here if needed
      }
      
      // Update selected task if it's the one being modified
      if (selectedTask && (
          selectedTask.id === taskId || 
          (selectedTask._id && selectedTask._id === taskId) ||
          (selectedTask.id && selectedTask.id.toString() === taskId.toString())
        )) {
        setSelectedTask({ 
          ...selectedTask, 
          status: newStatus,
          lastUpdated: new Date().toISOString() 
        });
      }
      
      // Also save to a separate localStorage item as a backup
      try {
        const statusBackup = {
          id: taskId,
          status: newStatus,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`task_status_${taskId}`, JSON.stringify(statusBackup));
      } catch (storageErr) {
        console.error('Tasks: Error saving status backup to localStorage:', storageErr);
      }
    } catch (err) {
      console.error('Tasks: Error updating local task status:', err);
    }
  };

  // Get appropriate status button color with error handling
  const getStatusColor = (status) => {
    try {
      if (!status) return 'pending';
      
      const statusUpper = typeof status === 'string' ? status.toUpperCase() : String(status).toUpperCase();
      
      switch (statusUpper) {
        case 'PENDING':
          return 'pending';
        case 'ONGOING':
        case 'OPEN':
          return 'ongoing';
        case 'COMPLETED':
        case 'COMPLETE':
        case 'DONE':
          return 'completed';
        default:
          console.log(`Unknown status value: ${status}, defaulting to pending`);
          return 'pending';
      }
    } catch (error) {
      console.error('Error getting status color:', error, status);
      return 'pending';
    }
  };
  
  // Format status for display with error handling
  const formatStatus = (status) => {
    try {
      if (!status) return 'Pending';
      
      const statusString = typeof status === 'string' ? status : String(status);
      return statusString.charAt(0).toUpperCase() + statusString.slice(1).toLowerCase();
    } catch (error) {
      console.error('Error formatting status:', error);
      return 'Pending';
    }
  };
  
  // View task details
  const viewTaskDetails = (task) => {
    setSelectedTask(task);
  };
  
  // Close task details
  const closeTaskDetails = () => {
    setSelectedTask(null);
  };

  if (loading) return <div className="loading">Loading tasks...</div>;
  if (error) return <div className="error">{error}</div>;

  return (
    <div>
      <Navbar />
    <div className="task-container">
      <div className="tasks-header">
        <h1>My Tasks</h1>
        <button 
          className="refresh-button"
          onClick={() => {
            console.log('Tasks: Manual refresh requested');
            // Use the existing fetchTasks function defined in useEffect
            const fetchTasks = async () => {
              try {
                setLoading(true);
                setError(null);
                console.log('Tasks: Fetching tasks for logged-in user');
                
                const token = localStorage.getItem('token');
                const userEmail = localStorage.getItem('userEmail');
                
                // First check localStorage for the most up-to-date task data
                try {
                  console.log('Tasks: Checking localStorage for tasks');
                  const localTasks = await TaskService.getMyTasks();
                  
                  if (Array.isArray(localTasks) && localTasks.length > 0) {
                    console.log('Tasks: Found tasks in TaskService:', localTasks);
                    setTasks(localTasks);
                    setLoading(false);
                    setError('Tasks refreshed successfully');
                    setTimeout(() => setError(null), 2000);
                    return;
                  }
                } catch (localErr) {
                  console.error('Tasks: Error getting tasks from TaskService:', localErr);
                }
                
                // Fallback to mock data if needed
                setTasks(mockTasks);
                setLoading(false);
                setError('Using demo mode. Tasks refreshed with mock data.');
                setTimeout(() => setError(null), 2000);
              } catch (err) {
                console.error('Tasks: Error refreshing tasks:', err);
                setError('Failed to refresh tasks. Please try again.');
                setLoading(false);
              }
            };
            
            fetchTasks();
          }}
        >
          Refresh
        </button>
      </div>
      
      {tasks.length === 0 ? (
        <p className="no-tasks">You have no assigned tasks at the moment.</p>
      ) : (
        <div className="task-list">
          {tasks.map((task) => {
            try {
              // Safely get task properties with fallbacks
              const title = task.title || 'Untitled Task';
              
              // Safely get description with fallback
              let description = 'No description provided';
              if (task.description) {
                description = typeof task.description === 'string' 
                  ? task.description.substring(0, 100) + '...'
                  : 'Description format error';
              }
              
              // Safely format date with fallback
              let formattedDate = 'No due date';
              try {
                if (task.dueDate) {
                  formattedDate = new Date(task.dueDate).toLocaleDateString();
                }
              } catch (dateError) {
                console.error('Error formatting date:', dateError);
              }
              
              return (
                <div 
                  key={task.id || Math.random().toString()} 
                  className="task-card"
                  onClick={() => viewTaskDetails(task)}
                >
                  <h3 className="task-title">{title}</h3>
                  <p className="task-description">{description}</p>
                  <div className="task-meta">
                    <span className="task-date">Due: {formattedDate}</span>
                    <span className={`task-status ${getStatusColor(task.status)}`}>
                      {formatStatus(task.status)}
                      {task._pendingSync && <span className="sync-pending"> (Pending Sync)</span>}
                    </span>
                  </div>
                </div>
              );
            } catch (renderError) {
              console.error('Error rendering task card:', renderError, task);
              return null; // Skip rendering this card if there's an error
            }
          })}
        </div>
      )}
      
      {/* Task Details Modal */}
      {selectedTask && (
        <div className="task-modal-overlay" onClick={closeTaskDetails}>
          <div className="task-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal" onClick={closeTaskDetails}>×</button>
            
            {(() => {
              try {
                // Safely get task properties with fallbacks
                const title = selectedTask.title || 'Untitled Task';
                const description = selectedTask.description || 'No description provided';
                const status = selectedTask.status || 'PENDING';
                
                // Safely format dates with fallbacks
                let dueDateFormatted = 'No due date';
                let createdAtFormatted = 'Unknown';
                
                try {
                  if (selectedTask.dueDate) {
                    dueDateFormatted = new Date(selectedTask.dueDate).toLocaleDateString();
                  }
                } catch (dueDateError) {
                  console.error('Error formatting due date:', dueDateError);
                }
                
                try {
                  if (selectedTask.createdAt) {
                    createdAtFormatted = new Date(selectedTask.createdAt).toLocaleDateString();
                  }
                } catch (createdAtError) {
                  console.error('Error formatting created date:', createdAtError);
                }
                
                return (
                  <>
                    <div className="task-modal-header">
                      <h2>{title}</h2>
                      <span className={`task-status ${getStatusColor(status)}`}>
                        {formatStatus(status)}
                        {selectedTask._pendingSync && <span className="sync-pending"> (Pending Sync)</span>}
                      </span>
                    </div>
                    
                    <div className="task-modal-body">
                      <p className="task-full-description">{description}</p>
                      
                      <div className="task-details">
                        <div className="detail-item">
                          <span className="detail-label">Due Date:</span>
                          <span className="detail-value">{dueDateFormatted}</span>
                        </div>
                        <div className="detail-item">
                          <span className="detail-label">Created On:</span>
                          <span className="detail-value">{createdAtFormatted}</span>
                        </div>
                      </div>
                      
                      <div className="task-actions">
                        {status === 'PENDING' && (
                          <button 
                            className="btn ongoing-btn"
                            onClick={() => updateTaskStatus(selectedTask.id, 'ONGOING')}
                          >
                            Mark as Ongoing
                          </button>
                        )}
                        
                        {(status === 'PENDING' || status === 'ONGOING') && (
                          <button 
                            className="btn completed-btn"
                            onClick={() => updateTaskStatus(selectedTask.id, 'COMPLETED')}
                          >
                            Mark as Completed
                          </button>
                        )}
                        
                        {status === 'COMPLETED' && (
                          <div className="completion-message">
                            Task completed! 🎉
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                );
              } catch (modalError) {
                console.error('Error rendering task modal:', modalError);
                return (
                  <div className="error-message">
                    <h3>Error displaying task details</h3>
                    <p>There was a problem loading the task details. Please try again.</p>
                    <button onClick={closeTaskDetails}>Close</button>
                  </div>
                );
              }
            })()}
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default TaskPage;