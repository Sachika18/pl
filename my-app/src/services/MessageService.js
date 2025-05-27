import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

class MessageService {
  // Get messages between two users
  getMessagesBetweenUsers(user1Id, user2Id) {
    return axios.get(`${API_URL}/messages/${user1Id}/${user2Id}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // Mark messages as read
  markMessagesAsRead(fromUserId, toUserId) {
    return axios.put(`${API_URL}/messages/read/${fromUserId}/${toUserId}`, {}, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }

  // Get unread messages for a user
  getUnreadMessages(userId) {
    return axios.get(`${API_URL}/messages/unread/${userId}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
  }
}

export default new MessageService();