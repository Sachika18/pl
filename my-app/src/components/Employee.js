import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import EmployeeService from './services/EmployeeService';
import defaultAvatar from '../assets/avatar.png';
import './Employee.css';
import AdminNavbar from './AdminNavbar';

const Employee = () => {
  const navigate = useNavigate();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [sortBy, setSortBy] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [departments, setDepartments] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [employeeToDelete, setEmployeeToDelete] = useState(null);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Function to handle delete employee
  const handleDeleteClick = (e, employee) => {
    e.stopPropagation(); // Prevent row click event
    
    // Ensure we have both id and _id formats
    const employeeWithIds = {
      ...employee,
      id: employee.id || employee._id,
      _id: employee._id || employee.id
    };
    
    console.log(`Preparing to delete employee: ${employee.name} with ID: ${employeeWithIds.id}`);
    
    setEmployeeToDelete(employeeWithIds);
    setShowDeleteConfirmation(true);
  };
  
  // Function to confirm delete
  const confirmDelete = async () => {
    if (!employeeToDelete) return;
    
    try {
      // Clear any existing messages
      setSuccessMessage('');
      setErrorMessage('');
      
      // Show loading message
      setLoading(true);
      
      console.log(`Employee component: Deleting employee with ID ${employeeToDelete.id} and name ${employeeToDelete.name}`);
      
      // DIRECT APPROACH: Since the service calls aren't working reliably
      // We'll implement a direct localStorage manipulation approach
      
      // Get the current employees from localStorage
      const storedEmployees = localStorage.getItem('workline_employees');
      if (storedEmployees) {
        const employees = JSON.parse(storedEmployees);
        
        // Store the deleted employee ID for verification
        const deletedId = employeeToDelete.id;
        const deletedMongoId = employeeToDelete._id;
        const deletedName = employeeToDelete.name;
        
        console.log(`Attempting to delete employee with ID: ${deletedId} and _id: ${deletedMongoId}`);
        
        // Log all employee IDs to help debug
        console.log('All employee IDs in localStorage before deletion:');
        employees.forEach(emp => {
          console.log(`- ID: ${emp.id || 'undefined'}, _id: ${emp._id || 'undefined'}, Name: ${emp.firstName} ${emp.lastName}`);
        });
        
        // Filter out the employee with the given ID (checking both id and _id fields)
        const updatedEmployees = employees.filter(emp => {
          // Check all possible ID formats
          const empId = emp.id || '';
          const empMongoId = emp._id || '';
          
          const shouldKeep = empId !== deletedId && empMongoId !== deletedId && 
                            empId !== deletedMongoId && empMongoId !== deletedMongoId;
          
          if (!shouldKeep) {
            console.log(`Removing employee: ${emp.firstName} ${emp.lastName} with ID: ${empId} and _id: ${empMongoId}`);
          }
          
          return shouldKeep;
        });
        
        // Log the before and after counts to verify deletion
        console.log(`Before deletion: ${employees.length} employees`);
        console.log(`After deletion: ${updatedEmployees.length} employees`);
        
        if (employees.length === updatedEmployees.length) {
          console.warn(`No employee was removed from localStorage with ID ${deletedId}`);
          throw new Error('Failed to delete employee from localStorage');
        } else {
          console.log(`Employee with ID ${deletedId} removed from localStorage`);
          
          // Clear localStorage first
          localStorage.removeItem('workline_employees');
          
          // Then set the updated employees
          localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
          
          // Close the confirmation dialog
          setShowDeleteConfirmation(false);
          
          // If the deleted employee is currently selected, close the modal
          if (selectedEmployee && (selectedEmployee.id === deletedId || selectedEmployee._id === deletedId)) {
            setShowModal(false);
            setSelectedEmployee(null);
          }
          
          // Clear the employee to delete
          setEmployeeToDelete(null);
          
          // Refresh the employee list to ensure it's up-to-date with the localStorage
          await fetchEmployees();
          
          // Show success message
          const successMsg = `Employee ${deletedName} has been successfully deleted`;
          setSuccessMessage(successMsg);
          console.log(successMsg);
          
          // Clear the success message after 5 seconds
          setTimeout(() => {
            setSuccessMessage('');
          }, 5000);
          
          // Try to call the service in the background (best effort)
          try {
            EmployeeService.deleteEmployee(deletedId).catch(error => {
              console.error('Background API delete failed:', error);
            });
          } catch (serviceError) {
            console.error('Error calling delete service in background:', serviceError);
          }
        }
      } else {
        throw new Error('No employees found in localStorage');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      
      // Show error message
      const errorMsg = `Failed to delete employee: ${error.message || 'Unknown error'}`;
      setErrorMessage(errorMsg);
      
      // Clear the error message after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to cancel delete
  const cancelDelete = () => {
    setShowDeleteConfirmation(false);
    setEmployeeToDelete(null);
  };
  
  // Function to force delete directly from localStorage
  const forceDeleteFromLocalStorage = () => {
    try {
      // Clear any existing messages
      setSuccessMessage('');
      setErrorMessage('');
      
      // Show loading message
      setLoading(true);
      
      if (!employeeToDelete) {
        throw new Error('No employee selected for deletion');
      }
      
      const deletedId = employeeToDelete.id;
      const deletedMongoId = employeeToDelete._id;
      const deletedName = employeeToDelete.name;
      
      console.log(`Force deleting employee: ${deletedName} with ID: ${deletedId} and _id: ${deletedMongoId}`);
      
      // Get current employees from localStorage
      const storedEmployees = localStorage.getItem('workline_employees');
      if (!storedEmployees) {
        throw new Error('No employees found in localStorage');
      }
      
      const employees = JSON.parse(storedEmployees);
      
      // Log all employee IDs to help debug
      console.log('All employee IDs in localStorage before force deletion:');
      employees.forEach(emp => {
        console.log(`- ID: ${emp.id || 'undefined'}, _id: ${emp._id || 'undefined'}, Name: ${emp.firstName} ${emp.lastName}`);
      });
      
      // Filter out the employee with the given ID (checking both id and _id fields)
      const updatedEmployees = employees.filter(emp => {
        const empId = emp.id || '';
        const empMongoId = emp._id || '';
        
        const shouldKeep = empId !== deletedId && empMongoId !== deletedId && 
                          empId !== deletedMongoId && empMongoId !== deletedMongoId;
        
        if (!shouldKeep) {
          console.log(`Force removing employee: ${emp.firstName} ${emp.lastName} with ID: ${empId} and _id: ${empMongoId}`);
        }
        
        return shouldKeep;
      });
      
      // Log the before and after counts to verify deletion
      console.log(`Before force deletion: ${employees.length} employees`);
      console.log(`After force deletion: ${updatedEmployees.length} employees`);
      
      if (employees.length === updatedEmployees.length) {
        throw new Error('No employee was removed from localStorage');
      }
      
      // Clear localStorage first
      localStorage.removeItem('workline_employees');
      
      // Then set the updated employees
      localStorage.setItem('workline_employees', JSON.stringify(updatedEmployees));
      
      // Close the confirmation dialog
      setShowDeleteConfirmation(false);
      
      // If the deleted employee is currently selected, close the modal
      if (selectedEmployee && (selectedEmployee.id === deletedId || selectedEmployee._id === deletedId)) {
        setShowModal(false);
        setSelectedEmployee(null);
      }
      
      // Clear the employee to delete
      setEmployeeToDelete(null);
      
      // Refresh the employee list
      fetchEmployees();
      
      // Show success message
      const successMsg = `Employee ${deletedName} has been forcefully deleted from storage`;
      setSuccessMessage(successMsg);
      console.log(successMsg);
      
      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
    } catch (error) {
      console.error('Error force deleting employee:', error);
      
      // Show error message
      const errorMsg = `Failed to force delete employee: ${error.message || 'Unknown error'}`;
      setErrorMessage(errorMsg);
      
      // Clear the error message after 5 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 5000);
    } finally {
      setLoading(false);
    }
  };
  
  // Function to clear cache and refresh
  const clearCacheAndRefresh = async () => {
    try {
      console.log('Clearing employee cache and refreshing...');
      
      // Clear any existing messages
      setSuccessMessage('');
      setErrorMessage('');
      
      // Clear localStorage
      localStorage.removeItem('workline_employees');
      
      // Show loading state
      setLoading(true);
      
      // Try to get fresh data from API
      try {
        const apiEmployees = await EmployeeService.getAllEmployees();
        console.log(`Retrieved ${apiEmployees ? apiEmployees.length : 0} employees from API`);
        
        // If we got data from the API, format and store it
        if (apiEmployees && Array.isArray(apiEmployees) && apiEmployees.length > 0) {
          // Format employee data
          const formattedEmployees = apiEmployees.map(emp => {
            // Generate a consistent ID or use existing ones
            const empId = emp.id || emp._id || Math.random().toString(36).substring(2, 9);
            
            return {
              // Store both ID formats to ensure compatibility
              id: empId,
              _id: empId,
              firstName: emp.firstName || '',
              lastName: emp.lastName || '',
              name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
              position: emp.position || emp.jobTitle || 'Employee',
              department: emp.department || 'General',
              status: emp.status || 'offline',
              employeeId: emp.employeeId || empId || 'N/A',
              email: emp.email || '',
              phone: emp.phone || emp.phoneNumber || emp.mobileNumber || emp.mobile || 'Not provided',
              address: emp.address || emp.homeAddress || emp.residentialAddress || 'Not provided',
              joinDate: emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : (emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'Not provided'),
              salary: emp.salary || 'Not provided',
              avatar: emp.avatar || null,
              skills: Array.isArray(emp.skills) ? emp.skills : [],
              education: Array.isArray(emp.education) ? emp.education : [],
              projects: Array.isArray(emp.projects) ? emp.projects : [],
              performance: emp.performance || { rating: 'N/A', reviews: [] }
            };
          });
          
          // Store the formatted employees in localStorage
          localStorage.setItem('workline_employees', JSON.stringify(formattedEmployees));
          console.log(`Stored ${formattedEmployees.length} formatted employees in localStorage`);
          
          // Update state with the formatted employees
          setEmployees(formattedEmployees);
          
          // Extract unique departments for filtering
          const uniqueDepartments = [...new Set(formattedEmployees.map(emp => emp.department))];
          setDepartments(uniqueDepartments);
        } else {
          // If API returned no data, fetch from localStorage as fallback
          await fetchEmployees();
        }
      } catch (apiError) {
        console.error('Error fetching from API:', apiError);
        // If API failed, fetch from localStorage as fallback
        await fetchEmployees();
      }
      
      // Show success message
      setSuccessMessage('Employee data refreshed successfully');
      
      // Clear the success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
    } catch (error) {
      console.error('Error refreshing data:', error);
      setErrorMessage('Failed to refresh employee data');
      
      // Clear the error message after 3 seconds
      setTimeout(() => {
        setErrorMessage('');
      }, 3000);
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch employees from localStorage or API
  const fetchEmployees = async () => {
    try {
      setLoading(true);
      console.log('Employee component: Fetching employees...');
      
      // Clear existing employees first to avoid showing stale data
      setEmployees([]);
      
      // Get employees directly from localStorage first
      let allEmployees = [];
      const storedEmployees = localStorage.getItem('workline_employees');
      
      if (storedEmployees) {
        try {
          allEmployees = JSON.parse(storedEmployees);
          console.log(`Employee component: Retrieved ${allEmployees.length} employees from localStorage`);
        } catch (parseError) {
          console.error('Error parsing employees from localStorage:', parseError);
          localStorage.removeItem('workline_employees'); // Clear invalid data
        }
      }
      
      // If localStorage is empty or invalid, try the API
      if (!allEmployees || !Array.isArray(allEmployees) || allEmployees.length === 0) {
        try {
          console.log('Employee component: No employees in localStorage, trying API...');
          allEmployees = await EmployeeService.getAllEmployees();
          console.log(`Employee component: Received ${allEmployees ? allEmployees.length : 0} employees from API`);
        } catch (apiError) {
          console.error('Error fetching employees from API:', apiError);
          allEmployees = []; // Ensure we have an array
        }
      }
      
      // Log the first employee to see what fields are available
      if (allEmployees && Array.isArray(allEmployees) && allEmployees.length > 0) {
        console.log('Employee data sample:', allEmployees[0]);
        console.log('Skills data:', allEmployees[0].skills);
        console.log('Join date data:', allEmployees[0].joinDate || allEmployees[0].joiningDate);
        
        // Format employee data
        const formattedEmployees = allEmployees.map(emp => {
          // Generate a consistent ID or use existing ones
          const empId = emp.id || emp._id || Math.random().toString(36).substring(2, 9);
          
          return {
            // Store both ID formats to ensure compatibility
            id: empId,
            _id: empId,
            firstName: emp.firstName || '',
            lastName: emp.lastName || '',
            name: `${emp.firstName || ''} ${emp.lastName || ''}`.trim() || 'Unknown',
            position: emp.position || emp.jobTitle || 'Employee',
            department: emp.department || 'General',
            status: emp.status || 'offline',
            employeeId: emp.employeeId || empId || 'N/A',
            email: emp.email || '',
            // Handle different possible field names for phone number
            phone: emp.phone || emp.phoneNumber || emp.mobileNumber || emp.mobile || 'Not provided',
            // Handle different possible field names for address
            address: emp.address || emp.homeAddress || emp.residentialAddress || 'Not provided',
            joinDate: emp.joinDate ? new Date(emp.joinDate).toLocaleDateString() : (emp.joiningDate ? new Date(emp.joiningDate).toLocaleDateString() : 'Not provided'),
            salary: emp.salary || 'Not provided',
            avatar: emp.avatar || null,
            skills: Array.isArray(emp.skills) ? emp.skills : [],
            education: Array.isArray(emp.education) ? emp.education : [],
            projects: Array.isArray(emp.projects) ? emp.projects : [],
            performance: emp.performance || { rating: 'N/A', reviews: [] }
          };
        });
        
        // Store the formatted employees in localStorage for future use
        try {
          localStorage.setItem('workline_employees', JSON.stringify(formattedEmployees));
          console.log(`Employee component: Stored ${formattedEmployees.length} formatted employees in localStorage`);
        } catch (storageError) {
          console.error('Error storing employees in localStorage:', storageError);
        }
        
        // Update state with the formatted employees
        setEmployees(formattedEmployees);
        
        // Extract unique departments for filtering
        const uniqueDepartments = [...new Set(formattedEmployees.map(emp => emp.department))];
        setDepartments(uniqueDepartments);
      } else {
        setError('No employee data found');
      }
    } catch (error) {
      console.error('Error fetching employees:', error);
      setError('Failed to fetch employee data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
  }, []);

  // Handle search and filtering
  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = employee.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         employee.position.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDepartment = filterDepartment === 'all' || employee.department === filterDepartment;
    
    return matchesSearch && matchesDepartment;
  });

  // Handle sorting
  const sortedEmployees = [...filteredEmployees].sort((a, b) => {
    let comparison = 0;
    
    switch (sortBy) {
      case 'name':
        comparison = a.name.localeCompare(b.name);
        break;
      case 'department':
        comparison = a.department.localeCompare(b.department);
        break;
      case 'position':
        comparison = a.position.localeCompare(b.position);
        break;
      case 'employeeId':
        comparison = a.employeeId.localeCompare(b.employeeId);
        break;
      case 'joinDate':
        comparison = new Date(a.joinDate) - new Date(b.joinDate);
        break;
      default:
        comparison = a.name.localeCompare(b.name);
    }
    
    return sortOrder === 'asc' ? comparison : -comparison;
  });

  // Handle employee selection for detailed view
  const handleEmployeeSelect = async (employee) => {
    try {
      // Set the selected employee immediately for better UX
      setSelectedEmployee(employee);
      setShowModal(true);
      
      // Determine the correct ID to use (handle both id and _id formats)
      const employeeId = employee.id || employee._id;
      
      console.log(`Getting detailed information for employee: ${employee.name} with ID: ${employeeId}`);
      
      // Try to get more detailed employee information
      const detailedEmployee = await EmployeeService.getEmployeeById(employeeId);
      
      if (detailedEmployee) {
        console.log('Detailed employee data:', detailedEmployee);
        console.log('Detailed skills data:', detailedEmployee.skills);
        console.log('Detailed join date data:', detailedEmployee.joinDate || detailedEmployee.joiningDate);
        
        // Format the detailed employee data
        const formattedEmployee = {
          ...employee,
          // Ensure we have the correct ID (both formats)
          id: employeeId,
          _id: employeeId,
          // Update with more detailed information if available
          phone: detailedEmployee.phone || detailedEmployee.phoneNumber || detailedEmployee.mobileNumber || detailedEmployee.mobile || employee.phone,
          address: detailedEmployee.address || detailedEmployee.homeAddress || detailedEmployee.residentialAddress || employee.address,
          joinDate: detailedEmployee.joinDate ? new Date(detailedEmployee.joinDate).toLocaleDateString() : 
                   (detailedEmployee.joiningDate ? new Date(detailedEmployee.joiningDate).toLocaleDateString() : employee.joinDate),
          skills: Array.isArray(detailedEmployee.skills) ? detailedEmployee.skills : (Array.isArray(employee.skills) ? employee.skills : []),
          education: Array.isArray(detailedEmployee.education) ? detailedEmployee.education : (Array.isArray(employee.education) ? employee.education : []),
          projects: Array.isArray(detailedEmployee.projects) ? detailedEmployee.projects : (Array.isArray(employee.projects) ? employee.projects : []),
          performance: detailedEmployee.performance || employee.performance || { rating: 'N/A', reviews: [] }
        };
        
        setSelectedEmployee(formattedEmployee);
      }
    } catch (error) {
      console.error('Error fetching detailed employee data:', error);
      // Modal is already open with the basic employee data
    }
  };

  // Close modal
  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/admin')}>Back to Dashboard</button>
      </div>
    );
  }

  return (
    <div>
      <AdminNavbar onSidebarToggle={() => {}} />
      <div className="employee-page-container">
      <header className="employee-header">
        <div className="header-left">
          <h1>Employee Management</h1>
          <p>Manage your organization's workforce</p>
        </div>
        <div className="header-right">
          <button className="add-employee-btn">
            <span>+</span> Add New Employee
          </button>
          <button className="refresh-btn" onClick={clearCacheAndRefresh} title="Clear cache and refresh employee list">
            🔄 Refresh
          </button>
          <button className="back-btn" onClick={() => navigate('/admin')}>
            Back to Dashboard
          </button>
        </div>
      </header>
      
      {/* Success and Error Messages */}
      {successMessage && (
        <div className="message-container success-message">
          <span className="message-icon">✓</span>
          <span className="message-text">{successMessage}</span>
          <button className="close-message-btn" onClick={() => setSuccessMessage('')}>×</button>
        </div>
      )}
      
      {errorMessage && (
        <div className="message-container error-message">
          <span className="message-icon">⚠</span>
          <span className="message-text">{errorMessage}</span>
          <button className="close-message-btn" onClick={() => setErrorMessage('')}>×</button>
        </div>
      )}

      <div className="employee-controls">
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by name, ID, email, or position..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <span className="search-icon">🔍</span>
          </div>
          
          <div className="filter-box">
            <label>Department:</label>
            <select 
              value={filterDepartment} 
              onChange={(e) => setFilterDepartment(e.target.value)}
            >
              <option value="all">All Departments</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>{dept}</option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="sort-container">
          <label>Sort by:</label>
          <select 
            value={sortBy} 
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="department">Department</option>
            <option value="position">Position</option>
            <option value="employeeId">Employee ID</option>
            <option value="joinDate">Join Date</option>
          </select>
          
          <button 
            className="sort-order-btn" 
            onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
          >
            {sortOrder === 'asc' ? '↑' : '↓'}
          </button>
        </div>
      </div>

      <div className="employee-stats">
        <div className="stat-card">
          <h3>Total Employees</h3>
          <p>{employees.length}</p>
        </div>
        <div className="stat-card">
          <h3>Departments</h3>
          <p>{departments.length}</p>
        </div>
        <div className="stat-card">
          <h3>New This Month</h3>
          <p>{employees.filter(emp => {
            const joinDate = new Date(emp.joinDate);
            const now = new Date();
            return joinDate.getMonth() === now.getMonth() && joinDate.getFullYear() === now.getFullYear();
          }).length}</p>
        </div>
      </div>

      <div className="employee-table-container">
        <table className="employee-table">
          <thead>
            <tr>
              <th>Employee</th>
              <th>ID</th>
              <th>Department</th>
              <th>Position</th>
              <th>Email</th>
              <th>Join Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEmployees.map(employee => (
              <tr 
                key={employee.id} 
                onClick={() => handleEmployeeSelect(employee)}
                style={{ cursor: 'pointer' }}
              >
                <td className="employee-name-cell">
                  <div className="employee-avatar-small">
                    <img src={employee.avatar || defaultAvatar} alt={employee.name} />
                  </div>
                  <span>{employee.name}</span>
                </td>
                <td>{employee.employeeId}</td>
                <td>
                  <span className={`department-badge ${employee.department.toLowerCase()}`}>
                    {employee.department}
                  </span>
                </td>
                <td>{employee.position}</td>
                <td>{employee.email}</td>
                <td>{employee.joinDate}</td>
                <td className="actions-cell">
                  <button 
                    className="action-btn view-btn" 
                    title="View Details"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEmployeeSelect(employee);
                    }}
                  >
                    👁️
                  </button>
                  <button 
                    className="action-btn delete-btn" 
                    title="Delete Employee"
                    onClick={(e) => handleDeleteClick(e, employee)}
                  >
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirmation && employeeToDelete && (
        <div className="modal-overlay">
          <div className="delete-confirmation-modal">
            <h3>Confirm Delete</h3>
            <p>Are you sure you want to delete employee <strong>{employeeToDelete.name}</strong>?</p>
            <p>This action cannot be undone.</p>
            <div className="confirmation-buttons">
              <button className="cancel-btn" onClick={cancelDelete}>Cancel</button>
              <button className="delete-confirm-btn" onClick={confirmDelete}>Delete</button>
            </div>
            <p className="delete-note">Having trouble? Try the direct method:</p>
            <div className="confirmation-buttons">
              <button className="force-delete-btn" onClick={forceDeleteFromLocalStorage}>Force Delete from Storage</button>
            </div>
          </div>
        </div>
      )}
      
      {/* Employee Detail Modal */}
      {showModal && selectedEmployee && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="employee-detail-modal" onClick={e => e.stopPropagation()}>
            <button className="close-modal-btn" onClick={closeModal}>×</button>
            
            <div className="employee-detail-header">
              <div className="employee-avatar-large">
                <img src={selectedEmployee.avatar || defaultAvatar} alt={selectedEmployee.name} />
              </div>
              <div className="employee-basic-info">
                <h2>{selectedEmployee.name}</h2>
                <p className="employee-position">{selectedEmployee.position}</p>
                <p className="employee-department">
                  <span className={`department-badge ${selectedEmployee.department.toLowerCase()}`}>
                    {selectedEmployee.department}
                  </span>
                </p>
                <p className="employee-id">ID: {selectedEmployee.employeeId}</p>
              </div>
            </div>
            
            <div className="employee-detail-content">
              <div className="detail-section">
                <h3>Contact Information</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{selectedEmployee.email}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Phone:</span>
                    <span className="detail-value">
                      {selectedEmployee.phone === 'Not provided' ? (
                        <span className="missing-data">
                          Not provided
                        </span>
                      ) : (
                        <span className="detail-value">
                          {selectedEmployee.phone}
                        </span>
                      )}
                    </span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Address:</span>
                    <span className="detail-value">
                      {selectedEmployee.address === 'Not provided' ? (
                        <span className="missing-data">
                          Not provided
                        </span>
                      ) : (
                        <span className="detail-value">
                          {selectedEmployee.address}
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="detail-section">
                <h3>Employment Details</h3>
                <div className="detail-grid">
                  <div className="detail-item">
                    <span className="detail-label">Join Date:</span>
                    <span className="detail-value">{selectedEmployee.joinDate}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Salary:</span>
                    <span className="detail-value">{selectedEmployee.salary}</span>
                  </div>
                </div>
              </div>
              
              {selectedEmployee.skills && Array.isArray(selectedEmployee.skills) && selectedEmployee.skills.length > 0 && (
                <div className="detail-section">
                  <h3>Skills</h3>
                  <div className="skills-container">
                    {selectedEmployee.skills.map((skill, index) => (
                      <span key={index} className="skill-badge">{skill}</span>
                    ))}
                  </div>
                </div>
              )}
              
              {selectedEmployee.education && Array.isArray(selectedEmployee.education) && selectedEmployee.education.length > 0 && (
                <div className="detail-section">
                  <h3>Education</h3>
                  <ul className="education-list">
                    {selectedEmployee.education.map((edu, index) => (
                      <li key={index}>
                        <strong>{edu.degree || 'Degree'}</strong> - {edu.institution || 'Institution'}
                        <span className="education-year">({edu.year || 'N/A'})</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              
              {selectedEmployee.projects && Array.isArray(selectedEmployee.projects) && selectedEmployee.projects.length > 0 && (
                <div className="detail-section">
                  <h3>Projects</h3>
                  <ul className="projects-list">
                    {selectedEmployee.projects.map((project, index) => (
                      <li key={index}>
                        <strong>{project.name || 'Project'}</strong>
                        <p>{project.description || 'No description available'}</p>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button 
                className="modal-action-btn assign-btn"
                onClick={() => navigate('/admintask')}
              >
                Assign Task
              </button>
              <button className="modal-action-btn message-btn">Send Message</button>
            </div>
          </div>
        </div>
      )}
    </div>
    </div>
  );
};

export default Employee;