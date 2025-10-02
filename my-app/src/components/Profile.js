import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import './Profile.css';
import defaultAvatar from '../assets/avatar.png';
import Navbar from './Navbar';
import { API_URL } from '../utils/constants';

// No longer needed as the backend now provides a formatted employee ID

const Profile = () => {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Check if we're on the admin profile route
  const isAdminProfile = location.pathname === '/admin/profile';
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    department: '',
    position: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    bio: '',
    skills: '',
    dateOfBirth: '',
    joinDate: '',
    emergencyContact: '',
    employeeId: '',
    avatar: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [submitStatus, setSubmitStatus] = useState({
    message: '',
    isError: false,
    show: false
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Updated endpoint to match the backend
        const response = await fetch(`${API_URL}/user/profile`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch profile');
        }

        const data = await response.json();
        console.log("Profile data received:", data);
        console.log("Employee ID:", data.employeeId);
        setUser(data);
        setFormData({
          firstName: data.firstName || '',
          lastName: data.lastName || '',
          email: data.email || '',
          phone: data.phoneNumber || '', // Map from backend's phoneNumber field
          department: data.department || '',
          position: data.position || '',
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          country: data.country || '',
          bio: data.bio || '',
          skills: data.skills || '',
          dateOfBirth: data.dateOfBirth || '',
          joinDate: data.joinDate || '',
          emergencyContact: data.emergencyContact || '',
          employeeId: data.employeeId || 'Not assigned', // Use the employeeId from the backend
          avatar: null
        });
        setPreviewImage(data.avatar || defaultAvatar);
      } catch (error) {
        console.error('Error fetching profile:', error);
        showStatusMessage('Failed to load profile data', true);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        showStatusMessage('Image size should be less than 5MB', true);
        e.target.value = ''; // Reset the input
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif'];
      if (!allowedTypes.includes(file.type)) {
        showStatusMessage('Only JPG, PNG, and GIF images are allowed', true);
        e.target.value = ''; // Reset the input
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        avatar: file
      }));
      setPreviewImage(URL.createObjectURL(file));
    }
  };

  const showStatusMessage = (message, isError = false) => {
    setSubmitStatus({
      message,
      isError,
      show: true
    });
    
    // Hide message after 5 seconds
    setTimeout(() => {
      setSubmitStatus(prev => ({ ...prev, show: false }));
    }, 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      
      // Create a profile data object to send
      const profileData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        position: formData.position, // This is the role (admin/staff) - not editable by user
        phoneNumber: formData.phone, // Map to the correct field name in backend
        department: formData.department,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        bio: formData.bio,
        skills: formData.skills,
        dateOfBirth: formData.dateOfBirth,
        joinDate: formData.joinDate,
        emergencyContact: formData.emergencyContact
        // Note: We don't send employeeId back as it's just a formatted display of the user's ID
      };

      // Handle avatar separately if it's a file
      if (formData.avatar instanceof File) {
        // Convert file to base64 string
        const reader = new FileReader();
        reader.readAsDataURL(formData.avatar);
        reader.onloadend = async () => {
          const base64data = reader.result;
          
          // First update the profile data
          await updateProfileData(token, profileData);
          
          // Then update the avatar
          try {
            console.log("Uploading profile picture...");
            const avatarResponse = await fetch(`${API_URL}/user/profile/avatar`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: `avatar=${encodeURIComponent(base64data)}`
            });
            
            if (!avatarResponse.ok) {
              throw new Error('Failed to update profile picture');
            }
            
            const avatarData = await avatarResponse.json();
            setPreviewImage(avatarData.avatar);
            // Reset the avatar field in formData to allow future uploads
            setFormData(prev => ({
              ...prev,
              avatar: null
            }));
            showStatusMessage('Profile and picture updated successfully!');
          } catch (avatarError) {
            console.error('Error updating avatar:', avatarError);
            showStatusMessage('Profile updated but failed to update picture', true);
          }
        };
      } else {
        // Just update profile data without avatar
        await updateProfileData(token, profileData);
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      showStatusMessage(error.message || 'Failed to update profile', true);
    }
  };
  
  // Helper function to update profile data
  const updateProfileData = async (token, profileData) => {
    console.log("Updating profile data:", profileData);
    const response = await fetch(`${API_URL}/user/profile`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || 'Failed to update profile');
    }

    const updatedData = await response.json();
    setUser(updatedData);
    setIsEditing(false);
    showStatusMessage('Profile updated successfully!');

    // Update form data with new values
    setFormData({
      firstName: updatedData.firstName || '',
      lastName: updatedData.lastName || '',
      email: updatedData.email || '',
      phone: updatedData.phoneNumber || '', // Map from the correct field name in backend
      department: updatedData.department || '',
      position: updatedData.position || '',
      address: updatedData.address || '',
      city: updatedData.city || '',
      state: updatedData.state || '',
      zipCode: updatedData.zipCode || '',
      country: updatedData.country || '',
      bio: updatedData.bio || '',
      skills: updatedData.skills || '',
      dateOfBirth: updatedData.dateOfBirth || '',
      joinDate: updatedData.joinDate || '',
      emergencyContact: updatedData.emergencyContact || '',
      employeeId: updatedData.employeeId || '',
      avatar: null
    });
  };

  const handleCancel = () => {
    // Reset form data to current user data
    if (user) {
      setFormData({
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email || '',
        phone: user.phoneNumber || '', // Map from backend's phoneNumber field
        department: user.department || '',
        position: user.position || '',
        address: user.address || '',
        city: user.city || '',
        state: user.state || '',
        zipCode: user.zipCode || '',
        country: user.country || '',
        bio: user.bio || '',
        skills: user.skills || '',
        dateOfBirth: user.dateOfBirth || '',
        joinDate: user.joinDate || '',
        emergencyContact: user.emergencyContact || '',
        employeeId: user.employeeId || 'Not assigned', // Use the employeeId from the backend
        avatar: null
      });
      setPreviewImage(user.avatar || defaultAvatar);
    }
    setIsEditing(false);
  };

  if (loading) {
    return <div className="loading">Loading profile...</div>;
  }

  return (
    <div>
    {!isAdminProfile && <Navbar />}
    <div className="profile-container">
      {submitStatus.show && (
        <div className={`status-message ${submitStatus.isError ? 'error' : 'success'}`}>
          {submitStatus.message}
        </div>
      )}
      
      <div className="profile-header">
        <div className="profile-title">
          <h1>{isAdminProfile ? 'Admin Profile' : 'My Profile'}</h1>
          <button 
            className="back-button"
            onClick={() => navigate(isAdminProfile ? '/admindash' : '/dashboard')}
          >
            Back to {isAdminProfile ? 'Admin ' : ''}Dashboard
          </button>
        </div>
        <button 
          className={`edit-button ${isEditing ? 'cancel' : 'edit'}`}
          onClick={() => isEditing ? handleCancel() : setIsEditing(true)}
        >
          {isEditing ? 'Cancel' : 'Edit Profile'}
        </button>
      </div>

      <div className="profile-content">
        <div className="profile-image-section">
          <div className="profile-image-container">
            <img 
              src={previewImage} 
              alt="Profile" 
              className="profile-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = defaultAvatar;
              }}
            />
            {isEditing && (
              <div className="image-upload-overlay">
                <label htmlFor="avatar-upload" className="upload-button">
                  Change Photo
                </label>
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  onClick={(e) => e.target.value = null} // Reset the input on click
                  style={{ display: 'none' }}
                />
              </div>
            )}
          </div>
          <div className="employee-id">
            <span>Employee ID: {formData.employeeId || 'Not assigned'}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="profile-form">
          <div className="form-row">
            <div className="form-group">
              <label>First Name</label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your first name"
              />
            </div>

            <div className="form-group">
              <label>Last Name</label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your last name"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              disabled={true} // Email should not be editable
              placeholder="Your email address"
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Your phone number"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Department</label>
              <select
                name="department"
                value={formData.department}
                onChange={handleInputChange}
                disabled={!isEditing}
              >
                <option value="">Select Department</option>
                <option value="HR Department">HR Department</option>
                <option value="Tech Department">Tech Department</option>
                <option value="Finance Department">Finance Department</option>
                <option value="Marketing Department">Marketing Department</option>
              </select>
            </div>

            <div className="form-group">
              <label>Role</label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                disabled={true} // Always disabled - role cannot be changed
                placeholder="Your role"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Employee ID</label>
            <input
              type="text"
              name="employeeId"
              value={formData.employeeId}
              disabled={true} // Employee ID is always read-only
              placeholder="Your employee ID"
            />
          </div>

          <div className="form-group address">
            <label>Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Your address"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>City</label>
              <input
                type="text"
                name="city"
                value={formData.city}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your city"
              />
            </div>

            <div className="form-group">
              <label>State</label>
              <input
                type="text"
                name="state"
                value={formData.state}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your state"
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Zip Code</label>
              <input
                type="text"
                name="zipCode"
                value={formData.zipCode}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your zip code"
              />
            </div>

            <div className="form-group">
              <label>Country</label>
              <input
                type="text"
                name="country"
                value={formData.country}
                onChange={handleInputChange}
                disabled={!isEditing}
                placeholder="Your country"
              />
            </div>
          </div>

          <div className="form-group bio">
            <label>Bio</label>
            <textarea
              name="bio"
              value={formData.bio}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Tell us about yourself"
              rows="4"
            />
          </div>
          
          <div className="form-group">
            <label>Skills</label>
            <textarea
              name="skills"
              value={formData.skills}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Your skills (e.g., Java, React, Project Management)"
              rows="2"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Date of Birth</label>
              <input
                type="date"
                name="dateOfBirth"
                value={formData.dateOfBirth}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>

            <div className="form-group">
              <label>Join Date</label>
              <input
                type="date"
                name="joinDate"
                value={formData.joinDate}
                onChange={handleInputChange}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Emergency Contact</label>
            <input
              type="text"
              name="emergencyContact"
              value={formData.emergencyContact}
              onChange={handleInputChange}
              disabled={!isEditing}
              placeholder="Emergency contact information"
            />
          </div>

          {isEditing && (
            <div className="form-actions">
              <button type="submit" className="save-button">
                Save Changes
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
    </div>
  );
};

export default Profile;