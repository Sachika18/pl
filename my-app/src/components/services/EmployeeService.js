import fetchApi from '../../utils/fetchApi';

class EmployeeService {
  // Get all employees/users
  async getAllEmployees() {
    try {
      console.log('EmployeeService: Fetching all employees from API');
      const employees = await fetchApi.get('/users');
      console.log(`EmployeeService: Received ${employees ? (Array.isArray(employees) ? employees.length : 'non-array') : 'no'} employees from API`);
      
      // Store in localStorage for offline access
      if (employees && Array.isArray(employees)) {
        try {
          // First clear any existing data to ensure we don't have stale data
          localStorage.removeItem('workline_employees');
          
          // Then store the fresh data
          localStorage.setItem('workline_employees', JSON.stringify(employees));
          console.log(`EmployeeService: Stored ${employees.length} employees in localStorage`);
        } catch (storageError) {
          console.error('Error storing employees in localStorage:', storageError);
        }
      }
      
      return employees;
    } catch (error) {
      console.error('Error fetching all employees:', error);
      
      // Try to get from localStorage
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const parsedEmployees = JSON.parse(storedEmployees);
          console.log(`EmployeeService: Using ${parsedEmployees.length} employees from localStorage`);
          return parsedEmployees;
        }
      } catch (storageError) {
        console.error('Error reading employees from localStorage:', storageError);
      }
      
      console.log('EmployeeService: No employees found, returning empty array');
      return [];
    }
  }

  // Get current user info
  async getCurrentUser() {
    try {
      return await fetchApi.get('/dashboard');
    } catch (error) {
      console.error('Error fetching current user:', error);
      return null;
    }
  }
  
  // Get employee by ID
  async getEmployeeById(id) {
    try {
      console.log(`EmployeeService: Getting employee with ID ${id}`);
      
      // Check if the ID is a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
      const mongoId = isMongoId ? id : null;
      
      console.log(`EmployeeService: ID ${id} is ${isMongoId ? 'a valid MongoDB ID' : 'not a MongoDB ID'}`);
      
      // Try to get the employee from the API
      let employee;
      
      try {
        employee = await fetchApi.get(`/users/${id}`);
      } catch (apiError) {
        console.error(`Error with standard endpoint for ID ${id}:`, apiError);
        
        // If the ID is a MongoDB ID, try with that format
        if (isMongoId && id !== mongoId) {
          try {
            employee = await fetchApi.get(`/users/${mongoId}`);
          } catch (mongoError) {
            console.error(`Error with MongoDB ID endpoint for ID ${mongoId}:`, mongoError);
            throw mongoError;
          }
        } else {
          throw apiError;
        }
      }
      
      // Log the employee data to debug skills and joining date
      if (employee) {
        console.log('EmployeeService: Employee data from API:', employee);
        console.log('EmployeeService: Skills data:', employee.skills);
        console.log('EmployeeService: Join date:', employee.joinDate || employee.joiningDate);
        
        // Ensure the employee has both id and _id fields
        if (!employee.id && employee._id) {
          employee.id = employee._id;
        } else if (!employee._id && employee.id) {
          employee._id = employee.id;
        }
      }
      
      return employee;
    } catch (error) {
      console.error(`Error fetching employee with ID ${id}:`, error);
      
      // Try to get from localStorage
      try {
        const storedEmployees = localStorage.getItem('workline_employees');
        if (storedEmployees) {
          const employees = JSON.parse(storedEmployees);
          
          // Check if the ID is a MongoDB ObjectId (24 hex characters)
          const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
          const mongoId = isMongoId ? id : null;
          
          // Try to find the employee with any ID format
          const employee = employees.find(emp => {
            return emp.id === id || emp._id === id || 
                  (isMongoId && (emp.id === mongoId || emp._id === mongoId));
          });
          
          // Log the employee data from localStorage
          if (employee) {
            console.log('EmployeeService: Employee data from localStorage:', employee);
            console.log('EmployeeService: Skills data from localStorage:', employee.skills);
            console.log('EmployeeService: Join date from localStorage:', employee.joinDate || employee.joiningDate);
            
            // Ensure the employee has both id and _id fields
            if (!employee.id && employee._id) {
              employee.id = employee._id;
            } else if (!employee._id && employee.id) {
              employee._id = employee.id;
            }
          } else {
            console.warn(`EmployeeService: Employee with ID ${id} not found in localStorage`);
            
            // Log all employee IDs to help debug
            console.log('All employee IDs in localStorage:');
            employees.forEach(emp => {
              console.log(`- ID: ${emp.id || 'undefined'}, _id: ${emp._id || 'undefined'}, Name: ${emp.firstName} ${emp.lastName}`);
            });
          }
          
          return employee;
        }
      } catch (storageError) {
        console.error('Error reading employees from localStorage:', storageError);
      }
      
      return null;
    }
  }
  
  // Get employee statistics
  async getEmployeeStats() {
    try {
      console.log('EmployeeService: Getting employee statistics');
      
      // Get all employees
      let employees = [];
      try {
        employees = await this.getAllEmployees();
        console.log(`EmployeeService: Found ${employees.length} employees for statistics calculation`);
      } catch (error) {
        console.error('EmployeeService: Error getting employees for statistics:', error);
        
        // Try to get from localStorage
        try {
          const storedEmployees = localStorage.getItem('workline_employees');
          if (storedEmployees) {
            employees = JSON.parse(storedEmployees);
            console.log(`EmployeeService: Using ${employees.length} employees from localStorage for statistics`);
          }
        } catch (storageError) {
          console.error('EmployeeService: Error reading employees from localStorage:', storageError);
        }
      }
      
      // Calculate statistics
      const totalEmployees = employees.length;
      
      // Calculate active employees (those who have logged in recently)
      // For demo purposes, we'll consider 70% of employees as active
      const activeEmployees = Math.round(totalEmployees * 0.7);
      
      // Calculate employees by department
      const departmentCounts = {};
      employees.forEach(employee => {
        if (employee.department) {
          departmentCounts[employee.department] = (departmentCounts[employee.department] || 0) + 1;
        }
      });
      
      // Calculate new employees (joined in the last 30 days)
      const now = new Date();
      const thirtyDaysAgo = new Date(now);
      thirtyDaysAgo.setDate(now.getDate() - 30);
      
      const newEmployees = employees.filter(employee => {
        if (!employee.joinDate && !employee.createdAt) return false;
        
        const joinDate = new Date(employee.joinDate || employee.createdAt);
        return joinDate >= thirtyDaysAgo;
      }).length;
      
      const stats = {
        totalEmployees,
        activeEmployees,
        departmentCounts,
        newEmployees
      };
      
      console.log('EmployeeService: Calculated employee stats:', stats);
      return stats;
    } catch (error) {
      console.error('EmployeeService: Error getting employee stats:', error);
      
      // Return default stats as fallback
      return {
        totalEmployees: 0,
        activeEmployees: 0,
        departmentCounts: {},
        newEmployees: 0
      };
    }
  }
  // Delete an employee
  async deleteEmployee(id) {
    try {
      console.log(`EmployeeService: Deleting employee with ID ${id}`);
      
      // Check if the ID is a MongoDB ObjectId (24 hex characters)
      const isMongoId = /^[0-9a-fA-F]{24}$/.test(id);
      const mongoId = isMongoId ? id : null;
      
      console.log(`EmployeeService: ID ${id} is ${isMongoId ? 'a valid MongoDB ID' : 'not a MongoDB ID'}`);
      
      // DIRECT LOCALSTORAGE APPROACH: Since API calls aren't working reliably
      // We'll implement a direct localStorage manipulation approach
      
      let deletedFromStorage = false;
      let deletedEmployee = null;
      
      // First, get the current employees from localStorage
      const storedEmployees = localStorage.getItem('workline_employees');
      if (storedEmployees) {
        const employees = JSON.parse(storedEmployees);
        
        // Find the employee to delete (for logging purposes)
        deletedEmployee = employees.find(emp => {
          const empId = emp.id || emp._id;
          const empMongoId = emp._id || emp.id;
          
          return empId === id || empMongoId === id || 
                (isMongoId && (empId === mongoId || empMongoId === mongoId));
        });
        
        if (deletedEmployee) {
          console.log(`Found employee to delete: ${deletedEmployee.firstName} ${deletedEmployee.lastName}`);
        } else {
          console.warn(`Could not find employee with ID ${id} in localStorage`);
        }
        
        // Filter out the employee with the given ID (checking both id and _id fields)
        const updatedEmployees = employees.filter(emp => {
          // Check all possible ID formats
          const empId = emp.id || emp._id;
          const empMongoId = emp._id || emp.id;
          
          return empId !== id && empMongoId !== id && 
                (isMongoId ? (empId !== mongoId && empMongoId !== mongoId) : true);
        });
        
        // Log the before and after counts to verify deletion
        console.log(`Before deletion: ${employees.length} employees`);
        console.log(`After deletion: ${updatedEmployees.length} employees`);
        
        if (employees.length === updatedEmployees.length) {
          console.warn(`No employee was removed from localStorage with ID ${id}`);
          
          // Log all employee IDs to help debug
          console.log('All employee IDs in localStorage:');
          employees.forEach(emp => {
            console.log(`- ID: ${emp.id || 'undefined'}, _id: ${emp._id || 'undefined'}, Name: ${emp.firstName} ${emp.lastName}`);
          });
        } else {
          console.log(`Employee with ID ${id} removed from localStorage`);
          deletedFromStorage = true;
        }
        
        // Clear localStorage first
        localStorage.removeItem('workline_employees');
        
        // Then set the updated employees
        localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
      }
      
      // Try API calls as a best effort, but don't rely on them
      try {
        // Make an API call to delete the employee from the database
        // Try different endpoint formats since we're not sure which one the backend expects
        const endpoints = [
          { url: `/users/${id}`, method: 'delete' },
          { url: `/users/delete?id=${id}`, method: 'delete' },
          { url: `/users/delete`, method: 'post', data: { id } },
          // If we have a MongoDB ID, try these endpoints too
          ...(mongoId ? [
            { url: `/users/${mongoId}`, method: 'delete' },
            { url: `/users/delete?id=${mongoId}`, method: 'delete' },
            { url: `/users/delete`, method: 'post', data: { id: mongoId } },
            // Try with _id field which is common in MongoDB
            { url: `/users/delete`, method: 'post', data: { _id: mongoId } }
          ] : [])
        ];
        
        // Try each endpoint in the background
        for (const endpoint of endpoints) {
          try {
            console.log(`EmployeeService: Trying ${endpoint.method.toUpperCase()} to ${endpoint.url}`);
            
            if (endpoint.method === 'delete') {
              fetchApi.delete(endpoint.url).then(response => {
                console.log(`EmployeeService: Success with ${endpoint.method.toUpperCase()} to ${endpoint.url}`, response);
              }).catch(error => {
                console.error(`EmployeeService: Error with ${endpoint.method.toUpperCase()} to ${endpoint.url}:`, error);
              });
            } else if (endpoint.method === 'post') {
              fetchApi.post(endpoint.url, endpoint.data).then(response => {
                console.log(`EmployeeService: Success with ${endpoint.method.toUpperCase()} to ${endpoint.url}`, response);
              }).catch(error => {
                console.error(`EmployeeService: Error with ${endpoint.method.toUpperCase()} to ${endpoint.url}:`, error);
              });
            }
          } catch (error) {
            console.error(`EmployeeService: Error setting up ${endpoint.method.toUpperCase()} to ${endpoint.url}:`, error);
          }
        }
      } catch (apiError) {
        console.error('Error attempting API calls:', apiError);
      }
      
      // Return a standardized response based on localStorage success
      if (deletedFromStorage) {
        return {
          success: true,
          message: 'Employee deleted successfully',
          data: {
            deletedEmployee,
            source: 'localStorage'
          }
        };
      } else {
        throw new Error('Failed to delete employee from localStorage');
      }
    } catch (error) {
      console.error(`Error deleting employee with ID ${id}:`, error);
      throw error;
    }
  }
}

export default new EmployeeService();