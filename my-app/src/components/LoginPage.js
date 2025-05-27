// src/components/LoginPage.js
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from 'axios';
import "./LoginPage.css";
import illustration from "../assets/illustration.png";

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    const API_URL = 'http://localhost:8080/api/auth/login';
    
    try {
      console.log('Attempting to login with:', formData);
      
      // Test if the server is reachable first with OPTIONS request
      try {
        const testResponse = await fetch(API_URL, { 
          method: 'OPTIONS',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
          }
        });
        console.log('Server test response:', testResponse);
      } catch (connectionError) {
        console.error('Server connection test failed:', connectionError);
        throw new Error('Cannot connect to the server. Please make sure the backend is running.');
      }
      
      // Proceed with actual login
      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(formData),
      });
      
      console.log('Login response status:', response.status);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Login failed. Please check your credentials.');
      }
      
      const data = await response.json();
      console.log('Login response data:', data);
      
      // Store the JWT token and user details in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify({
        id: data.id,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        position: data.position
      }));
      
      // Redirect based on role
if (data.position === 'Admin') {
  navigate('/admindash');
} else if (data.position === 'Staff') {
  navigate('/dashboard');
} else {
  navigate('/');
}

    } catch (err) {
      console.error('Login error details:', {
        message: err.message,
        name: err.name,
        stack: err.stack
      });
      setError(err.message || 'Login failed. Please check your credentials.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-left">
        <div className="login-box">
          <h1 className="welcome-title">Welcome Back!</h1>
          <p className="welcome-text">
            Simplify your workflow and boost your productivity with <strong>WorkLine</strong>.
          </p>

          <form onSubmit={handleLogin} className="login-form">
            {error && <div className="error-message">{error}</div>}

            <div className="form-group">
              <input
                type="email"
                name="email"
                className="login-input"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <input
                type="password"
                name="password"
                className="login-input"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            <div className="forgot-link">
              <Link to="/forgot-password">Forgot Password?</Link>
            </div>

            <button type="submit" className="button">
              Login
              <svg className="icon" viewBox="0 0 24 24" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zm4.28 10.28a.75.75 0 000-1.06l-3-3a.75.75 0 10-1.06 1.06l1.72 1.72H8.25a.75.75 0 000 1.5h5.69l-1.72 1.72a.75.75 0 101.06 1.06l3-3z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </form>

          

          <p className="register-text">
            Not a member? <Link to="/signup">Register now</Link>
          </p>
        </div>
      </div>

      <div className="login-right">
        <div className="illustration-box">
          <img src={illustration} alt="Illustration" className="illustration-img" />
          <p className="illustration-text">
            Make your work easier and organized with <strong>WorkLine</strong>.
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;