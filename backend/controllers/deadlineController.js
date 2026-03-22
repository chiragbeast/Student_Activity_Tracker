const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');
const Notification = require('../models/Notification');
const User = require('../models/User');

// @desc    Create a new deadline and notify students
// @route   POST /api/deadlines
// @access  Private/Faculty
const createDeadline = asyncHandler(async (req, res) => {
    const { title, description, assignedStudents } = req.body;

    if (!title || !description) {
        res.status(400);
        throw new Error('Title and description are required');
    }

    const deadline = await Deadline.create({
        title,
        description,
        assignedStudents: assignedStudents || [],
        createdBy: req.user._id,
        date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days from now
        category: 'General'
    });

    // Send notifications to each assigned student
    if (assignedStudents && assignedStudents.length > 0) {
        const notifications = assignedStudents.map(studentId => ({
            user: studentId,
            type: 'deadline_approaching',
            title: 'New Deadline Assigned',
            message: `A new deadline has been set: ${description}`,
        }));
        await Notification.insertMany(notifications);
    }

    res.status(201).json({
        success: true,
        data: deadline
    });
});

// @desc    Get all deadlines created by the logged-in faculty
// @route   GET /api/deadlines
// @access  Private/Faculty
const getDeadlines = asyncHandler(async (req, res) => {
    const deadlines = await Deadline.find({ createdBy: req.user._id })
        .populate('assignedStudents', 'name rollNumber')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: deadlines
    });
});

// @desc    Delete a deadline
// @route   DELETE /api/deadlines/:id
// @access  Private/Faculty
const deleteDeadline = asyncHandler(async (req, res) => {
    const deadline = await Deadline.findById(req.params.id);

    if (!deadline) {
        res.status(404);
        throw new Error('Deadline not found');
    }

    // Verify ownership
    if (deadline.createdBy.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to delete this deadline');
    }

    await deadline.deleteOne();

    res.json({
        success: true,
        message: 'Deadline removed'
    });
});

module.exports = {
    createDeadline,
    getDeadlines,
    deleteDeadline
};
