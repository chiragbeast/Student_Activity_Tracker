const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ActivityPoints = require('../models/ActivityPoints');

// ── Helper: Get all student IDs assigned to this faculty ──
async function getAssignedStudentIds(facultyId) {
    const students = await User.find({ facultyAdvisor: facultyId, role: 'Student' }).select('_id');
    return students.map(s => s._id);
}

// @desc    Get faculty dashboard stats
// @route   GET /api/faculty/stats
// @access  Private/Faculty
const getFacultyStats = asyncHandler(async (req, res) => {
    const studentIds = await getAssignedStudentIds(req.user._id);

    const totalAssignedStudents = studentIds.length;

    // Count pending submissions for these students
    const pendingSubmissions = await Submission.countDocuments({
        student: { $in: studentIds },
        status: 'Pending',
    });

    // Count reviews completed today by this faculty
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const completedToday = await Submission.countDocuments({
        reviewedBy: req.user._id,
        reviewedAt: { $gte: todayStart },
    });

    res.json({
        success: true,
        data: {
            totalAssignedStudents,
            pendingSubmissions,
            completedToday,
        },
    });
});

// @desc    Get assigned students with their activity points
// @route   GET /api/faculty/students
// @access  Private/Faculty
const getAssignedStudents = asyncHandler(async (req, res) => {
    const students = await User.find({
        facultyAdvisor: req.user._id,
        role: 'Student',
    }).select('name email rollNumber department');

    // Get activity points for each student
    const studentIds = students.map(s => s._id);
    const pointsRecords = await ActivityPoints.find({ student: { $in: studentIds } });

    // Map points by student ID for quick lookup
    const pointsMap = {};
    pointsRecords.forEach(p => {
        pointsMap[p.student.toString()] = {
            institutePoints: p.institutePoints,
            departmentPoints: p.departmentPoints,
            totalPoints: p.totalPoints,
        };
    });

    const result = students.map(s => ({
        _id: s._id,
        name: s.name,
        email: s.email,
        rollNumber: s.rollNumber,
        department: s.department,
        stats: pointsMap[s._id.toString()] || {
            institutePoints: 0,
            departmentPoints: 0,
            totalPoints: 0,
        },
    }));

    res.json({
        success: true,
        data: result,
    });
});

// @desc    Get pending submissions for faculty's assigned students
// @route   GET /api/faculty/submissions/pending
// @access  Private/Faculty
const getPendingSubmissions = asyncHandler(async (req, res) => {
    const studentIds = await getAssignedStudentIds(req.user._id);

    const submissions = await Submission.find({
        student: { $in: studentIds },
        status: 'Pending',
    })
        .populate('student', 'name email rollNumber department')
        .sort({ createdAt: -1 });

    res.json({
        success: true,
        data: submissions,
    });
});

// @desc    Get a single submission detail
// @route   GET /api/faculty/submissions/:id
// @access  Private/Faculty
const getSubmissionDetails = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate('student', 'name email rollNumber department');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    // Verify the student belongs to this faculty
    const student = await User.findById(submission.student._id || submission.student);
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to view this submission');
    }

    res.json({
        success: true,
        data: submission,
    });
});

// @desc    Review a submission (Approve/Deny/Return)
// @route   POST /api/faculty/submissions/:id/review
// @access  Private/Faculty
const reviewSubmission = asyncHandler(async (req, res) => {
    const { status, pointsApproved, reviewComments } = req.body;

    if (!status || !['Approved', 'Denied', 'Returned'].includes(status)) {
        res.status(400);
        throw new Error('Valid status (Approved, Denied, Returned) is required');
    }

    const submission = await Submission.findById(req.params.id);

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    // Verify the student belongs to this faculty
    const student = await User.findById(submission.student);
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to review this submission');
    }

    // Update submission
    submission.status = status;
    submission.reviewedBy = req.user._id;
    submission.reviewedAt = new Date();
    submission.reviewComments = reviewComments || '';

    if (status === 'Approved') {
        submission.pointsApproved = pointsApproved !== undefined ? pointsApproved : submission.pointsRequested;

        // Auto-update ActivityPoints
        await updateActivityPoints(submission);
    }

    await submission.save();

    res.json({
        success: true,
        data: submission,
    });
});

// ── Helper: Update ActivityPoints on Approval ──
async function updateActivityPoints(submission) {
    const pointsToAdd = submission.pointsApproved || 0;
    const level = submission.activityLevel; // 'Institute' or 'Department'

    // Find or create ActivityPoints record
    let record = await ActivityPoints.findOne({ student: submission.student });
    if (!record) {
        record = new ActivityPoints({ student: submission.student });
    }

    // Increment the correct category
    if (level === 'Institute') {
        record.institutePoints += pointsToAdd;
    } else if (level === 'Department') {
        record.departmentPoints += pointsToAdd;
    }
    record.totalPoints = record.institutePoints + record.departmentPoints;

    // Add to points history
    record.pointsHistory.push({
        submission: submission._id,
        activityName: submission.activityName,
        activityLevel: level,
        pointsRequested: submission.pointsRequested,
        pointsApproved: pointsToAdd,
        action: pointsToAdd === submission.pointsRequested ? 'approved' : 'modified',
        date: new Date(),
    });

    await record.save();
}

// @desc    Bulk review submissions
// @route   POST /api/faculty/submissions/bulk-review
// @access  Private/Faculty
const bulkReviewSubmissions = asyncHandler(async (req, res) => {
    const { submissionIds, status, feedback } = req.body;

    if (!submissionIds || !Array.isArray(submissionIds) || submissionIds.length === 0) {
        res.status(400);
        throw new Error('submissionIds array is required');
    }

    if (!status || !['Approved', 'Denied', 'Returned'].includes(status)) {
        res.status(400);
        throw new Error('Valid status (Approved, Denied, Returned) is required');
    }

    const results = { processed: 0, errors: [] };

    for (const id of submissionIds) {
        try {
            const submission = await Submission.findById(id);
            if (!submission) {
                results.errors.push({ id, error: 'Not found' });
                continue;
            }

            // Verify student belongs to this faculty
            const student = await User.findById(submission.student);
            if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
                results.errors.push({ id, error: 'Not authorized' });
                continue;
            }

            submission.status = status;
            submission.reviewedBy = req.user._id;
            submission.reviewedAt = new Date();
            submission.reviewComments = feedback || `${status} via bulk action`;

            if (status === 'Approved') {
                submission.pointsApproved = submission.pointsRequested;
                await updateActivityPoints(submission);
            }

            await submission.save();
            results.processed++;
        } catch (err) {
            results.errors.push({ id, error: err.message });
        }
    }

    res.json({
        success: true,
        data: results,
    });
});

// @desc    Export students data as CSV
// @route   GET /api/faculty/export
// @access  Private/Faculty
const exportStudentsCSV = asyncHandler(async (req, res) => {
    const students = await User.find({
        facultyAdvisor: req.user._id,
        role: 'Student',
    }).select('name email rollNumber department');

    const studentIds = students.map(s => s._id);
    const pointsRecords = await ActivityPoints.find({ student: { $in: studentIds } });

    const pointsMap = {};
    pointsRecords.forEach(p => {
        pointsMap[p.student.toString()] = p;
    });

    // Build CSV
    const header = 'Name,Roll Number,Email,Department,Institute Points,Department Points,Total Points\n';
    const rows = students.map(s => {
        const pts = pointsMap[s._id.toString()] || { institutePoints: 0, departmentPoints: 0, totalPoints: 0 };
        return `"${s.name}","${s.rollNumber || ''}","${s.email}","${s.department || ''}",${pts.institutePoints},${pts.departmentPoints},${pts.totalPoints}`;
    });

    const csv = header + rows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=students_export.csv');
    res.status(200).send(csv);
});

// @desc    Get faculty profile
// @route   GET /api/faculty/profile
// @access  Private/Faculty
const getFacultyProfile = asyncHandler(async (req, res) => {
    const faculty = await User.findById(req.user._id).select('name email phone office department role profilePicture');

    if (!faculty) {
        res.status(404);
        throw new Error('Faculty not found');
    }

    res.json({
        success: true,
        data: faculty,
    });
});

module.exports = {
    getFacultyStats,
    getAssignedStudents,
    getPendingSubmissions,
    getSubmissionDetails,
    reviewSubmission,
    bulkReviewSubmissions,
    exportStudentsCSV,
    getFacultyProfile,
};
