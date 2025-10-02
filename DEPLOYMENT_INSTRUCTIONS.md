# Deployment Instructions for Fly.io

## Prerequisites
- You have a Fly.io account.
- You have installed the Fly CLI (`flyctl`). If not, install it using:
  ```
  powershell -Command "Invoke-WebRequest -Uri 'https://fly.io/install.ps1' -OutFile 'install.ps1'; .\\install.ps1"
  ```
- Choose app names for backend and frontend (e.g., `hr-backend` and `hr-frontend`).
- Update the placeholder URLs in the code files with your actual app names.

## Update Code with App Names

Before deploying, replace `your-backend-app-name` and `your-frontend-app-name` in the following files with your chosen app names:

1. `my-app/src/utils/api.js`: Update `baseURL`
2. `my-app/src/utils/fetchApi.js`: Update `API_BASE_URL`
3. `my-app/src/services/WebSocketService.js`: Update `webSocketFactory`
4. `Backend/src/main/resources/application.properties`: Update `spring.web.cors.allowed-origins`
5. `Backend/fly.toml`: Update `app` name
6. `my-app/fly.toml`: Update `app` name

For example, if your backend app is `hr-backend` and frontend is `hr-frontend`:
- Change `https://your-backend-app-name.fly.dev/api` to `https://hr-backend.fly.dev/api`
- Change `https://your-frontend-app-name.fly.dev` to `https://hr-frontend.fly.dev`

## Backend Deployment

1. Navigate to the Backend directory:
   ```
   cd Backend
   ```

2. Build the Docker image locally (optional):
   ```
   docker build -t backend-app .
   ```

3. Login to Fly.io:
   ```
   flyctl auth login
   ```

4. Create a new Fly app for backend (replace `your-backend-app-name` with your desired app name):
   ```
   flyctl apps create your-backend-app-name
   ```

5. Set environment variables for MongoDB URI and JWT secret:
   ```
   flyctl secrets set SPRING_DATA_MONGODB_URI="your-mongodb-uri"
   flyctl secrets set JWT_SECRET="your-jwt-secret"
   ```

6. Deploy the backend app:
   ```
   flyctl deploy
   ```

7. The backend will be available at `https://your-backend-app-name.fly.dev`

## Frontend Deployment

1. Navigate to the frontend directory:
   ```
   cd my-app
   ```

2. Build the React app:
   ```
   npm install
   npm run build
   ```

3. Build the Docker image locally (optional):
   ```
   docker build -t frontend-app .
   ```

4. Create a new Fly app for frontend (replace `your-frontend-app-name` with your desired app name):
   ```
   flyctl apps create your-frontend-app-name
   ```

5. Deploy the frontend app:
   ```
   flyctl deploy
   ```

6. The frontend will be available at `https://your-frontend-app-name.fly.dev`

## Notes

- Update your frontend API base URLs and WebSocket URLs to point to the backend Fly app URL.
- You may want to configure custom domains and HTTPS certificates via Fly.io dashboard.
- For persistent storage (e.g., file uploads), configure Fly volumes and mount them in the backend container.
- Monitor logs and scale your apps using Fly.io commands.

## Useful Fly.io Commands

- View logs:
  ```
  flyctl logs -a your-app-name
  ```

- Scale instances:
  ```
  flyctl scale count 2 -a your-app-name
  ```

- SSH into a running instance:
  ```
  flyctl ssh console -a your-app-name
