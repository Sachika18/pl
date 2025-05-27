import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import './Calendar.css';

// Leave type colors
const LEAVE_COLORS = {
  'Casual': '#4318FF',
  'Sick': '#FF5252',
  'Earned': '#FFB547'
};

// Holiday type colors
const HOLIDAY_COLORS = {
  'NATIONAL': '#05CD99',
  'FESTIVAL': '#FF9800',
  'GOVERNMENT': '#3F51B5',
  'COMPANY': '#9C27B0'
};

const Calendar = () => {
  const navigate = useNavigate();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tooltipInfo, setTooltipInfo] = useState(null);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [newLeaveRequest, setNewLeaveRequest] = useState({
    type: 'Casual',
    startDate: new Date(),
    endDate: new Date(),
    reason: ''
  });
  const [leaves, setLeaves] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [leaveBalance, setLeaveBalance] = useState({
    Casual: { total: 20, used: 0 },
    Sick: { total: 15, used: 0 },
    Earned: { total: 10, used: 0 }
  });
  const [notes, setNotes] = useState({});
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [currentNote, setCurrentNote] = useState({
    date: null,
    text: ''
  });
  const [tasks, setTasks] = useState({});
  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [currentTask, setCurrentTask] = useState({
    date: null,
    title: '',
    description: '',
    priority: 'Medium'
  });
  
  // Load saved notes and tasks from localStorage
  useEffect(() => {
    try {
      const savedNotes = localStorage.getItem('calendar_notes');
      if (savedNotes) {
        setNotes(JSON.parse(savedNotes));
      }
      
      const savedTasks = localStorage.getItem('calendar_tasks');
      if (savedTasks) {
        setTasks(JSON.parse(savedTasks));
      }
    } catch (e) {
      console.error('Error loading data from localStorage:', e);
    }
  }, []);

  // Fetch user info, leaves, and holidays
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('No token found: Redirecting to login');
          navigate('/login');
          return;
        }

        // Fetch user data
        try {
          const userResponse = await axios.get('http://localhost:8080/api/dashboard', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          setUser(userResponse.data);
        } catch (userError) {
          console.error('Error fetching user data:', userError);
          // Use mock user data as fallback
          setUser({
            name: 'Demo User',
            role: 'Employee',
            email: 'demo@example.com',
            employeeId: 'EMP001',
          });
        }
        
        // Fetch leaves
        try {
          const leavesResponse = await axios.get('http://localhost:8080/api/leaves/user', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Format leave data
          const formattedLeaves = leavesResponse.data.map(leave => ({
            id: leave.id,
            type: leave.leaveType,
            status: leave.status,
            reason: leave.reason,
            startDate: new Date(leave.fromDate),
            endDate: new Date(leave.toDate),
            color: LEAVE_COLORS[leave.leaveType] || '#9E9E9E'
          }));
          
          setLeaves(formattedLeaves);
          
          // Calculate leave balance
          const balance = {
            Casual: { total: 20, used: 0 },
            Sick: { total: 15, used: 0 },
            Earned: { total: 10, used: 0 }
          };
          
          formattedLeaves.forEach(leave => {
            if (leave.status === 'APPROVED' || leave.status === 'Approved') {
              const diffTime = Math.abs(leave.endDate - leave.startDate);
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
              balance[leave.type].used += diffDays;
            }
          });
          
          setLeaveBalance(balance);
          
        } catch (leavesError) {
          console.error('Error fetching leaves:', leavesError);
          // Use sample leaves as fallback
          const currentYear = new Date().getFullYear();
          const sampleLeaves = [
            { 
              id: 1, 
              type: 'Casual', 
              status: 'Approved', 
              reason: 'Family event', 
              startDate: new Date(currentYear, 3, 10), 
              endDate: new Date(currentYear, 3, 12),
              color: LEAVE_COLORS['Casual']
            },
            { 
              id: 2, 
              type: 'Sick', 
              status: 'Approved', 
              reason: 'Flu', 
              startDate: new Date(currentYear, 3, 18), 
              endDate: new Date(currentYear, 3, 19),
              color: LEAVE_COLORS['Sick']
            }
          ];
          setLeaves(sampleLeaves);
        }
        
        // Fetch holidays
        try {
          const holidaysResponse = await axios.get('http://localhost:8080/api/holidays', {
            headers: {
              Authorization: `Bearer ${token}`
            }
          });
          
          // Format holiday data
          const formattedHolidays = holidaysResponse.data.map(holiday => ({
            id: holiday.id,
            name: holiday.name,
            date: new Date(holiday.date),
            type: holiday.type,
            description: holiday.description,
            color: holiday.color || HOLIDAY_COLORS[holiday.type] || '#05CD99'
          }));
          
          setHolidays(formattedHolidays);
          
        } catch (holidaysError) {
          console.error('Error fetching holidays:', holidaysError);
          // Use sample holidays as fallback
          const currentYear = new Date().getFullYear();
          const sampleHolidays = [
            {
              id: 1,
              name: 'New Year\'s Day',
              date: new Date(currentYear, 0, 1),
              type: 'NATIONAL',
              description: 'New Year\'s Day celebration',
              color: HOLIDAY_COLORS['NATIONAL']
            },
            {
              id: 2,
              name: 'Republic Day',
              date: new Date(currentYear, 0, 26),
              type: 'NATIONAL',
              description: 'Republic Day celebration',
              color: HOLIDAY_COLORS['NATIONAL']
            },
            {
              id: 3,
              name: 'Labor Day',
              date: new Date(currentYear, 4, 1),
              type: 'GOVERNMENT',
              description: 'International Workers\' Day',
              color: HOLIDAY_COLORS['GOVERNMENT']
            }
          ];
          setHolidays(sampleHolidays);
        }
        
      } catch (error) {
        console.error('Error fetching data:', error);
        setError('Error connecting to the server');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [navigate]);

  const renderHeader = () => {
    const dateFormat = { month: 'long', year: 'numeric' };
    
    return (
      <div className="calendar-header">
        <div className="calendar-navigation">
          <button onClick={prevMonth}>
            <span className="nav-icon">◀</span>
          </button>
          <h2>{currentMonth.toLocaleDateString('en-US', dateFormat)}</h2>
          <button onClick={nextMonth}>
            <span className="nav-icon">▶</span>
          </button>
        </div>
      </div>
    );
  };

  const renderDays = () => {
    const days = [];
    const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    for (let i = 0; i < 7; i++) {
      days.push(
        <div className="day-header" key={i}>
          {daysOfWeek[i]}
        </div>
      );
    }
    
    return <div className="days-row">{days}</div>;
  };

  const renderCells = () => {
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
    const startDate = new Date(monthStart);
    const endDate = new Date(monthEnd);
    
    // Adjust the start date to the previous Sunday
    startDate.setDate(startDate.getDate() - startDate.getDay());
    
    // Adjust the end date to the next Saturday
    endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
    
    const rows = [];
    let days = [];
    let day = new Date(startDate);
    
    while (day <= endDate) {
      for (let i = 0; i < 7; i++) {
        const cloneDay = new Date(day);
        
        // Find leaves for this day
        const matchingLeaves = leaves.filter(leave => 
          cloneDay >= leave.startDate && cloneDay <= leave.endDate
        );
        
        // Find holiday for this day
        const matchingHoliday = holidays.find(holiday => 
          holiday.date.getDate() === cloneDay.getDate() && 
          holiday.date.getMonth() === cloneDay.getMonth() && 
          holiday.date.getFullYear() === cloneDay.getFullYear()
        );
        
        const isCurrentMonth = cloneDay.getMonth() === currentMonth.getMonth();
        const isToday = cloneDay.toDateString() === new Date().toDateString();
        const isSelected = cloneDay.toDateString() === selectedDate.toDateString();
        const isSunday = cloneDay.getDay() === 0; // Check if it's Sunday
        
        // Check if there's a note or tasks for this day
        const dateStr = cloneDay.toISOString().split('T')[0];
        const hasNote = notes[dateStr] ? true : false;
        const dayTasks = tasks[dateStr] || [];
        
        days.push(
          <div 
            className={`calendar-cell ${!isCurrentMonth ? 'disabled' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${isSunday ? 'sunday' : ''}`}
            key={cloneDay.toString()}
            onClick={() => onDateClick(cloneDay)}
            onMouseEnter={(e) => handleCellHover(e, cloneDay, matchingLeaves, matchingHoliday)}
            onMouseLeave={() => setTooltipInfo(null)}
          >
            <span className="date-number">{cloneDay.getDate()}</span>
            
            {/* Show leave indicators */}
            {matchingLeaves.length > 0 && (
              <div className="leave-indicators">
                {matchingLeaves.map((leave, index) => (
                  <div 
                    key={index} 
                    className="leave-dot"
                    style={{ backgroundColor: leave.color }}
                    title={leave.type}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Show holiday indicator */}
            {(matchingHoliday || isSunday) && (
              <div 
                className="holiday-indicator"
                style={{ backgroundColor: matchingHoliday ? matchingHoliday.color : '#05CD99' }}
                title={matchingHoliday ? matchingHoliday.name : 'Sunday - Weekend'}
              ></div>
            )}
            
            {/* Tasks list */}
            {dayTasks.length > 0 && (
              <div className="tasks-list">
                {dayTasks.slice(0, 2).map((task, index) => (
                  <div 
                    key={task.id} 
                    className={`task-item priority-${task.priority.toLowerCase()}`}
                    title={task.title}
                  >
                    {task.title.length > 15 ? task.title.substring(0, 15) + '...' : task.title}
                  </div>
                ))}
                {dayTasks.length > 2 && (
                  <div className="more-tasks">+{dayTasks.length - 2} more</div>
                )}
              </div>
            )}
            
            {/* Controls */}
            <div className="cell-controls">
              <button 
                className="add-note-btn"
                onClick={(e) => openNoteModal(cloneDay, e)}
                title="Add/Edit Note"
              >
                {hasNote ? '📝' : '✏️'}
              </button>
              {hasNote && <div className="note-indicator" title="Has note"></div>}
              
              <button 
                className="add-task-btn"
                onClick={(e) => openTaskModal(cloneDay, e)}
                title="Add Task"
              >
                ➕
              </button>
              {dayTasks.length > 0 && <div className="task-indicator" title={`${dayTasks.length} task(s)`}>{dayTasks.length}</div>}
            </div>
          </div>
        );
        
        day.setDate(day.getDate() + 1);
      }
      
      rows.push(
        <div className="calendar-row" key={day.toString()}>
          {days}
        </div>
      );
      days = [];
    }
    
    return <div className="calendar-body">{rows}</div>;
  };
  
  const renderLeaveModal = () => {
    if (!leaveModalOpen) return null;
    
    return (
      <div className="leave-modal-overlay">
        <div className="leave-modal">
          <div className="modal-header">
            <h2>Request Leave</h2>
            <button 
              className="close-modal"
              onClick={() => setLeaveModalOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Leave Type</label>
              <select 
                value={newLeaveRequest.type}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, type: e.target.value})}
              >
                <option value="Casual">Casual Leave</option>
                <option value="Sick">Sick Leave</option>
                <option value="Earned">Earned Leave</option>
              </select>
            </div>
            
            <div className="form-group">
              <label>Start Date</label>
              <input 
                type="date" 
                value={newLeaveRequest.startDate.toISOString().substr(0, 10)}
                onChange={(e) => setNewLeaveRequest({
                  ...newLeaveRequest, 
                  startDate: new Date(e.target.value)
                })}
              />
            </div>
            
            <div className="form-group">
              <label>End Date</label>
              <input 
                type="date" 
                value={newLeaveRequest.endDate.toISOString().substr(0, 10)}
                onChange={(e) => setNewLeaveRequest({
                  ...newLeaveRequest, 
                  endDate: new Date(e.target.value)
                })}
              />
            </div>
            
            <div className="form-group">
              <label>Reason</label>
              <textarea 
                value={newLeaveRequest.reason}
                onChange={(e) => setNewLeaveRequest({...newLeaveRequest, reason: e.target.value})}
                placeholder="Please provide a reason for your leave request"
              ></textarea>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => setLeaveModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="submit-btn"
              onClick={handleSubmitLeave}
            >
              Submit Request
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderNoteModal = () => {
    if (!noteModalOpen) return null;
    
    return (
      <div className="leave-modal-overlay">
        <div className="leave-modal note-modal">
          <div className="modal-header">
            <h2>
              {currentNote.date ? 
                `Note for ${currentNote.date.toLocaleDateString()}` : 
                'Add Note'}
            </h2>
            <button 
              className="close-modal"
              onClick={() => setNoteModalOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <textarea 
                value={currentNote.text}
                onChange={(e) => setCurrentNote({...currentNote, text: e.target.value})}
                placeholder="Add your note here..."
                className="note-textarea"
              ></textarea>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => setNoteModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="submit-btn"
              onClick={handleSaveNote}
            >
              Save Note
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTaskModal = () => {
    if (!taskModalOpen) return null;
    
    return (
      <div className="leave-modal-overlay">
        <div className="leave-modal task-modal">
          <div className="modal-header">
            <h2>
              {currentTask.date ? 
                `Add Task for ${currentTask.date.toLocaleDateString()}` : 
                'Add Task'}
            </h2>
            <button 
              className="close-modal"
              onClick={() => setTaskModalOpen(false)}
            >
              ×
            </button>
          </div>
          
          <div className="modal-body">
            <div className="form-group">
              <label>Task Title</label>
              <input 
                type="text"
                value={currentTask.title}
                onChange={(e) => setCurrentTask({...currentTask, title: e.target.value})}
                placeholder="Enter task title"
                className="task-title-input"
              />
            </div>
            
            <div className="form-group">
              <label>Description</label>
              <textarea 
                value={currentTask.description}
                onChange={(e) => setCurrentTask({...currentTask, description: e.target.value})}
                placeholder="Add task description..."
                className="task-description-textarea"
              ></textarea>
            </div>
            
            <div className="form-group">
              <label>Priority</label>
              <select
                value={currentTask.priority}
                onChange={(e) => setCurrentTask({...currentTask, priority: e.target.value})}
                className="task-priority-select"
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
          </div>
          
          <div className="modal-footer">
            <button 
              className="cancel-btn"
              onClick={() => setTaskModalOpen(false)}
            >
              Cancel
            </button>
            <button 
              className="submit-btn"
              onClick={handleSaveTask}
              disabled={!currentTask.title.trim()}
            >
              Add Task
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  const renderTooltip = () => {
    if (!tooltipInfo) return null;
    
    const { x, y, leaves, holiday, note, tasks } = tooltipInfo;
    
    return (
      <div 
        className="tooltip"
        style={{
          left: x + 10,
          top: y + 10
        }}
      >
        {holiday && (
          <div className="tooltip-holiday">
            <h4>{holiday.name}</h4>
            <p>{holiday.type === 'WEEKEND' ? 'Weekend' : holiday.type.charAt(0) + holiday.type.slice(1).toLowerCase() + ' Holiday'}</p>
          </div>
        )}
        
        {leaves.map((leave, index) => (
          <div key={index} className="tooltip-leave">
            <div className="tooltip-header">
              <span 
                className="leave-color-dot"
                style={{ backgroundColor: leave.color }}
              ></span>
              <h4>{leave.type} Leave</h4>
            </div>
            <p><strong>Status:</strong> <span className={`status-${leave.status.toLowerCase()}`}>{leave.status}</span></p>
            <p><strong>Dates:</strong> {leave.startDate.toLocaleDateString()} - {leave.endDate.toLocaleDateString()}</p>
            <p><strong>Reason:</strong> {leave.reason}</p>
          </div>
        ))}
        
        {note && (
          <div className="tooltip-note">
            <div className="tooltip-header">
              <span className="note-icon">📝</span>
              <h4>Note</h4>
            </div>
            <p>{note}</p>
          </div>
        )}
        
        {tasks && tasks.length > 0 && (
          <div className="tooltip-tasks">
            <div className="tooltip-header">
              <span className="tasks-icon">📋</span>
              <h4>Tasks ({tasks.length})</h4>
            </div>
            {tasks.map((task, index) => (
              <div key={task.id} className={`task-item-tooltip priority-${task.priority.toLowerCase()}`}>
                <p className="task-title"><strong>{task.title}</strong></p>
                {task.description && <p className="task-description">{task.description}</p>}
                <p className="task-priority">Priority: {task.priority}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  const onDateClick = (day) => {
    setSelectedDate(day);
  };
  
  const openNoteModal = (day, e) => {
    e.stopPropagation(); // Prevent triggering the cell click
    const dateStr = day.toISOString().split('T')[0];
    setCurrentNote({
      date: day,
      text: notes[dateStr] || ''
    });
    setNoteModalOpen(true);
  };
  
  const handleSaveNote = () => {
    if (currentNote.date) {
      const dateStr = currentNote.date.toISOString().split('T')[0];
      const updatedNotes = { ...notes };
      
      if (currentNote.text.trim() === '') {
        // If note is empty, remove it
        delete updatedNotes[dateStr];
      } else {
        // Otherwise save it
        updatedNotes[dateStr] = currentNote.text;
      }
      
      setNotes(updatedNotes);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('calendar_notes', JSON.stringify(updatedNotes));
      } catch (e) {
        console.error('Error saving notes to localStorage:', e);
      }
    }
    
    setNoteModalOpen(false);
  };
  
  const openTaskModal = (day, e) => {
    e.stopPropagation(); // Prevent triggering the cell click
    const dateStr = day.toISOString().split('T')[0];
    const existingTasks = tasks[dateStr] || [];
    
    setCurrentTask({
      date: day,
      title: '',
      description: '',
      priority: 'Medium'
    });
    
    setTaskModalOpen(true);
  };
  
  const handleSaveTask = () => {
    if (currentTask.date && currentTask.title.trim() !== '') {
      const dateStr = currentTask.date.toISOString().split('T')[0];
      const updatedTasks = { ...tasks };
      
      // Get existing tasks for this date or initialize empty array
      const dateTasks = updatedTasks[dateStr] || [];
      
      // Add new task
      dateTasks.push({
        id: Date.now(), // Use timestamp as unique ID
        title: currentTask.title,
        description: currentTask.description,
        priority: currentTask.priority,
        completed: false
      });
      
      // Update tasks for this date
      updatedTasks[dateStr] = dateTasks;
      
      setTasks(updatedTasks);
      
      // Save to localStorage for persistence
      try {
        localStorage.setItem('calendar_tasks', JSON.stringify(updatedTasks));
      } catch (e) {
        console.error('Error saving tasks to localStorage:', e);
      }
    }
    
    setTaskModalOpen(false);
  };
  
  const handleCellHover = (e, day, matchingLeaves, matchingHoliday) => {
    const isSunday = day.getDay() === 0;
    const dateStr = day.toISOString().split('T')[0];
    const noteText = notes[dateStr];
    const dayTasks = tasks[dateStr] || [];
    
    if (matchingLeaves.length > 0 || matchingHoliday || isSunday || noteText || dayTasks.length > 0) {
      // Create a Sunday holiday object if it's Sunday and there's no other holiday
      const holidayInfo = matchingHoliday || (isSunday ? {
        name: 'Sunday',
        date: day,
        type: 'WEEKEND',
        description: 'Weekend holiday',
        color: '#05CD99'
      } : null);
      
      setTooltipInfo({
        x: e.clientX,
        y: e.clientY,
        leaves: matchingLeaves,
        holiday: holidayInfo,
        note: noteText,
        tasks: dayTasks
      });
    }
  };
  
  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };
  
  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };
  
  const handleSubmitLeave = () => {
    // In a real app, you would send this to the server
    // For now, we'll just add it to the local state
    const newLeave = {
      id: leaves.length + 1,
      type: newLeaveRequest.type,
      status: 'Pending',
      reason: newLeaveRequest.reason,
      startDate: newLeaveRequest.startDate,
      endDate: newLeaveRequest.endDate,
      color: newLeaveRequest.type === 'Casual' ? '#4318FF' : 
              newLeaveRequest.type === 'Sick' ? '#FF5252' : '#FFB547'
    };
    
    setLeaves([...leaves, newLeave]);
    setLeaveModalOpen(false);
    setNewLeaveRequest({
      type: 'Casual',
      startDate: new Date(),
      endDate: new Date(),
      reason: ''
    });
  };
  
  const renderLeavesSummary = () => {
    return (
      <div className="leaves-summary">
        <h3>Leave Summary</h3>
        <div className="summary-grid">
          <div className="summary-item" style={{ borderColor: '#4318FF' }}>
            <h4>Casual Leave</h4>
            <div className="summary-details">
              <p>Used: {leaveBalance.Casual.used} days</p>
              <p>Available: {leaveBalance.Casual.total - leaveBalance.Casual.used} days</p>
            </div>
          </div>
          
          <div className="summary-item" style={{ borderColor: '#FF5252' }}>
            <h4>Sick Leave</h4>
            <div className="summary-details">
              <p>Used: {leaveBalance.Sick.used} days</p>
              <p>Available: {leaveBalance.Sick.total - leaveBalance.Sick.used} days</p>
            </div>
          </div>
          
          <div className="summary-item" style={{ borderColor: '#FFB547' }}>
            <h4>Earned Leave</h4>
            <div className="summary-details">
              <p>Used: {leaveBalance.Earned.used} days</p>
              <p>Available: {leaveBalance.Earned.total - leaveBalance.Earned.used} days</p>
            </div>
          </div>
          

        </div>
      </div>
    );
  };
  
  const renderUpcomingLeaves = () => {
    const today = new Date();
    const upcomingLeaves = leaves
      .filter(leave => leave.startDate >= today)
      .sort((a, b) => a.startDate - b.startDate)
      .slice(0, 3);
    
    const upcomingHolidays = holidays
      .filter(holiday => holiday.date >= today)
      .sort((a, b) => a.date - b.date)
      .slice(0, 3);
    
    return (
      <div className="upcoming-leaves">
        <h3>Upcoming Leaves & Holidays</h3>
        
        {upcomingLeaves.length > 0 && (
          <div className="upcoming-section">
            <h4>Your Leaves</h4>
            {upcomingLeaves.map((leave, index) => (
              <div key={index} className="upcoming-item">
                <div 
                  className="leave-type-indicator"
                  style={{ backgroundColor: leave.color }}
                ></div>
                <div className="upcoming-details">
                  <h5>{leave.type} Leave</h5>
                  <p>{leave.startDate.toLocaleDateString()} - {leave.endDate.toLocaleDateString()}</p>
                  <p className={`status-badge status-${leave.status.toLowerCase()}`}>{leave.status}</p>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {upcomingHolidays.length > 0 && (
          <div className="upcoming-section">
            <h4>Holidays</h4>
            {upcomingHolidays.map((holiday, index) => (
              <div key={index} className="upcoming-item">
                <div 
                  className="holiday-type-indicator"
                  style={{ backgroundColor: holiday.color }}
                ></div>
                <div className="upcoming-details">
                  <h5>{holiday.name}</h5>
                  <p>{holiday.date.toLocaleDateString()}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading calendar...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
        <button onClick={() => navigate('/login')}>Back to Login</button>
      </div>
    );
  }

  return (
    <div className="calendar-container">
      <div className="calendar-wrapper">
        <section className="calendar-section">
          {renderHeader()}
          {renderDays()}
          {renderCells()}
        </section>
        
        <div className="calendar-sidebar">
          {renderLeavesSummary()}
          {renderUpcomingLeaves()}
          
          <div className="legend">
            <h3>Categories</h3>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#4318FF' }}></div>
              <span>Casual Leave</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#FF5252' }}></div>
              <span>Sick Leave</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#FFB547' }}></div>
              <span>Earned Leave</span>
            </div>
            
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#05CD99' }}></div>
              <span>National Holiday</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#FF9800' }}></div>
              <span>Festival Holiday</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#3F51B5' }}></div>
              <span>Government Holiday</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#9C27B0' }}></div>
              <span>Company Holiday</span>
            </div>
            <div className="legend-item">
              <div className="legend-dot" style={{ backgroundColor: '#05CD99' }}></div>
              <span>Sunday</span>
            </div>
          </div>
        </div>
      </div>
      
      {renderLeaveModal()}
      {renderNoteModal()}
      {renderTaskModal()}
      {renderTooltip()}
    </div>
  );
};

export default Calendar;

