const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const express = require('express');
const http = require('http'); // [NEW] Import http
const cors = require('cors');
const connectDB = require('./config/db');
const { errorHandler, notFound } = require('./middleware/errorMiddleware');
const socketUtils = require('./utils/socket'); // [NEW] Import socketUtils

// Connect Database
connectDB();

const app = express();
const server = http.createServer(app); // [NEW] Create HTTP server

// Initialize Socket.io
socketUtils.init(server); // [NEW] Initialize socket.io with the server

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Default Route
app.get('/', (req, res) => {
    res.send('Student Activity Tracker API is running...');
});

// Define Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/faculty', require('./routes/facultyRoutes'));
app.use('/api/student', require('./routes/studentRoutes'));
app.use('/api/submissions', require('./routes/submissionRoutes'));
app.use('/api/deadlines', require('./routes/deadlineRoutes'));
app.use('/api/brochure', require('./routes/brochureRoutes'));
app.use('/api', require('./routes/notificationRoutes'));

// Error Handling Middleware
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// [CHANGED] Listen on server instead of app
server.listen(PORT, () => {
    console.log(`Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
});
