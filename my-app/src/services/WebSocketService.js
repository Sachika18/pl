import SockJS from 'sockjs-client';
import { Client } from '@stomp/stompjs';

class WebSocketService {
  constructor() {
    this.stompClient = null;
    this.isConnected = false;
    this.subscriptions = new Map();
    this.messageHandlers = new Map();
  }

  connect(userId, onConnected, onError) {
    try {
      // Check if backend is available (optional)
      console.log('Attempting to connect to WebSocket server...');
      
      this.stompClient = new Client({
        webSocketFactory: () => new SockJS(process.env.REACT_APP_WS_BASE_URL || 'https://your-backend-app-name.fly.dev/ws'),
        debug: function (str) {
          // Disable debug logs
          // console.log(str);
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
        onConnect: () => {
          console.log('WebSocket connection established successfully');
          this.isConnected = true;
          
          // Subscribe to user's personal topic for direct messages
          this.subscribe(`/topic/messages/${userId}`, (message) => {
            console.log(`Received message on personal topic: ${message.body}`);
            const receivedMessage = JSON.parse(message.body);
            
            // Notify all registered handlers
            if (this.messageHandlers.has(userId)) {
              this.messageHandlers.get(userId).forEach(handler => {
                handler(receivedMessage);
              });
            }
          });
          
          // Also subscribe to the global messages topic
          this.subscribe('/topic/messages', (message) => {
            console.log(`Received message on global topic: ${message.body}`);
            const receivedMessage = JSON.parse(message.body);
            
            // Only process messages that are relevant to this user
            if (receivedMessage.to === userId || receivedMessage.from === userId) {
              // Notify all registered handlers
              if (this.messageHandlers.has(userId)) {
                this.messageHandlers.get(userId).forEach(handler => {
                  handler(receivedMessage);
                });
              }
            }
          });
          
          if (onConnected) {
            onConnected();
          }
        },
        onStompError: (error) => {
          console.error('STOMP protocol error:', error);
          this.isConnected = false;
          if (onError) {
            onError(error);
          }
        },
        onWebSocketError: (event) => {
          console.error('WebSocket connection error:', event);
          this.isConnected = false;
          if (onError) {
            onError(new Error('Failed to connect to chat server. Backend may not be running.'));
          }
        },
        onWebSocketClose: (event) => {
          console.log('WebSocket connection closed:', event);
          this.isConnected = false;
        }
      });
      
      // Activate the client
      this.stompClient.activate();
    } catch (error) {
      console.error('Error initializing WebSocket connection:', error);
      this.isConnected = false;
      if (onError) {
        onError(error);
      }
    }
  }

  disconnect() {
    if (this.stompClient) {
      // Unsubscribe from all topics
      this.subscriptions.forEach((subscription) => {
        subscription.unsubscribe();
      });
      
      this.stompClient.deactivate();
      this.isConnected = false;
      this.subscriptions.clear();
      this.messageHandlers.clear();
    }
  }

  subscribe(topic, callback) {
    if (this.stompClient && this.stompClient.connected) {
      const subscription = this.stompClient.subscribe(topic, callback);
      this.subscriptions.set(topic, subscription);
      return subscription;
    }
    return null;
  }

  unsubscribe(topic) {
    if (this.subscriptions.has(topic)) {
      this.subscriptions.get(topic).unsubscribe();
      this.subscriptions.delete(topic);
    }
  }

  sendMessage(message) {
    if (this.stompClient && this.stompClient.connected) {
      console.log('Sending message via WebSocket:', message);
      
      // Send to the application destination for server processing
      this.stompClient.publish({
        destination: '/app/chat',
        body: JSON.stringify(message)
      });
      
      // Also publish directly to the global topic for immediate delivery
      // This helps ensure the message appears in the sender's UI right away
      this.stompClient.publish({
        destination: '/topic/messages',
        body: JSON.stringify(message)
      });
    } else {
      console.error('Cannot send message: WebSocket not connected');
    }
  }

  registerMessageHandler(userId, handlerId, handler) {
    if (!this.messageHandlers.has(userId)) {
      this.messageHandlers.set(userId, new Map());
    }
    this.messageHandlers.get(userId).set(handlerId, handler);
  }

  unregisterMessageHandler(userId, handlerId) {
    if (this.messageHandlers.has(userId)) {
      this.messageHandlers.get(userId).delete(handlerId);
    }
  }
}

// Create a singleton instance
const webSocketService = new WebSocketService();
export default webSocketService;