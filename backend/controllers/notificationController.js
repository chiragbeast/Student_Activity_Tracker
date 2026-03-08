const asyncHandler = require('express-async-handler');
const Notification = require('../models/Notification');
const SystemConfig = require('../models/SystemConfig');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id })
        .sort({ createdAt: -1 });
    res.status(200).json(notifications);
});

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findOneAndUpdate(
        { _id: req.params.id, recipient: req.user._id },
        { isRead: true },
        { new: true }
    );

    if (!notification) {
        res.status(404);
        throw new Error('Notification not found or unauthorized');
    }

    res.status(200).json(notification);
});

// @desc    Get system guidelines and rules
// @route   GET /api/system/guidelines
// @access  Private
const getSystemGuidelines = asyncHandler(async (req, res) => {
    const config = await SystemConfig.findOne();
    if (!config) {
        res.status(404);
        throw new Error('System configuration not found');
    }

    res.status(200).json({
        guidelinesUrl: config.guidelinesUrl,
        pointsConfig: config.pointsConfig,
        currentAcademicYear: config.currentAcademicYear,
        currentSemester: config.currentSemester
    });
});

module.exports = {
    getNotifications,
    markAsRead,
    getSystemGuidelines
};
