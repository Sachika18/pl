# Deployment Instructions for Render

## Prerequisites
- You have a Render account (sign up at https://render.com).
- Your project is pushed to a GitHub repository (e.g., https://github.com/Sachika18/Worklineapp.git).
- Choose service names for backend and frontend (e.g., `hr-backend` and `hr-frontend`).
- Update the placeholder URLs in the code files with your actual service names after deployment.

## Update Code with Service Names

After deploying the backend, update the following files with the actual Render backend URL (e.g., `https://hr-backend.onrender.com`):

1. `my-app/src/utils/api.js`: Update `baseURL` to `https://your-backend-service-name.onrender.com/api`
2. `my-app/src/utils/fetchApi.js`: Update `API_BASE_URL` to `https://your-backend-service-name.onrender.com/api`
3. `my-app/src/services/WebSocketService.js`: Update `webSocketFactory` to `new SockJS('https://your-backend-service-name.onrender.com/ws')`
4. `Backend/src/main/resources/application.properties`: Update `spring.web.cors.allowed-origins` to include `https://your-frontend-service-name.onrender.com`

Commit and push these changes to GitHub before redeploying the frontend.

## Backend Deployment (Web Service)

1. Go to the Render Dashboard (https://dashboard.render.com).
2. Click "New" and select "Web Service".
3. Connect your GitHub repository (authorize Render if needed).
4. Select the repository and branch (e.g., master).
5. Configure the service:
   - **Name**: Choose a name (e.g., `hr-backend`).
   - **Environment**: Docker.
   - **Dockerfile Path**: `Backend/Dockerfile` (relative to repo root).
   - **Branch**: master (or your main branch).
6. Set environment variables:
   - `SPRING_DATA_MONGODB_URI`: Your MongoDB connection string.
   - `JWT_SECRET`: Your JWT secret key.
   - `PORT`: 8080 (Render sets this automatically, but ensure it's 8080).
7. Click "Create Web Service".
8. The backend will build and deploy. It will be available at `https://your-service-name.onrender.com`.

## Frontend Deployment (Static Site)

1. In the Render Dashboard, click "New" and select "Static Site".
2. Connect your GitHub repository (if not already connected).
3. Select the repository and branch.
4. Configure the static site:
   - **Name**: Choose a name (e.g., `hr-frontend`).
   - **Branch**: master (or your main branch).
   - **Build Command**: `npm run build`
   - **Publish Directory**: `my-app/build`
   - **Root Directory**: `my-app` (if the package.json is in my-app, otherwise leave blank if in root).
5. Click "Create Static Site".
6. The frontend will build and deploy. It will be available at `https://your-service-name.onrender.com`.

## Notes

- Render provides free tiers for both web services and static sites.
- Update your frontend code with the backend URL after backend deployment, then redeploy the frontend.
- For persistent storage (e.g., file uploads), Render doesn't support persistent volumes on free tier; consider using cloud storage like AWS S3.
- Monitor logs and manage services via the Render dashboard.
- WebSocket connections should work with Render's web services.

## Useful Render Features

- View logs: Go to your service in the dashboard and click "Logs".
- Environment variables: Edit in the service settings.
- Custom domains: Configure in the service settings.
- Scaling: Upgrade to paid plans for more resources.
