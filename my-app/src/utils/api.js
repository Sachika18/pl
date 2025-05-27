import axios from 'axios';

// Create an axios instance with default config
const api = axios.create({
  baseURL: '/api', // Use the proxy configuration from package.json
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  }
});

// Add a request interceptor to add the auth token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // CORS headers should be set on the server side, not in the client
    // Removing these headers as they can cause issues with requests
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add a response interceptor to handle common errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    console.error('API Error:', error);
    
    // Handle common errors here (e.g., 401 Unauthorized, 403 Forbidden)
    if (error.response) {
      console.error('Error response:', error.response);
      console.error('Error status:', error.response.status);
      console.error('Error data:', error.response.data);
      
      // Handle authentication errors
      if (error.response.status === 401 || error.response.status === 403) {
        // Redirect to login page or refresh token
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        // Only redirect if we're not already on the login page
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }
      
      // For 500 errors, provide more context
      if (error.response.status === 500) {
        console.error('Server error occurred. This might be due to a database connection issue or an unhandled exception on the server.');
        // You could implement retry logic here if needed
      }
    } else if (error.request) {
      console.error('Error request:', error.request);
      console.error('No response received from server. This might be due to network issues or the server being down.');
    } else {
      console.error('Error message:', error.message);
    }
    
    return Promise.reject(error);
  }
);

export default api;