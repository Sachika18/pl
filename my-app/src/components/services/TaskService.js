import fetchApi from '../../utils/fetchApi';
import taskStorage from '../../utils/taskStorage';

class TaskService {
  // Get all tasks
  async getAllTasks() {
    try {
      // First get all tasks from localStorage to ensure we have the latest status updates
      console.log('TaskService: Getting tasks from localStorage first');
      const localTasks = taskStorage.getAllTasks();
      console.log('TaskService: Retrieved tasks from localStorage:', localTasks);
      
      // Check for individual task status updates
      const allKeys = Object.keys(localStorage);
      const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
      
      let individualTaskUpdates = [];
      if (taskStatusKeys.length > 0) {
        console.log(`TaskService: Found ${taskStatusKeys.length} individual task status updates`);
        
        taskStatusKeys.forEach(key => {
          try {
            const taskStatusJson = localStorage.getItem(key);
            if (taskStatusJson) {
              const taskStatus = JSON.parse(taskStatusJson);
              if (taskStatus && taskStatus.id) {
                individualTaskUpdates.push(taskStatus);
                console.log(`TaskService: Found individual status update for task ${taskStatus.id}: ${taskStatus.status}`);
              }
            }
          } catch (parseErr) {
            console.error(`TaskService: Error parsing task status from ${key}:`, parseErr);
          }
        });
      }
      
      // Try to get tasks from API
      try {
        console.log('TaskService: Attempting to fetch all tasks from API');
        const apiTasks = await fetchApi.get('/tasks');
        console.log('TaskService: API returned tasks:', apiTasks);
        
        if (apiTasks && Array.isArray(apiTasks)) {
          // Merge with localStorage tasks, prioritizing local status updates
          let mergedTasks = [...apiTasks];
          
          // Apply individual task status updates
          if (individualTaskUpdates.length > 0) {
            mergedTasks = mergedTasks.map(task => {
              const statusUpdate = individualTaskUpdates.find(update => 
                update.id === task.id || 
                (update._id && update._id === task.id) || 
                (task._id && task._id === update.id)
              );
              
              if (statusUpdate) {
                console.log(`TaskService: Applying individual status update for task ${task.id}: ${statusUpdate.status}`);
                return { 
                  ...task, 
                  status: statusUpdate.status, 
                  lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
                  _pendingSync: true 
                };
              }
              return task;
            });
          }
          
          // Save merged tasks to localStorage for offline use
          taskStorage.saveTasks(mergedTasks);
          return mergedTasks;
        }
      } catch (apiError) {
        console.error('TaskService: Error fetching tasks from API:', apiError);
      }
      
      // If we get here, either API failed or returned invalid data
      // Apply individual task status updates to localStorage tasks
      if (individualTaskUpdates.length > 0 && Array.isArray(localTasks)) {
        const updatedLocalTasks = localTasks.map(task => {
          const statusUpdate = individualTaskUpdates.find(update => 
            update.id === task.id || 
            (update._id && update._id === task.id) || 
            (task._id && task._id === update.id)
          );
          
          if (statusUpdate) {
            console.log(`TaskService: Applying individual status update to localStorage task ${task.id}: ${statusUpdate.status}`);
            return { 
              ...task, 
              status: statusUpdate.status, 
              lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
              _pendingSync: true 
            };
          }
          return task;
        });
        
        return updatedLocalTasks;
      }
      
      return localTasks;
    } catch (error) {
      console.error('TaskService: Error in getAllTasks:', error);
      
      // Last resort fallback
      try {
        const lastResortTasks = taskStorage.getAllTasks();
        return lastResortTasks || [];
      } catch (finalError) {
        console.error('TaskService: Final error in getAllTasks:', finalError);
        return [];
      }
    }
  }

  // Get tasks assigned to current user
  async getMyTasks() {
    try {
      // First check for individual task status updates
      console.log('TaskService: Checking for task status updates');
      const allKeys = Object.keys(localStorage);
      const taskStatusKeys = allKeys.filter(key => key.startsWith('task_status_'));
      
      let individualTaskUpdates = [];
      if (taskStatusKeys.length > 0) {
        console.log(`TaskService: Found ${taskStatusKeys.length} individual task status updates`);
        
        taskStatusKeys.forEach(key => {
          try {
            const taskStatusJson = localStorage.getItem(key);
            if (taskStatusJson) {
              const taskStatus = JSON.parse(taskStatusJson);
              if (taskStatus && taskStatus.id) {
                individualTaskUpdates.push(taskStatus);
                console.log(`TaskService: Found individual status update for task ${taskStatus.id}: ${taskStatus.status}`);
              }
            }
          } catch (parseErr) {
            console.error(`TaskService: Error parsing task status from ${key}:`, parseErr);
          }
        });
      }
      
      // Try to get tasks from API
      try {
        console.log('TaskService: Attempting to fetch my tasks from API');
        const apiTasks = await fetchApi.get('/tasks/my-tasks');
        console.log('TaskService: API returned my tasks:', apiTasks);
        
        if (apiTasks && Array.isArray(apiTasks) && apiTasks.length > 0) {
          // Apply individual task status updates
          if (individualTaskUpdates.length > 0) {
            const updatedTasks = apiTasks.map(task => {
              const statusUpdate = individualTaskUpdates.find(update => 
                update.id === task.id || 
                (update._id && update._id === task.id) || 
                (task._id && task._id === update.id)
              );
              
              if (statusUpdate) {
                console.log(`TaskService: Applying individual status update for task ${task.id}: ${statusUpdate.status}`);
                return { 
                  ...task, 
                  status: statusUpdate.status, 
                  lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
                  _pendingSync: true 
                };
              }
              return task;
            });
            
            // Save updated tasks to localStorage
            const userEmail = localStorage.getItem('userEmail');
            taskStorage.saveUserTasks(userEmail, updatedTasks);
            
            return updatedTasks;
          }
          
          return apiTasks;
        }
      } catch (apiError) {
        console.error('TaskService: Error fetching my tasks from API:', apiError);
      }
      
      // Fallback to localStorage
      console.log('TaskService: Using localStorage for my tasks');
      const userEmail = localStorage.getItem('userEmail');
      console.log('TaskService: Using email from localStorage:', userEmail);
      let localTasks = taskStorage.getTasksByUser(userEmail);
      
      // Apply individual task status updates to localStorage tasks
      if (individualTaskUpdates.length > 0 && Array.isArray(localTasks)) {
        localTasks = localTasks.map(task => {
          const statusUpdate = individualTaskUpdates.find(update => 
            update.id === task.id || 
            (update._id && update._id === task.id) || 
            (task._id && task._id === update.id)
          );
          
          if (statusUpdate) {
            console.log(`TaskService: Applying individual status update to localStorage task ${task.id}: ${statusUpdate.status}`);
            return { 
              ...task, 
              status: statusUpdate.status, 
              lastUpdated: statusUpdate.lastUpdated || new Date().toISOString(),
              _pendingSync: true 
            };
          }
          return task;
        });
        
        // Save updated tasks back to localStorage
        taskStorage.saveUserTasks(userEmail, localTasks);
      }
      
      return localTasks;
    } catch (error) {
      console.error('TaskService: Error in getMyTasks:', error);
      
      // Last resort fallback
      try {
        const userEmail = localStorage.getItem('userEmail');
        const lastResortTasks = taskStorage.getTasksByUser(userEmail);
        return lastResortTasks || [];
      } catch (finalError) {
        console.error('TaskService: Final error in getMyTasks:', finalError);
        return [];
      }
    }
  }

  // Create a new task
  async createTask(taskData) {
    try {
      console.log('TaskService: Attempting to create task via API:', taskData);
      const createdTask = await fetchApi.post('/tasks', taskData);
      console.log('TaskService: API created task:', createdTask);
      
      // Also save to localStorage
      if (createdTask) {
        // Save the API-created task to localStorage
        const savedTask = taskStorage.addTask(createdTask);
        console.log('TaskService: Saved API-created task to localStorage:', savedTask);
        return createdTask;
      } else {
        // If API returns nothing, just use localStorage
        console.log('TaskService: API returned empty response, using localStorage');
        const localTask = taskStorage.addTask(taskData);
        console.log('TaskService: Created task in localStorage:', localTask);
        return localTask;
      }
    } catch (error) {
      console.error('TaskService: Error creating task via API:', error);
      // Fallback to localStorage
      console.log('TaskService: Using localStorage due to API error');
      const localTask = taskStorage.addTask(taskData);
      console.log('TaskService: Created task in localStorage (fallback):', localTask);
      return localTask;
    }
  }

  // Update task status
  async updateTaskStatus(taskId, status) {
    try {
      console.log(`TaskService: Attempting to update task ${taskId} status to ${status}`);
      
      // First, update in localStorage to ensure persistence regardless of API result
      const localSuccess = taskStorage.updateTaskStatus(taskId, status);
      console.log(`TaskService: Local storage update ${localSuccess ? 'successful' : 'failed'}`);
      
      // Get the updated task from localStorage to return in case API fails
      const tasks = taskStorage.getAllTasks();
      const localTask = tasks.find(t => 
        t.id === taskId || 
        (t._id && t._id === taskId) || 
        (t.id && t.id.toString() === taskId.toString())
      );
      
      // Save individual task status update to localStorage
      try {
        const statusBackup = {
          id: taskId,
          status: status,
          lastUpdated: new Date().toISOString()
        };
        localStorage.setItem(`task_status_${taskId}`, JSON.stringify(statusBackup));
        console.log(`TaskService: Saved status backup to localStorage for task ${taskId}`);
      } catch (storageErr) {
        console.error('TaskService: Error saving status backup to localStorage:', storageErr);
      }
      
      // Then try to update via API (but don't let API failure block the update)
      try {
        // Make the actual API call to update the task status
        console.log(`TaskService: Making API call to update task ${taskId} status to ${status}`);
        
        // Prepare the data for the API call - convert status to uppercase for API compatibility
        let apiStatus = status.toUpperCase();
        
        // Map any invalid statuses to valid ones
        if (apiStatus === 'ONGOING') apiStatus = 'IN_PROGRESS';
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(apiStatus)) {
          console.warn(`TaskService: Invalid status value: ${apiStatus}, defaulting to PENDING`);
          apiStatus = 'PENDING';
        }
        
        const updateData = { status: apiStatus };
        
        // Make the API call
        console.log(`TaskService: Sending status update to API: ${apiStatus}`);
        const updatedTask = await fetchApi.put(`/tasks/${taskId}/status`, updateData);
        console.log('TaskService: API task status update successful:', updatedTask);
        
        // If API call is successful, remove the _pendingSync flag
        if (updatedTask) {
          // Update the task in localStorage without the _pendingSync flag
          const syncedTask = {
            ...updatedTask,
            lastUpdated: new Date().toISOString()
          };
          
          // Update the task in localStorage
          taskStorage.updateTask(taskId, syncedTask);
          console.log('TaskService: Updated task in localStorage after successful API update:', syncedTask);
          
          // Remove the individual task status backup
          localStorage.removeItem(`task_status_${taskId}`);
          
          return syncedTask;
        }
      } catch (apiError) {
        console.error('TaskService: Error updating task status via API:', apiError);
        console.log('TaskService: Using localStorage as fallback');
        
        // Add to pending updates queue
        try {
          // Get existing queue or create a new one
          const pendingUpdatesJson = localStorage.getItem('workline_pending_updates') || '[]';
          const pendingUpdates = JSON.parse(pendingUpdatesJson);
          
          // Add this update to the queue
          pendingUpdates.push({
            type: 'STATUS_UPDATE',
            taskId: taskId,
            status: status,
            timestamp: new Date().toISOString()
          });
          
          // Save the updated queue
          localStorage.setItem('workline_pending_updates', JSON.stringify(pendingUpdates));
          console.log(`TaskService: Added status update to pending queue. Queue size: ${pendingUpdates.length}`);
        } catch (queueErr) {
          console.error('TaskService: Error managing pending updates queue:', queueErr);
        }
      }
      
      // Use localStorage version since API calls are skipped or failed
      console.log('TaskService: Using localStorage version for task status update');
      
      if (!localTask) {
        // Create a minimal task object if not found in localStorage
        const fallbackTask = {
          id: taskId,
          status: status,
          lastUpdated: new Date().toISOString(),
          title: 'Task ' + taskId.substring(taskId.length - 5),
          description: 'Task details will be synchronized when connection is restored',
          createdDate: new Date().toISOString(),
          _pendingSync: true
        };
        
        // Save this minimal task to localStorage
        const savedTask = taskStorage.addTask(fallbackTask);
        console.log('TaskService: Created new task in localStorage:', savedTask);
        return savedTask;
      }
      
      // Return the local task with updated status
      const updatedLocalTask = {
        ...localTask,
        status: status,
        lastUpdated: new Date().toISOString(),
        _pendingSync: true
      };
      
      // Update the task in localStorage
      taskStorage.updateTask(taskId, updatedLocalTask);
      console.log('TaskService: Updated existing task in localStorage:', updatedLocalTask);
      
      return updatedLocalTask;
    } catch (error) {
      console.error('TaskService: Error updating task status:', error);
      
      // Last resort: create a minimal task object and save it
      try {
        const fallbackTask = {
          id: taskId,
          status: status,
          lastUpdated: new Date().toISOString(),
          title: 'Task ' + taskId.substring(taskId.length - 5),
          description: 'Task details will be synchronized when connection is restored'
        };
        
        taskStorage.addTask(fallbackTask);
        console.log('TaskService: Created fallback task as last resort');
        
        return fallbackTask;
      } catch (finalError) {
        console.error('TaskService: Final error creating fallback task:', finalError);
        
        // Return a minimal object even if storage fails
        return { id: taskId, status: status };
      }
    }
  }

  // Delete a task
  async deleteTask(taskId) {
    try {
      console.log(`TaskService: Attempting to delete task ${taskId} via API`);
      const result = await fetchApi.delete(`/tasks/${taskId}`);
      console.log('TaskService: API deleted task:', result);
      
      // Also delete from localStorage
      taskStorage.deleteTask(taskId);
      
      return result;
    } catch (error) {
      console.error('TaskService: Error deleting task via API:', error);
      // Fallback to localStorage
      console.log('TaskService: Using localStorage due to API error');
      const success = taskStorage.deleteTask(taskId);
      
      if (!success) {
        throw new Error('Failed to delete task');
      }
      
      return { success: true };
    }
  }
  
  // Get admin task statistics (for all tasks in the system)
  async getAdminTaskStats() {
    try {
      console.log('TaskService: Getting admin task statistics');
      
      // Get all tasks in the system
      let tasks = [];
      try {
        // First try to get all tasks from API
        console.log('TaskService: Getting all tasks for admin statistics calculation');
        const allTasks = await this.getAllTasks();
        
        if (allTasks && Array.isArray(allTasks)) {
          tasks = allTasks;
          console.log(`TaskService: Found ${tasks.length} tasks for admin statistics calculation`);
        }
      } catch (tasksError) {
        console.error('TaskService: Error getting tasks for admin statistics:', tasksError);
        
        // Fallback to localStorage
        tasks = taskStorage.getAllTasks() || [];
        console.log(`TaskService: Using ${tasks.length} tasks from localStorage for admin statistics`);
      }
      
      // Calculate stats from tasks
      const completedTasks = tasks.filter(task => 
        task.status === 'COMPLETED' || 
        task.status === 'COMPLETE' || 
        task.status === 'DONE'
      ).length;
      
      const ongoingTasks = tasks.filter(task => 
        task.status === 'ONGOING' || 
        task.status === 'IN_PROGRESS' || 
        task.status === 'IN-PROGRESS' || 
        task.status === 'INPROGRESS'
      ).length;
      
      const newTasks = tasks.filter(task => 
        task.status === 'PENDING' || 
        task.status === 'NEW' || 
        task.status === 'TODO' || 
        task.status === 'TO-DO' || 
        task.status === 'ASSIGNED'
      ).length;
      
      // Calculate tasks due soon (within the next 7 days)
      const now = new Date();
      const sevenDaysFromNow = new Date(now);
      sevenDaysFromNow.setDate(now.getDate() + 7);
      
      const tasksDueSoon = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate > now && dueDate <= sevenDaysFromNow && 
               (task.status !== 'COMPLETED' && 
                task.status !== 'COMPLETE' && 
                task.status !== 'DONE');
      }).length;
      
      // Calculate overdue tasks
      const overdueTasks = tasks.filter(task => {
        if (!task.dueDate) return false;
        
        const dueDate = new Date(task.dueDate);
        return dueDate < now && 
               (task.status !== 'COMPLETED' && 
                task.status !== 'COMPLETE' && 
                task.status !== 'DONE');
      }).length;
      
      const stats = {
        completedTasks,
        ongoingTasks,
        newTasks,
        tasksDueSoon,
        overdueTasks,
        totalTasks: tasks.length
      };
      
      console.log('TaskService: Calculated admin task stats:', stats);
      return stats;
    } catch (error) {
      console.error('TaskService: Error getting admin task stats:', error);
      
      // Return default stats as fallback
      return {
        completedTasks: 0,
        ongoingTasks: 0,
        newTasks: 0,
        tasksDueSoon: 0,
        overdueTasks: 0,
        totalTasks: 0
      };
    }
  }

  // Get task statistics for the current user
  async getTaskStats() {
    try {
      console.log('TaskService: Getting task statistics');
      
      // Get all tasks for the current user
      let tasks = [];
      try {
        // First try to get tasks from API
        console.log('TaskService: Getting tasks for statistics calculation');
        const myTasks = await this.getMyTasks();
        
        if (myTasks && Array.isArray(myTasks)) {
          tasks = myTasks;
          console.log(`TaskService: Found ${tasks.length} tasks for statistics calculation`);
        }
      } catch (tasksError) {
        console.error('TaskService: Error getting tasks for statistics:', tasksError);
        
        // Fallback to localStorage
        const userEmail = localStorage.getItem('userEmail');
        tasks = taskStorage.getTasksByUser(userEmail) || [];
        console.log(`TaskService: Using ${tasks.length} tasks from localStorage for statistics`);
      }
      
      // Calculate stats from tasks
      const completedTasks = tasks.filter(task => 
        task.status === 'COMPLETED' || 
        task.status === 'COMPLETE' || 
        task.status === 'DONE'
      ).length;
      
      const ongoingTasks = tasks.filter(task => 
        task.status === 'ONGOING' || 
        task.status === 'IN_PROGRESS' || 
        task.status === 'IN-PROGRESS' || 
        task.status === 'INPROGRESS'
      ).length;
      
      const newTasks = tasks.filter(task => 
        task.status === 'PENDING' || 
        task.status === 'NEW' || 
        task.status === 'TODO' || 
        task.status === 'TO-DO' || 
        task.status === 'ASSIGNED'
      ).length;
      
      const stats = {
        completedTasks,
        ongoingTasks,
        newTasks,
        totalTasks: tasks.length
      };
      
      console.log('TaskService: Calculated task stats:', stats);
      return stats;
    } catch (error) {
      console.error('TaskService: Error getting task stats:', error);
      
      // Return default stats as fallback
      return {
        completedTasks: 0,
        ongoingTasks: 0,
        newTasks: 0,
        totalTasks: 0
      };
    }
  }
}

export default new TaskService();