# SE Lab Auth Portal

A full-stack authentication portal with Google OAuth and password reset functionality.

## Features

- User registration and login
- Google OAuth authentication
- Password reset via email
- Role-based access (Student, Faculty, Admin)
- Two-factor authentication for Admin users

## Setup

### Prerequisites

- Node.js
- MongoDB
- Google OAuth credentials
- Gmail account for email

### Backend Setup

1. Navigate to backend directory:
   ```
   cd backend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Create a `.env` file in backend directory with:
   ```
   MONGODB_URI=mongodb://localhost:27017/se-lab
   JWT_SECRET=your_jwt_secret_here
   SESSION_SECRET=your_session_secret_here
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   EMAIL_USER=your_gmail@gmail.com
   EMAIL_PASS=your_gmail_app_password
   FRONTEND_URL=http://localhost:3000
   ```

4. Start MongoDB service.

5. Start the backend:
   ```
   npm run dev
   ```

### Frontend Setup

1. Navigate to root directory:
   ```
   cd ..
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the frontend:
   ```
   npm start
   ```

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
6. Copy Client ID and Client Secret to `.env`

## Email Setup

1. Enable 2-factor authentication on Gmail
2. Generate an App Password
3. Use the App Password in EMAIL_PASS

## Usage

- Register/Login at http://localhost:3000
- Use "Sign in with Google" for OAuth
- Use "Forgot Password" to reset password via email
- Admin users will receive a 2FA code via email after entering credentials