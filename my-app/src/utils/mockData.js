// Mock data to use as fallback when API calls fail
export const mockUsers = [
  {
    id: 'mock-user-1',
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    position: 'Developer'
  },
  {
    id: 'mock-user-2',
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    position: 'Designer'
  },
  {
    id: 'mock-user-3',
    firstName: 'Alex',
    lastName: 'Johnson',
    email: 'alex.johnson@example.com',
    position: 'Manager'
  }
];

export const mockTasks = [
  {
    id: 'mock-task-1',
    title: 'Complete Project Documentation',
    description: 'Write comprehensive documentation for the current project',
    assignedTo: 'mock-user-1',
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 7 days from now
    status: 'PENDING',
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: 'mock-user-3'
  },
  {
    id: 'mock-task-2',
    title: 'Design New UI Components',
    description: 'Create designs for the new dashboard components',
    assignedTo: 'mock-user-2',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days from now
    status: 'IN_PROGRESS',
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: 'mock-user-3'
  },
  {
    id: 'mock-task-3',
    title: 'Fix Login Page Bugs',
    description: 'Address the reported issues with the login functionality',
    assignedTo: 'mock-user-1',
    dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 2 days from now
    status: 'COMPLETED',
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: 'mock-user-3'
  }
];

// Mock attendance data
export const mockAttendance = {
  id: 'mock-attendance-1',
  userId: 'mock-user-1',
  checkInTime: new Date().setHours(9, 0, 0, 0), // 9:00 AM today
  checkOutTime: null,
  totalHours: null,
  status: 'CHECKED_IN',
  date: new Date().setHours(9, 0, 0, 0)
};

// Mock attendance history
export const mockAttendanceHistory = [
  {
    id: 'mock-attendance-history-1',
    userId: 'mock-user-1',
    checkInTime: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(9, 0, 0, 0), // Yesterday 9:00 AM
    checkOutTime: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(17, 30, 0, 0), // Yesterday 5:30 PM
    totalHours: 8.5,
    status: 'COMPLETED',
    date: new Date(new Date().setDate(new Date().getDate() - 1)).setHours(9, 0, 0, 0)
  },
  {
    id: 'mock-attendance-history-2',
    userId: 'mock-user-1',
    checkInTime: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(8, 45, 0, 0), // 2 days ago 8:45 AM
    checkOutTime: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(17, 15, 0, 0), // 2 days ago 5:15 PM
    totalHours: 8.5,
    status: 'COMPLETED',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).setHours(8, 45, 0, 0)
  },
  {
    id: 'mock-attendance-history-3',
    userId: 'mock-user-1',
    checkInTime: new Date(new Date().setDate(new Date().getDate() - 3)).setHours(9, 15, 0, 0), // 3 days ago 9:15 AM
    checkOutTime: new Date(new Date().setDate(new Date().getDate() - 3)).setHours(18, 0, 0, 0), // 3 days ago 6:00 PM
    totalHours: 8.75,
    status: 'COMPLETED',
    date: new Date(new Date().setDate(new Date().getDate() - 3)).setHours(9, 15, 0, 0)
  }
];

// Function to generate a new mock task
export const createMockTask = (taskData) => {
  return {
    id: 'mock-task-' + Math.floor(Math.random() * 1000),
    title: taskData.title || 'New Task',
    description: taskData.description || 'Task description',
    assignedTo: taskData.assignedTo || 'mock-user-1',
    dueDate: taskData.dueDate || new Date().toISOString().split('T')[0],
    status: 'PENDING',
    createdAt: new Date().toISOString().split('T')[0],
    createdBy: 'mock-user-3'
  };
};

// Function to create a mock check-in record
export const createMockCheckIn = (userId) => {
  const now = new Date();
  return {
    id: 'mock-attendance-' + Math.floor(Math.random() * 1000),
    userId: userId || 'mock-user-1',
    checkInTime: now,
    checkOutTime: null,
    totalHours: null,
    status: 'CHECKED_IN',
    date: now
  };
};

// Function to create a mock check-out record
export const createMockCheckOut = (attendanceData) => {
  const now = new Date();
  const checkInTime = attendanceData.checkInTime ? new Date(attendanceData.checkInTime) : new Date(now.setHours(now.getHours() - 8));
  const hours = (now - checkInTime) / (1000 * 60 * 60);
  
  return {
    ...attendanceData,
    checkOutTime: now,
    totalHours: parseFloat(hours.toFixed(2)),
    status: 'COMPLETED'
  };
};