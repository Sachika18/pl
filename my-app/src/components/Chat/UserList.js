import React from 'react';

const UserList = ({ users, selectedUser, onSelectUser, currentUser }) => {
  // Function to get user's full name
  const getUserFullName = (user) => {
    return `${user.firstName} ${user.lastName}`;
  };

  // Function to get user's avatar or default
  const getUserAvatar = (user) => {
    return user.avatar || 'https://via.placeholder.com/40';
  };

  return (
    <div className="user-list">
      {users.length === 0 ? (
        <div className="no-users">No users available</div>
      ) : (
        users.map(user => (
          <div 
            key={user.id} 
            className={`user-item ${selectedUser && selectedUser.id === user.id ? 'selected' : ''}`}
            onClick={() => onSelectUser(user)}
          >
            <div className="user-avatar">
              <img src={getUserAvatar(user)} alt={getUserFullName(user)} />
              <div className="user-status online"></div>
            </div>
            <div className="user-info">
              <div className="user-name">{getUserFullName(user)}</div>
              <div className="user-position">{user.position || 'Employee'}</div>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default UserList;