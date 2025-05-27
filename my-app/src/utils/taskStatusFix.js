/**
 * Utility functions to fix task status issues
 */

// Clear all task-related data from localStorage
export const clearAllTaskData = () => {
  try {
    // Remove known task data keys
    localStorage.removeItem('workline_tasks');
    localStorage.removeItem('workline_admin_tasks');
    
    // Find and remove any keys that might contain task data
    const allKeys = Object.keys(localStorage);
    const taskKeys = allKeys.filter(key => 
      key.startsWith('task_') || 
      key.includes('task') || 
      key.includes('Task')
    );
    
    taskKeys.forEach(key => {
      localStorage.removeItem(key);
    });
    
    console.log(`Cleared ${taskKeys.length + 2} task-related items from localStorage`);
    return true;
  } catch (error) {
    console.error('Error clearing task data:', error);
    return false;
  }
};

// Fix task status values in localStorage
export const fixTaskStatuses = () => {
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
          let newStatus = typeof oldStatus === 'string' ? oldStatus.toUpperCase() : String(oldStatus);
          
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
          let newStatus = typeof oldStatus === 'string' ? oldStatus.toUpperCase() : String(oldStatus);
          
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
            let newStatus = typeof oldStatus === 'string' ? oldStatus.toUpperCase() : String(oldStatus);
            
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
    return fixed;
  } catch (e) {
    console.error('Error fixing task statuses:', e);
    return 0;
  }
};

// Add these functions to the window object for console access
window.clearWorklineTasks = clearAllTaskData;
window.fixWorklineTaskStatuses = fixTaskStatuses;