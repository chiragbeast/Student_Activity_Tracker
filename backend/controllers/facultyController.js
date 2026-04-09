const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ActivityPoints = require('../models/ActivityPoints');
const Notification = require('../models/Notification');
const { sendEmail } = require('../utils/mailer');
const socketUtils = require('../utils/socket'); // [NEW] Import socketUtils
const cloudinary = require('../config/cloudinary');

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

    const typeMap = {
        Approved: 'submission_approved',
        Denied: 'submission_denied',
        Returned: 'submission_returned',
    };

    const notif = await Notification.create({
        user: submission.student,
        type: typeMap[status] || 'info',
        title: `Submission ${status}`,
        message: `Your submission for "${submission.activityName}" has been ${status.toLowerCase()}. ${reviewComments ? `Comment: ${reviewComments}` : ''}`,
        sender: req.user.name,
        senderRole: 'Faculty',
        relatedSubmission: submission._id,
    });

    // Emit live notification
    socketUtils.sendNotification(submission.student, notif);

    if (student.emailNotifications) {
        await sendEmail({
            to: student.email,
            subject: `Submission ${status}: ${submission.activityName}`,
            text: `Your submission for "${submission.activityName}" has been ${status.toLowerCase()}.`,
        });
    }

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

            const typeMap = {
                Approved: 'submission_approved',
                Denied: 'submission_denied',
                Returned: 'submission_returned',
            };

            const notif = await Notification.create({
                user: submission.student,
                type: typeMap[status] || 'info',
                title: `Submission ${status} (Bulk Review)`,
                message: `Your submission for "${submission.activityName}" has been ${status.toLowerCase()} during bulk review.`,
                sender: req.user.name,
                senderRole: 'Faculty',
                relatedSubmission: submission._id,
            });

            // Emit live notification
            socketUtils.sendNotification(submission.student, notif);

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

// @desc    Update faculty profile preferences
// @route   PUT /api/faculty/profile
// @access  Private/Faculty
const updateFacultyProfile = asyncHandler(async (req, res) => {
    const faculty = await User.findById(req.user._id);

    if (faculty) {
        const { notificationsEnabled, emailNotifications, batchNotifications } = req.body;

        if (notificationsEnabled !== undefined) faculty.notificationsEnabled = notificationsEnabled;
        if (emailNotifications !== undefined) faculty.emailNotifications = emailNotifications;
        if (batchNotifications !== undefined) faculty.batchNotifications = batchNotifications;

        const updatedFaculty = await faculty.save();
        res.status(200).json({
            success: true,
            data: {
                notificationsEnabled: updatedFaculty.notificationsEnabled,
                emailNotifications: updatedFaculty.emailNotifications,
                batchNotifications: updatedFaculty.batchNotifications,
            },
        });
    } else {
        res.status(404);
        throw new Error('Faculty not found');
    }
});

// @desc    Get submissions history for a specific student
// @route   GET /api/faculty/students/:studentId/submissions
// @access  Private/Faculty
const getStudentSubmissions = asyncHandler(async (req, res) => {
    const { studentId } = req.params;

    // Verify student is assigned to this faculty
    const student = await User.findById(studentId);
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to view this student\'s history');
    }

    const submissions = await Submission.find({ student: studentId })
        .sort({ createdAt: -1 })
        .select('activityName activityDate activityLevel pointsRequested pointsApproved status createdAt');

    res.json({
        success: true,
        data: submissions,
    });
});

// @desc    Export student data as PDF
// @route   GET /api/faculty/students/:studentId/export-pdf
// @access  Private/Faculty
// ── Helper: Generate PDF report for a single student into a doc ──
function generateStudentPDFReport(doc, student, pts, submissions) {
    // -- Header --
    doc.fillColor('#444444').fontSize(20).text('Student Activity Points Report', { align: 'center' });
    doc.moveDown();
    doc.strokeColor('#aaaaaa').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown();

    // -- Student Info Section --
    doc.fillColor('#333333').fontSize(14).text('Student Information', { underline: true });
    doc.fontSize(10).moveDown(0.5);
    doc.text(`Name: ${student.name}`);
    doc.text(`Roll Number: ${student.rollNumber || 'N/A'}`);
    doc.text(`Department: ${student.department || 'N/A'}`);
    doc.text(`Email: ${student.email}`);
    doc.moveDown();

    // -- Points Summary Section --
    doc.fillColor('#333333').fontSize(14).text('Points Summary', { underline: true });
    doc.fontSize(10).moveDown(0.5);
    doc.text(`Institute Points: ${pts.institutePoints}`);
    doc.text(`Department Points: ${pts.departmentPoints}`);
    doc.fillColor('#000000').fontSize(12).text(`Total Cumulative Points: ${pts.totalPoints}`, { bold: true });
    doc.moveDown();

    // -- Submission History Table --
    doc.fillColor('#333333').fontSize(14).text('Submission History', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    const tableTop = doc.y;
    doc.fontSize(10).fillColor('#000000');
    doc.text('Activity', 50, tableTop, { width: 220 });
    doc.text('Level', 270, tableTop, { width: 70 });
    doc.text('Points', 340, tableTop, { width: 50 });
    doc.text('Status', 390, tableTop, { width: 70 });
    doc.text('Date', 460, tableTop, { width: 90 });

    doc.moveDown(0.5);
    doc.strokeColor('#dddddd').lineWidth(0.5).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(0.5);

    // Table Rows
    submissions.forEach(sub => {
        if (doc.y > 680) doc.addPage();

        const currentY = doc.y;
        doc.fontSize(9).fillColor('#444444');
        doc.text(sub.activityName || 'Unknown Activity', 50, currentY, { width: 220 });
        doc.text(sub.activityLevel || 'N/A', 270, currentY, { width: 70 });

        const ptsValue = sub.status === 'Approved' ? sub.pointsApproved : sub.pointsRequested;
        doc.text(ptsValue != null ? ptsValue.toString() : '0', 340, currentY, { width: 50 });

        // Color status based on value
        let statusColor = '#444444';
        if (sub.status === 'Approved') statusColor = '#27ae60';
        if (sub.status === 'Denied') statusColor = '#e74c3c';
        if (sub.status === 'Pending') statusColor = '#f39c12';

        doc.fillColor(statusColor).text(sub.status || 'Pending', 390, currentY, { width: 70 });
        doc.fillColor('#444444').text(sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A', 460, currentY, { width: 90 });

        doc.moveDown(0.8);
    });
}

// @desc    Export student data as PDF
// @route   GET /api/faculty/students/:studentId/export-pdf
// @access  Private/Faculty
const exportStudentPDF = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const PDFDocument = require('pdfkit');

    // Fetch student data
    const student = await User.findById(studentId).select('name email rollNumber department facultyAdvisor');
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to export this student\'s data');
    }

    // Fetch points stats
    const pointsRecord = await ActivityPoints.findOne({ student: studentId });
    const pts = pointsRecord || { institutePoints: 0, departmentPoints: 0, totalPoints: 0, pointsHistory: [] };

    // Fetch all submissions for the PDF report
    const submissions = await Submission.find({ student: studentId }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    let filename = `Report_${student.rollNumber || student.name.replace(/\s+/g, '_')}.pdf`;

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    doc.pipe(res);

    generateStudentPDFReport(doc, student, pts, submissions);

    // -- Footer --
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#888888').text(
            `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
            50,
            750,
            { align: 'center', width: 500 }
        );
    }

    doc.end();
});

// @desc    Export all assigned students data as a single PDF
// @route   GET /api/faculty/export-all-pdf
// @access  Private/Faculty
const exportAllPDFs = asyncHandler(async (req, res) => {
    const PDFDocument = require('pdfkit');
    const students = await User.find({
        facultyAdvisor: req.user._id,
        role: 'Student',
    }).select('name email rollNumber department');

    if (students.length === 0) {
        res.status(404);
        throw new Error('No assigned students found to export');
    }

    const doc = new PDFDocument({ margin: 50, bufferPages: true });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Bulk_Student_Report_${new Date().toISOString().split('T')[0]}.pdf`);
    doc.pipe(res);

    for (let i = 0; i < students.length; i++) {
        const student = students[i];

        // Fetch data for this student
        const pointsRecord = await ActivityPoints.findOne({ student: student._id });
        const pts = pointsRecord || { institutePoints: 0, departmentPoints: 0, totalPoints: 0 };
        const submissions = await Submission.find({ student: student._id }).sort({ createdAt: -1 });

        generateStudentPDFReport(doc, student, pts, submissions);

        // Add page break if not the last student
        if (i < students.length - 1) {
            doc.addPage();
        }
    }

    // -- Footer --
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).fillColor('#888888').text(
            `Generated on ${new Date().toLocaleString()} | Page ${i + 1} of ${pageCount}`,
            50,
            750,
            { align: 'center', width: 500 }
        );
    }

    doc.end();
});

// @desc    Notify student of email sent by faculty
// @route   POST /api/faculty/students/:studentId/notify-email
// @access  Private/Faculty
const notifyStudentOfEmail = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const { reason } = req.body;

    const student = await User.findById(studentId);
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to notify this student');
    }

    const Notification = require('../models/Notification');
    const msg = reason === 'meeting' ? 'Your Faculty Advisor has requested a meeting with you. Please check your email for details.' : 'Your Faculty Advisor has sent you a message regarding your semester points. Please check your email for details.';

    const notif = await Notification.create({
        user: studentId,
        type: 'info',
        title: reason === 'meeting' ? 'Meeting Request from FA' : 'Message regarding Activity Points',
        message: msg
    });

    // Emit live notification
    socketUtils.sendNotification(studentId, notif);

    res.status(200).json({ success: true, message: 'Student notified' });
});

// @desc    Upload/update faculty profile picture
// @route   PUT /api/faculty/profile/picture
// @access  Private/Faculty
const updateFacultyProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    // Delete old profile picture from Cloudinary if it exists
    if (user.profilePicture) {
        try {
            const urlParts = user.profilePicture.split('/');
            const folderAndFile = urlParts.slice(-2).join('/');
            const publicId = folderAndFile.replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Failed to delete old profile picture:', err.message);
        }
    }

    // Upload new image to Cloudinary
    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'profile-pictures',
                resource_type: 'image',
                public_id: `user-${user._id}-${Date.now()}`,
                transformation: [
                    { width: 300, height: 300, crop: 'fill', gravity: 'face' },
                ],
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        const { Readable } = require('stream');
        const readable = Readable.from(req.file.buffer);
        readable.pipe(uploadStream);
    });

    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({
        success: true,
        profilePicture: user.profilePicture,
    });
});

// @desc    Export student data as Excel
// @route   GET /api/faculty/students/:studentId/export-excel
// @access  Private/Faculty
const exportStudentExcel = asyncHandler(async (req, res) => {
    const { studentId } = req.params;
    const ExcelJS = require('exceljs');

    // Fetch student data
    const student = await User.findById(studentId).select('name email rollNumber department facultyAdvisor');
    if (!student || String(student.facultyAdvisor) !== String(req.user._id)) {
        res.status(403);
        throw new Error('Not authorized to export this student\'s data');
    }

    // Fetch points stats
    const pointsRecord = await ActivityPoints.findOne({ student: studentId });
    const pts = pointsRecord || { institutePoints: 0, departmentPoints: 0, totalPoints: 0 };

    // Fetch all submissions
    const submissions = await Submission.find({ student: studentId }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Student Report');

    // -- Header Styles --
    const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' }
    };

    // -- Student Info --
    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'Student Activity Points Report';
    sheet.getCell('A1').style = headerStyle;

    sheet.addRow([]);
    sheet.addRow(['Student Information']);
    sheet.getRow(3).font = { bold: true };
    sheet.addRow(['Name', student.name]);
    sheet.addRow(['Roll Number', student.rollNumber || 'N/A']);
    sheet.addRow(['Department', student.department || 'N/A']);
    sheet.addRow(['Email', student.email]);
    sheet.addRow([]);

    // -- Points Summary --
    sheet.addRow(['Points Summary']);
    sheet.getRow(9).font = { bold: true };
    sheet.addRow(['Institute Points', pts.institutePoints]);
    sheet.addRow(['Department Points', pts.departmentPoints]);
    sheet.addRow(['Total Cumulative Points', pts.totalPoints]);
    sheet.getRow(12).font = { bold: true, color: { argb: 'FF000000' } };
    sheet.addRow([]);

    // -- Submissions Table --
    sheet.addRow(['Submission History']);
    sheet.getRow(14).font = { bold: true };
    const tableHeader = ['Activity', 'Level', 'Points', 'Status', 'Date'];
    sheet.addRow(tableHeader);
    sheet.getRow(15).font = { bold: true };

    submissions.forEach(sub => {
        const ptsValue = sub.status === 'Approved' ? sub.pointsApproved : sub.pointsRequested;
        sheet.addRow([
            sub.activityName || 'Unknown Activity',
            sub.activityLevel || 'N/A',
            ptsValue != null ? ptsValue : 0,
            sub.status || 'Pending',
            sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A'
        ]);
    });

    // Adjust column widths
    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=Report_${student.rollNumber || student.name.replace(/\s+/g, '_')}.xlsx`);

    await workbook.xlsx.write(res);
    res.end();
});

// @desc    Export all assigned students data as a single Excel file
// @route   GET /api/faculty/export-all-excel
// @access  Private/Faculty
const exportAllExcel = asyncHandler(async (req, res) => {
    try {
        const ExcelJS = require('exceljs');
        const students = await User.find({
            facultyAdvisor: req.user._id,
            role: 'Student',
        }).select('name email rollNumber department');

        if (students.length === 0) {
            res.status(404);
            throw new Error('No assigned students found to export');
        }

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Assigned Students Summary');

        // -- Heading --
        sheet.mergeCells('A1:F1');
        const headingCell = sheet.getCell('A1');
        headingCell.value = 'Student Activity Points Report';
        headingCell.font = { bold: true, size: 16 };
        headingCell.alignment = { horizontal: 'center' };
        sheet.addRow([]); // Blank row

        // -- Table Header --
        const headers = ['Student Name', 'Roll Number', 'Department', 'Department Points', 'Institute Points', 'Total Points'];
        const headerRow = sheet.addRow(headers);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };

        // -- Table Data --
        for (const student of students) {
            const pointsRecord = await ActivityPoints.findOne({ student: student._id });
            const pts = pointsRecord || { institutePoints: 0, departmentPoints: 0, totalPoints: 0 };

            sheet.addRow([
                student.name,
                student.rollNumber || 'N/A',
                student.department || 'N/A',
                pts.departmentPoints,
                pts.institutePoints,
                pts.totalPoints
            ]);
        }

        // Adjust column widths
        sheet.getColumn(1).width = 30;
        sheet.getColumn(2).width = 20;
        sheet.getColumn(3).width = 20;
        sheet.getColumn(4).width = 20;
        sheet.getColumn(5).width = 20;
        sheet.getColumn(6).width = 15;

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=Assigned_Students_Summary_${new Date().toISOString().split('T')[0]}.xlsx`);

        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error('Error in exportAllExcel:', error);
        res.status(500).json({ success: false, message: error.message });
    }
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
    updateFacultyProfile,
    updateFacultyProfilePicture,
    getStudentSubmissions,
    exportStudentPDF,
    exportAllPDFs,
    exportStudentExcel,
    exportAllExcel,
    notifyStudentOfEmail,
};
