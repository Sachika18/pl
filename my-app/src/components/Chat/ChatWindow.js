import React, { useState, useRef, useEffect } from 'react';

const ChatWindow = ({ currentUser, selectedUser, messages, onSendMessage, loading, connected = true }) => {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Function to get user's full name
  const getUserFullName = (user) => {
    return `${user.firstName} ${user.lastName}`;
  };

  // Function to get user's avatar or default
  const getUserAvatar = (user) => {
    return user.avatar || 'https://via.placeholder.com/40';
  };

  // Format timestamp to readable time
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format timestamp to date if it's a different day
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
    }
  };

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Group messages by date
  const groupMessagesByDate = () => {
    const groups = [];
    let currentDate = null;
    let currentGroup = [];
    
    messages.forEach(message => {
      const messageDate = formatDate(message.timestamp);
      
      if (messageDate !== currentDate) {
        if (currentGroup.length > 0) {
          groups.push({
            date: currentDate,
            messages: currentGroup
          });
        }
        currentDate = messageDate;
        currentGroup = [message];
      } else {
        currentGroup.push(message);
      }
    });
    
    if (currentGroup.length > 0) {
      groups.push({
        date: currentDate,
        messages: currentGroup
      });
    }
    
    return groups;
  };

  const messageGroups = groupMessagesByDate();

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="user-avatar">
          <img src={getUserAvatar(selectedUser)} alt={getUserFullName(selectedUser)} />
          <div className="user-status online"></div>
        </div>
        <div className="user-info">
          <div className="user-name">{getUserFullName(selectedUser)}</div>
          <div className="user-position">{selectedUser.position || 'Employee'}</div>
        </div>
      </div>
      
      <div className="chat-messages">
        {loading ? (
          <div className="loading-messages">Loading messages...</div>
        ) : (
          messageGroups.length === 0 ? (
            <div className="no-messages">
              <p>No messages yet. Start the conversation!</p>
            </div>
          ) : (
            messageGroups.map((group, groupIndex) => (
              <div key={groupIndex} className="message-group">
                <div className="date-separator">
                  <span>{group.date}</span>
                </div>
                {group.messages.map((message, index) => {
                  const isCurrentUser = message.from === currentUser.id;
                  return (
                    <div 
                      key={message.id || index} 
                      className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                    >
                      {!isCurrentUser && (
                        <div className="message-avatar">
                          <img src={getUserAvatar(selectedUser)} alt={getUserFullName(selectedUser)} />
                        </div>
                      )}
                      <div className="message-content">
                        <div className="message-bubble">
                          {message.content}
                        </div>
                        <div className="message-time">
                          {formatTime(message.timestamp)}
                          {isCurrentUser && (
                            <span className={`message-status ${message.read ? 'read' : 'sent'}`}>
                              {message.read ? '✓✓' : '✓'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form className="chat-input" onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder={connected ? "Type a message..." : "Messaging unavailable (offline mode)"}
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          disabled={loading || !connected}
        />
        <button type="submit" disabled={!newMessage.trim() || loading || !connected}>
          Send
        </button>
        {!connected && (
          <div className="offline-message">
            Server connection unavailable
          </div>
        )}
      </form>
    </div>
  );
};

export default ChatWindow;