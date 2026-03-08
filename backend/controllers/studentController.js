const asyncHandler = require('express-async-handler');
const ActivityPoints = require('../models/ActivityPoints');
const Submission = require('../models/Submission');
const Deadline = require('../models/Deadline');
const User = require('../models/User');

// @desc    Get student dashboard data (points, recent submissions, deadlines)
// @route   GET /api/student/dashboard
// @access  Private/Student
const getDashboard = asyncHandler(async (req, res) => {
    const studentId = req.user._id;

    // Fetch activity points
    let points = await ActivityPoints.findOne({ student: studentId });
    if (!points) {
        // Create an empty points record if none exists yet
        points = await ActivityPoints.create({ student: studentId });
    }

    // Fetch 5 most recent submissions
    const recentSubmissions = await Submission.find({ student: studentId })
        .sort({ createdAt: -1 })
        .limit(5);

    // Fetch active deadlines relevant to the student
    const currentDate = new Date();
    const activeDeadlines = await Deadline.find({
        isActive: true,
        date: { $gte: currentDate },
        visibleToRoles: 'Student',
        $or: [
            { department: req.user.department },
            { department: null }
        ]
    }).sort({ date: 1 }).limit(5);

    res.status(200).json({
        points,
        recentSubmissions,
        activeDeadlines
    });
});

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
const getProfile = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate('facultyAdvisor', 'name email department phone');

    if (user) {
        res.status(200).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            rollNumber: user.rollNumber,
            department: user.department,
            profilePicture: user.profilePicture,
            phone: user.phone,
            facultyAdvisor: user.facultyAdvisor,
            notificationsEnabled: user.notificationsEnabled,
            emailNotifications: user.emailNotifications,
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

module.exports = {
    getDashboard,
    getProfile,
};
