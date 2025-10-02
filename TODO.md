# Deployment Plan for Hosting on Fly.io

## Backend Deployment
- [x] Create Dockerfile for Backend (Spring Boot app)
- [x] Configure fly.toml for Backend
- [x] Test Docker build for Backend
- [ ] Deploy Backend to Fly.io
- [ ] Set environment variables (MongoDB URI, JWT secret, etc.)
- [ ] Update CORS configuration for Frontend URL

## Frontend Deployment
- [x] Update API base URLs in frontend code (api.js, fetchApi.js, WebSocketService.js)
- [x] Create Dockerfile for Frontend (React app)
- [x] Configure fly.toml for Frontend
- [x] Test npm build and Docker build for Frontend
- [ ] Deploy Frontend to Fly.io

## Post-Deployment
- [ ] Test the deployed applications
- [ ] Configure domain (optional)
- [ ] Set up monitoring and scaling
