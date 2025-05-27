import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import webSocketService from '../../services/WebSocketService';
import messageService from '../../services/MessageService';
import UserList from './UserList';
import ChatWindow from './ChatWindow';
import './Chat.css';

const Chat = () => {
  const [currentUser, setCurrentUser] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [connected, setConnected] = useState(false);
  const navigate = useNavigate();
  const chatComponentId = useRef(`chat-${Date.now()}`);

  // Fetch current user and all users
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    const fetchCurrentUser = async () => {
      try {
        // Try to get user profile from API
        let userData;
        try {
          const response = await axios.get('http://localhost:8080/api/user/profile', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          userData = response.data;
          setCurrentUser(userData);
        } catch (profileErr) {
          console.error('Error fetching user profile:', profileErr);
          
          // Use mock user data if API fails
          userData = {
            id: 'user-' + Date.now(),
            firstName: 'Demo',
            lastName: 'User',
            email: 'demo@example.com',
            position: 'Employee',
            department: 'Technology'
          };
          setCurrentUser(userData);
          setError('Using demo mode. Backend server may not be running.');
        }
        
        // Connect to WebSocket after getting current user
        webSocketService.connect(
          userData.id,
          () => {
            console.log('WebSocket connected');
            setConnected(true);
            setError(null); // Clear any previous errors
          },
          (err) => {
            console.error('WebSocket connection error:', err);
            setConnected(false);
            setError('Chat server connection failed. You can still browse users but messaging is unavailable.');
          }
        );

        // Register message handler
        webSocketService.registerMessageHandler(
          userData.id,
          chatComponentId.current,
          handleIncomingMessage
        );
      } catch (err) {
        console.error('Error in fetchCurrentUser:', err);
        setError('Failed to initialize chat. Please try again later.');
        setLoading(false);
      }
    };

    const fetchAllUsers = async () => {
      try {
        try {
          const response = await axios.get('http://localhost:8080/api/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          setUsers(response.data);
        } catch (usersErr) {
          console.error('Error fetching users:', usersErr);
          
          // Use mock users data if API fails
          const mockUsers = [
            {
              id: 'user-1',
              firstName: 'John',
              lastName: 'Doe',
              email: 'john.doe@example.com',
              position: 'Software Developer',
              department: 'Technology',
              avatar: 'https://via.placeholder.com/40'
            },
            {
              id: 'user-2',
              firstName: 'Jane',
              lastName: 'Smith',
              email: 'jane.smith@example.com',
              position: 'HR Manager',
              department: 'Human Resources',
              avatar: 'https://via.placeholder.com/40'
            },
            {
              id: 'user-3',
              firstName: 'Michael',
              lastName: 'Johnson',
              email: 'michael.johnson@example.com',
              position: 'Project Manager',
              department: 'Technology',
              avatar: 'https://via.placeholder.com/40'
            },
            {
              id: 'user-4',
              firstName: 'Emily',
              lastName: 'Davis',
              email: 'emily.davis@example.com',
              position: 'Marketing Specialist',
              department: 'Marketing',
              avatar: 'https://via.placeholder.com/40'
            }
          ];
          setUsers(mockUsers);
          
          // Set error message about demo mode
          setError(prev => prev || 'Using demo users. Backend server may not be running.');
        }
      } catch (err) {
        console.error('Error in fetchAllUsers:', err);
        setError(prev => prev || 'Failed to load users. Using demo mode.');
      } finally {
        setLoading(false);
      }
    };

    fetchCurrentUser();
    fetchAllUsers();

    // Cleanup function
    return () => {
      if (currentUser) {
        webSocketService.unregisterMessageHandler(currentUser.id, chatComponentId.current);
      }
    };
  }, [navigate]);

  // Handle incoming WebSocket messages
  const handleIncomingMessage = (message) => {
    console.log('Received message in Chat component:', message);
    
    setMessages(prevMessages => {
      // Check if this message is already in our list
      const messageExists = prevMessages.some(m => m.id === message.id);
      if (messageExists) {
        console.log('Message already exists in chat, skipping:', message.id);
        return prevMessages;
      }
      
      // Check if this message is relevant to the current chat
      const isRelevantToCurrentChat = 
        selectedUser && 
        ((message.from === currentUser?.id && message.to === selectedUser?.id) ||
         (message.from === selectedUser?.id && message.to === currentUser?.id));
      
      if (isRelevantToCurrentChat) {
        console.log('Message is relevant to current chat, adding to messages list');
        // Add the message and sort by timestamp
        return [...prevMessages, message].sort((a, b) => 
          new Date(a.timestamp) - new Date(b.timestamp)
        );
      } else {
        console.log('Message is not relevant to current chat, ignoring');
        // If we have a new message from someone else, we could show a notification here
        // For now, we'll just log it
        if (message.to === currentUser?.id) {
          console.log('New message received from:', message.from);
          // TODO: Show notification or update unread count
        }
      }
      
      return prevMessages;
    });
  };

  // Load messages when a user is selected
  useEffect(() => {
    if (currentUser && selectedUser) {
      console.log(`Loading messages between ${currentUser.id} and ${selectedUser.id}`);
      setLoading(true);
      
      // Try to get messages from API
      try {
        messageService.getMessagesBetweenUsers(currentUser.id, selectedUser.id)
          .then(response => {
            console.log('Messages loaded from API:', response.data);
            
            // Sort messages by timestamp
            const sortedMessages = [...response.data].sort((a, b) => 
              new Date(a.timestamp) - new Date(b.timestamp)
            );
            
            setMessages(sortedMessages);
            
            // Try to mark messages as read
            messageService.markMessagesAsRead(selectedUser.id, currentUser.id)
              .then(() => {
                console.log('Messages marked as read');
              })
              .catch(err => console.error('Error marking messages as read:', err));
          })
          .catch(err => {
            console.error('Error fetching messages:', err);
            
            // Use mock messages if API fails
            const now = new Date();
            const mockMessages = [
              {
                id: 'msg-1',
                from: selectedUser.id,
                to: currentUser.id,
                content: 'Hello! How are you doing today?',
                timestamp: new Date(now.getTime() - 60 * 60000).toISOString(),
                read: true
              },
              {
                id: 'msg-2',
                from: currentUser.id,
                to: selectedUser.id,
                content: 'I\'m doing well, thanks for asking! How about you?',
                timestamp: new Date(now.getTime() - 55 * 60000).toISOString(),
                read: true
              },
              {
                id: 'msg-3',
                from: selectedUser.id,
                to: currentUser.id,
                content: 'I\'m good too. Just wanted to check in about the project status.',
                timestamp: new Date(now.getTime() - 50 * 60000).toISOString(),
                read: true
              }
            ];
            
            setMessages(mockMessages);
            console.log('Using mock messages due to API error');
          })
          .finally(() => {
            setLoading(false);
          });
      } catch (err) {
        console.error('Error in message loading effect:', err);
        setLoading(false);
        // Don't set error here to avoid overriding connection errors
      }
    }
  }, [currentUser, selectedUser]);

  // Handle user selection
  const handleUserSelect = (user) => {
    console.log('User selected:', user);
    // Clear messages when changing users
    setMessages([]);
    setLoading(true);
    setSelectedUser(user);
  };

  // Handle sending a message
  const handleSendMessage = (content) => {
    if (!currentUser || !selectedUser || !content.trim()) {
      return;
    }

    const message = {
      id: 'msg-' + Date.now(), // Generate a temporary ID
      from: currentUser.id,
      to: selectedUser.id,
      content: content,
      timestamp: new Date().toISOString(),
      read: false
    };

    // Add message to local state immediately for better UX
    setMessages(prevMessages => [...prevMessages, message]);

    // Try to send via WebSocket
    if (connected) {
      webSocketService.sendMessage(message);
    } else {
      // Show error if WebSocket is not connected
      console.error('Cannot send message: WebSocket not connected');
      setError('Message sending is currently unavailable. Please try again later.');
      
      // Clear error after 3 seconds
      setTimeout(() => {
        setError(prev => prev === 'Message sending is currently unavailable. Please try again later.' ? null : prev);
      }, 3000);
    }
  };

  // Disconnect WebSocket on component unmount
  useEffect(() => {
    return () => {
      webSocketService.disconnect();
    };
  }, []);

  if (loading && !currentUser) {
    return <div className="loading-container">Loading...</div>;
  }
  
  // Only show full-screen error for critical issues
  if (error && error.includes("Failed to initialize chat")) {
    return <div className="error-container">{error}</div>;
  }

  return (
    <div className="chat-container">
      <div className="chat-sidebar">
        <div className="chat-header">
          <h2>Messages</h2>
          {!connected && <div className="connection-status">Offline Mode</div>}
        </div>
        <UserList 
          users={users.filter(user => user.id !== (currentUser?.id || ''))} 
          selectedUser={selectedUser}
          onSelectUser={handleUserSelect}
          currentUser={currentUser}
        />
      </div>
      <div className="chat-main">
        {error && (
          <div className="error-banner">
            {error}
          </div>
        )}
        {selectedUser ? (
          <ChatWindow 
            currentUser={currentUser}
            selectedUser={selectedUser}
            messages={messages}
            onSendMessage={handleSendMessage}
            loading={loading}
            connected={connected}
          />
        ) : (
          <div className="no-chat-selected">
            <p>Select a user to start chatting</p>
            {!connected && (
              <div className="offline-notice">
                <p>You are currently in offline mode. Messaging functionality is limited.</p>
                <p>The backend server may not be running.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;