const asyncHandler = require('express-async-handler');
const Deadline = require('../models/Deadline');
const Notification = require('../models/Notification');
const User = require('../models/User');
const { sendEmail } = require('../utils/mailer');

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
            sender: req.user.name,
            senderRole: 'Faculty',
        }));
        await Notification.insertMany(notifications);

        // Fetch students to send email notifications
        const students = await User.find({ _id: { $in: assignedStudents } });

        for (const student of students) {
            if (student.emailNotifications) {
                const html = `
                <div style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;line-height:1.6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 10px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                                    <tr>
                                        <td style="padding:30px 40px;background-color:#ef4444;color:#ffffff;">
                                            <h1 style="margin:0;font-size:24px;font-weight:700;">New Deadline Assigned</h1>
                                            <p style="margin:8px 0 0 0;font-size:16px;opacity:0.9;">Student Activity Points Tracker</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:40px;">
                                            <p style="margin:0 0 20px 0;font-size:16px;">Dear ${student.name},</p>
                                            <p style="margin:0 0 25px 0;font-size:16px;">A new deadline has been assigned to you by your faculty. Please ensure you complete the required activities before the due date.</p>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#fef2f2;border-radius:8px;padding:20px;margin-bottom:30px;border:1px solid #fee2e2;">
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;width:140px;color:#991b1b;">Title:</td>
                                                    <td style="padding-bottom:12px;">${title}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;color:#991b1b;">Description:</td>
                                                    <td style="padding-bottom:12px;">${description}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight:600;color:#991b1b;">Assigned By:</td>
                                                    <td>${req.user.name}</td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 20px 0;font-size:16px;">You can view more details and track your progress in the SAPT Student Dashboard.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                            <p style="margin:0;font-size:14px;color:#64748b;">&copy; ${new Date().getFullYear()} Student Activity Points Tracker (SAPT)</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>`;

                console.log(`--- ATTEMPTING TO SEND EMAIL TO: ${student.email} ---`);
                const emailResult = await sendEmail({
                    to: student.email,
                    subject: `SAPT Alert: New Deadline Assigned - ${title}`,
                    text: `A new deadline "${title}" has been assigned to you: ${description}`,
                    html,
                });
                console.log(`--- EMAIL RESULT FOR ${student.email}: ${emailResult ? 'SUCCESS' : 'FAILED'} ---`);
            } else {
                console.log(`--- EMAIL SKIPPED FOR ${student.name} (notifications disabled) ---`);
            }
        }
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
