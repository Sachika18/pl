
const TASKS_STORAGE_KEY = 'workline_tasks';

const taskStorage = {
  /**
   * Get all tasks from localStorage
   * @returns {Array} Array of task objects
   */
  getAllTasks: () => {
    try {
      const tasksJson = localStorage.getItem(TASKS_STORAGE_KEY);
      return tasksJson ? JSON.parse(tasksJson) : [];
    } catch (error) {
      console.error('Error getting tasks from localStorage:', error);
      return [];
    }
  },

  /**
   * Save all tasks to localStorage
   * @param {Array} tasks Array of task objects
   */
  saveTasks: (tasks) => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
      return true;
    } catch (error) {
      console.error('Error saving tasks to localStorage:', error);
      return false;
    }
  },

  /**
   * Add a new task to localStorage
   * @param {Object} task Task object to add
   * @returns {Object} The added task with generated ID
   */
  addTask: (task) => {
    try {
      const tasks = taskStorage.getAllTasks();
      
      // Generate a unique ID if not provided
      if (!task.id) {
        task.id = 'local-' + Date.now() + '-' + Math.floor(Math.random() * 1000);
      }
      
      // Add creation date if not provided
      if (!task.createdDate) {
        task.createdDate = new Date().toISOString();
      }
      
      // Ensure status is set with correct enum value
      if (!task.status) {
        task.status = 'IN_PROGRESS'; // Use uppercase enum values as expected by backend
      } else if (typeof task.status === 'string') {
        // Convert to uppercase to match backend enum
        task.status = task.status.toUpperCase();
      }
      
      // Check if task with this ID already exists
      const existingIndex = tasks.findIndex(t => t.id === task.id);
      if (existingIndex !== -1) {
        // Update existing task
        tasks[existingIndex] = task;
      } else {
        // Add new task
        tasks.push(task);
      }
      
      console.log('Saving tasks to localStorage:', tasks);
      taskStorage.saveTasks(tasks);
      return task;
    } catch (error) {
      console.error('Error adding task to localStorage:', error);
      return null;
    }
  },

  /**
   * Update a task in localStorage
   * @param {string} taskId ID of the task to update
   * @param {Object} updatedTask Updated task data
   * @returns {boolean} Success status
   */
  updateTask: (taskId, updatedTask) => {
    try {
      const tasks = taskStorage.getAllTasks();
      const index = tasks.findIndex(task => task.id === taskId);
      
      if (index !== -1) {
        tasks[index] = { ...tasks[index], ...updatedTask };
        taskStorage.saveTasks(tasks);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error updating task in localStorage:', error);
      return false;
    }
  },

  /**
   * Delete a task from localStorage
   * @param {string} taskId ID of the task to delete
   * @returns {boolean} Success status
   */
  deleteTask: (taskId) => {
    try {
      const tasks = taskStorage.getAllTasks();
      const filteredTasks = tasks.filter(task => task.id !== taskId);
      
      if (filteredTasks.length !== tasks.length) {
        taskStorage.saveTasks(filteredTasks);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error deleting task from localStorage:', error);
      return false;
    }
  },

  /**
   * Get tasks assigned to a specific user
   * @param {string} userEmail Email of the user
   * @returns {Array} Array of task objects assigned to the user
   */
  getTasksByUser: (userEmail) => {
    try {
      if (!userEmail) return [];
      
      const tasks = taskStorage.getAllTasks();
      return tasks.filter(task => 
        task.assignedTo === userEmail || 
        task.assignedToEmail === userEmail ||
        task.assignedToName === userEmail
      );
    } catch (error) {
      console.error('Error getting tasks by user from localStorage:', error);
      return [];
    }
  },

  /**
   * Update task status
   * @param {string} taskId ID of the task
   * @param {string} status New status
   * @returns {boolean} Success status
   */
  updateTaskStatus: (taskId, status) => {
    try {
      console.log(`taskStorage: Updating task ${taskId} status to ${status}`);
      
      // Ensure status is in the correct format for backend
      let normalizedStatus = status;
      if (typeof status === 'string') {
        // Convert to uppercase for backend enum compatibility
        normalizedStatus = status.toUpperCase();
        
        // Map any invalid statuses to valid ones
        if (normalizedStatus === 'ONGOING') normalizedStatus = 'IN_PROGRESS';
        if (!['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'CANCELED'].includes(normalizedStatus)) {
          console.warn(`taskStorage: Invalid status value: ${normalizedStatus}, defaulting to PENDING`);
          normalizedStatus = 'PENDING';
        }
      }
      
      console.log(`taskStorage: Normalized status: ${normalizedStatus}`);
      
      // Get all tasks
      const tasks = taskStorage.getAllTasks();
      console.log(`taskStorage: Found ${tasks.length} tasks in storage`);
      
      // Find the task - handle both string and ObjectId formats
      let taskIndex = tasks.findIndex(task => 
        task.id === taskId || 
        (task._id && task._id === taskId) ||
        (task.id && task.id.toString() === taskId.toString())
      );
      
      // If task not found, create a new task entry with this ID
      if (taskIndex === -1) {
        console.log(`taskStorage: Task with ID ${taskId} not found, creating new entry`);
        
        // Create a minimal task object
        const newTask = {
          id: taskId,
          status: normalizedStatus,
          createdDate: new Date().toISOString(),
          lastUpdated: new Date().toISOString(),
          title: 'Task ' + taskId.substring(taskId.length - 5),
          description: 'Task details will be synchronized when connection is restored',
          _pendingSync: true // Mark for future sync
        };
        
        // Add to tasks array
        tasks.push(newTask);
        
        // Save and return
        const saveResult = taskStorage.saveTasks(tasks);
        console.log(`taskStorage: New task created and saved, result: ${saveResult}`);
        return saveResult;
      }
      
      // Update the task status
      console.log(`taskStorage: Updating existing task at index ${taskIndex}`);
      tasks[taskIndex] = {
        ...tasks[taskIndex],
        status: normalizedStatus,
        lastUpdated: new Date().toISOString()
      };
      
      // Save all tasks
      const saveResult = taskStorage.saveTasks(tasks);
      console.log(`taskStorage: Save result: ${saveResult}`);
      
      return saveResult;
    } catch (error) {
      console.error('taskStorage: Error updating task status:', error);
      return false;
    }
  },

  /**
   * Save tasks for a specific user
   * @param {string} userEmail Email of the user
   * @param {Array} userTasks Array of task objects for the user
   * @returns {boolean} Success status
   */
  saveUserTasks: (userEmail, userTasks) => {
    try {
      if (!userEmail || !Array.isArray(userTasks)) {
        console.error('taskStorage: Invalid parameters for saveUserTasks');
        return false;
      }
      
      console.log(`taskStorage: Saving ${userTasks.length} tasks for user ${userEmail}`);
      
      // Get all tasks
      const allTasks = taskStorage.getAllTasks();
      
      // Remove existing tasks for this user
      const otherUserTasks = allTasks.filter(task => 
        task.assignedTo !== userEmail && 
        task.assignedToEmail !== userEmail &&
        task.assignedToName !== userEmail
      );
      
      // Add the user's tasks
      const updatedTasks = [...otherUserTasks, ...userTasks];
      
      // Save all tasks
      const saveResult = taskStorage.saveTasks(updatedTasks);
      console.log(`taskStorage: Save result for user tasks: ${saveResult}`);
      
      return saveResult;
    } catch (error) {
      console.error('taskStorage: Error saving user tasks:', error);
      return false;
    }
  }
};

export default taskStorage;