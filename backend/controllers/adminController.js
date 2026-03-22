const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const Submission = require('../models/Submission');
const ActivityPoints = require('../models/ActivityPoints');

// @desc    Get admin dashboard stats and admin user list
// @route   GET /api/admin/dashboard
// @access  Private/Admin
const getDashboard = asyncHandler(async (req, res) => {
    const [totalStudents, totalFaculty, totalPendingSubmissions, adminUsers] = await Promise.all([
        User.countDocuments({ role: 'Student' }),
        User.countDocuments({ role: 'Faculty' }),
        Submission.countDocuments({ status: 'Pending' }),
        User.find({ role: 'Admin' })
            .select('name email role profilePicture createdAt lastLogin isActive')
            .sort({ createdAt: -1 }),
    ]);

    res.status(200).json({
        stats: {
            totalStudents,
            totalFaculty,
            totalPendingSubmissions,
        },
        admins: adminUsers,
    });
});

// @desc    Get reports analytics summary and top performers
// @route   GET /api/admin/reports
// @access  Private/Admin
const getReportsAnalytics = asyncHandler(async (req, res) => {
    const [pointsAgg, activeStudents, approvedActivities, topPerformers, studentsWithPoints] = await Promise.all([
        ActivityPoints.aggregate([
            {
                $group: {
                    _id: null,
                    totalPointsAwarded: { $sum: '$totalPoints' },
                },
            },
        ]),
        User.countDocuments({ role: 'Student', isActive: true }),
        Submission.countDocuments({ status: 'Approved' }),
        ActivityPoints.aggregate([
            {
                $lookup: {
                    from: 'users',
                    localField: 'student',
                    foreignField: '_id',
                    as: 'student',
                },
            },
            { $unwind: '$student' },
            { $match: { 'student.role': 'Student' } },
            { $sort: { totalPoints: -1 } },
            { $limit: 10 },
            {
                $project: {
                    _id: '$student._id',
                    name: '$student.name',
                    email: '$student.email',
                    department: '$student.department',
                    isActive: '$student.isActive',
                    totalPoints: '$totalPoints',
                },
            },
        ]),
        User.aggregate([
            { $match: { role: 'Student' } },
            {
                $lookup: {
                    from: 'activitypoints',
                    localField: '_id',
                    foreignField: 'student',
                    as: 'points',
                },
            },
            {
                $addFields: {
                    studentTotalPoints: { $ifNull: [{ $arrayElemAt: ['$points.totalPoints', 0] }, 0] },
                    semesterNum: {
                        $convert: {
                            input: '$semester',
                            to: 'int',
                            onError: null,
                            onNull: null,
                        },
                    },
                },
            },
            {
                $project: {
                    department: 1,
                    studentTotalPoints: 1,
                    semesterNum: 1,
                },
            },
        ]),
    ]);

    const totalPointsAwarded = pointsAgg[0]?.totalPointsAwarded || 0;
    const avgPointsPerStudent = activeStudents > 0 ? Number((totalPointsAwarded / activeStudents).toFixed(2)) : 0;

    const departmentTotalsMap = new Map();
    const yearTotalsByDepartment = new Map();
    const yearCountsByDepartment = new Map();

    for (const student of studentsWithPoints) {
        const department = student.department || 'Unspecified';
        const points = Number(student.studentTotalPoints || 0);
        const semesterNum = Number(student.semesterNum);

        departmentTotalsMap.set(department, (departmentTotalsMap.get(department) || 0) + points);

        if (Number.isFinite(semesterNum) && semesterNum >= 1 && semesterNum <= 8) {
            const yearIndex = Math.ceil(semesterNum / 2); // 1-2 => Year 1, 3-4 => Year 2, etc.
            if (!yearTotalsByDepartment.has(department)) {
                yearTotalsByDepartment.set(department, [0, 0, 0, 0]);
                yearCountsByDepartment.set(department, [0, 0, 0, 0]);
            }
            const totals = yearTotalsByDepartment.get(department);
            const counts = yearCountsByDepartment.get(department);
            totals[yearIndex - 1] += points;
            counts[yearIndex - 1] += 1;
        }
    }

    const departmentDistribution = Array.from(departmentTotalsMap.entries())
        .map(([department, totalPoints]) => ({ department, totalPoints }))
        .sort((a, b) => b.totalPoints - a.totalPoints);

    const yearWiseAverages = {};
    for (const [department, totals] of yearTotalsByDepartment.entries()) {
        const counts = yearCountsByDepartment.get(department);
        yearWiseAverages[department] = totals.map((sum, index) => {
            const count = counts[index] || 0;
            return count > 0 ? Number((sum / count).toFixed(2)) : 0;
        });
    }

    res.status(200).json({
        stats: {
            totalPointsAwarded,
            activeStudents,
            avgPointsPerStudent,
            approvedActivities,
        },
        departmentDistribution,
        yearWiseAverages,
        topPerformers,
    });
});

// @desc    Get all students with total points
// @route   GET /api/admin/students
// @access  Private/Admin
const getStudents = asyncHandler(async (req, res) => {
    const students = await User.aggregate([
        { $match: { role: 'Student' } },
        {
            $lookup: {
                from: 'activitypoints',
                localField: '_id',
                foreignField: 'student',
                as: 'points',
            },
        },
        {
            $addFields: {
                institutePoints: { $ifNull: [{ $arrayElemAt: ['$points.institutePoints', 0] }, 0] },
                departmentPoints: { $ifNull: [{ $arrayElemAt: ['$points.departmentPoints', 0] }, 0] },
                totalPoints: { $ifNull: [{ $arrayElemAt: ['$points.totalPoints', 0] }, 0] },
            },
        },
        {
            $project: {
                name: 1, email: 1, rollNumber: 1, department: 1, profilePicture: 1,
                isActive: 1, lastLogin: 1, createdAt: 1, institutePoints: 1, departmentPoints: 1, totalPoints: 1,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json(students);
});

// @desc    Create a new student user
// @route   POST /api/admin/students
// @access  Private/Admin
const createStudent = asyncHandler(async (req, res) => {
    const { name, email, rollNumber, department, batch, semester, phone } = req.body;

    if (!name || !email || !rollNumber) {
        res.status(400);
        throw new Error('Name, email and roll number are required');
    }

    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        res.status(400);
        throw new Error('A user with this email already exists');
    }

    // Initial student password is roll number; User model pre-save hook hashes it.
    const initialPassword = String(rollNumber);

    const student = await User.create({
        name,
        email,
        password: initialPassword,
        role: 'Student',
        rollNumber,
        department: department || undefined,
        batch: batch || undefined,
        semester: semester || undefined,
        phone: phone || undefined,
    });

    res.status(201).json({
        _id: student._id,
        name: student.name,
        email: student.email,
        rollNumber: student.rollNumber,
        department: student.department,
        isActive: student.isActive,
        totalPoints: 0,
    });
});

// @desc    Bulk import students from parsed Excel rows
// @route   POST /api/admin/students/bulk-import
// @access  Private/Admin
const bulkImportStudents = asyncHandler(async (req, res) => {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400);
        throw new Error('Rows array is required for bulk import');
    }

    const failedRows = [];
    let successCount = 0;

    const seenEmails = new Set();
    const seenRollNumbers = new Set();

    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index] || {};
        const serialNumber = Number(row.serialNumber) || index + 1;

        const name = typeof row.name === 'string' ? row.name.trim() : '';
        const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
        const rollNumber = typeof row.rollNumber === 'string' || typeof row.rollNumber === 'number'
            ? String(row.rollNumber).trim()
            : '';
        const department = typeof row.department === 'string' ? row.department.trim() : '';
        const batch = typeof row.batch === 'string' ? row.batch.trim() : '';
        const semester = row.semester !== undefined && row.semester !== null ? String(row.semester).trim() : '';
        const phone = typeof row.phone === 'string' || typeof row.phone === 'number' ? String(row.phone).trim() : '';

        if (!name || !email || !rollNumber) {
            failedRows.push({ serialNumber, reason: 'Missing required fields (name, email, roll number)' });
            continue;
        }

        if (seenEmails.has(email)) {
            failedRows.push({ serialNumber, reason: 'Duplicate email in uploaded sheet' });
            continue;
        }
        if (seenRollNumbers.has(rollNumber)) {
            failedRows.push({ serialNumber, reason: 'Duplicate roll number in uploaded sheet' });
            continue;
        }

        seenEmails.add(email);
        seenRollNumbers.add(rollNumber);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            failedRows.push({ serialNumber, reason: 'Email already exists' });
            continue;
        }

        const existingStudentRoll = await User.findOne({ role: 'Student', rollNumber });
        if (existingStudentRoll) {
            failedRows.push({ serialNumber, reason: 'Roll number already exists for another student' });
            continue;
        }

        try {
            await User.create({
                name,
                email,
                password: String(rollNumber),
                role: 'Student',
                rollNumber,
                department: department || undefined,
                batch: batch || undefined,
                semester: semester || undefined,
                phone: phone || undefined,
            });
            successCount += 1;
        } catch (error) {
            failedRows.push({ serialNumber, reason: error.message || 'Failed to create student' });
        }
    }

    res.status(200).json({
        totalRows: rows.length,
        successCount,
        failedCount: failedRows.length,
        failedRows,
    });
});

// @desc    Get single student by ID (with faculty list for dropdown)
// @route   GET /api/admin/students/:id
// @access  Private/Admin
const getStudentById = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'Student' })
        .select('-password')
        .populate('facultyAdvisor', 'name department office');
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    const facultyList = await User.find({ role: 'Faculty' })
        .select('name department office')
        .sort({ name: 1 });
    res.status(200).json({ student, facultyList });
});

// @desc    Update student by ID
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
const updateStudent = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'Student' });
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    const { name, rollNumber, department, batch, semester, phone, isActive, facultyAdvisorId } = req.body;
    if (name) student.name = name;
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (department !== undefined) student.department = department;
    if (batch !== undefined) student.batch = batch;
    if (semester !== undefined) student.semester = semester;
    if (phone !== undefined) student.phone = phone;
    if (typeof isActive === 'boolean') student.isActive = isActive;
    if (facultyAdvisorId !== undefined) student.facultyAdvisor = facultyAdvisorId || null;
    await student.save();
    res.status(200).json({ message: 'Student updated successfully' });
});

// @desc    Delete student by ID
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
const deleteStudent = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'Student' });
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    await User.deleteOne({ _id: req.params.id });
    await Submission.deleteMany({ student: req.params.id });
    await ActivityPoints.deleteMany({ student: req.params.id });
    res.status(200).json({ message: 'Student deleted successfully' });
});

// @desc    Get all faculty members with assigned student count
// @route   GET /api/admin/faculty
// @access  Private/Admin
const getFaculty = asyncHandler(async (req, res) => {
    const faculty = await User.aggregate([
        { $match: { role: 'Faculty' } },
        {
            $lookup: {
                from: 'users',
                let: { facultyId: '$_id' },
                pipeline: [
                    { $match: { $expr: { $and: [
                        { $eq: ['$role', 'Student'] },
                        { $eq: ['$facultyAdvisor', '$$facultyId'] }
                    ]}}}
                ],
                as: 'assignedStudentsList',
            },
        },
        {
            $lookup: {
                from: 'submissions',
                let: { facultyId: '$_id' },
                pipeline: [
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'student',
                            foreignField: '_id',
                            as: 'studentDoc',
                        },
                    },
                    { $unwind: '$studentDoc' },
                    {
                        $match: {
                            $expr: {
                                $and: [
                                    { $eq: ['$status', 'Pending'] },
                                    { $eq: ['$studentDoc.facultyAdvisor', '$$facultyId'] },
                                ],
                            },
                        },
                    },
                ],
                as: 'pendingSubmissionsList',
            },
        },
        {
            $addFields: {
                assignedStudents: { $size: '$assignedStudentsList' },
                pendingSubmissions: { $size: '$pendingSubmissionsList' },
            },
        },
        {
            $project: {
                name: 1, email: 1, department: 1, phone: 1, office: 1, rollNumber: 1, profilePicture: 1,
                isActive: 1, lastLogin: 1, createdAt: 1, assignedStudents: 1, pendingSubmissions: 1,
            },
        },
        { $sort: { createdAt: -1 } },
    ]);
    res.status(200).json(faculty);
});

// @desc    Create a new faculty user
// @route   POST /api/admin/faculty
// @access  Private/Admin
const createFaculty = asyncHandler(async (req, res) => {
    const { name, email, department, phone, employeeId, office } = req.body;
    if (!name || !email || !employeeId) {
        res.status(400);
        throw new Error('Name, email and employee ID are required');
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
        res.status(400);
        throw new Error('A user with this email already exists');
    }

    // Initial faculty password is employee ID; User model pre-save hook hashes it.
    const initialPassword = String(employeeId);

    const faculty = await User.create({
        name,
        email,
        password: initialPassword,
        role: 'Faculty',
        department: department || undefined,
        phone: phone || undefined,
        office: office || undefined,
        rollNumber: employeeId,
    });
    res.status(201).json({
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        office: faculty.office,
        isActive: faculty.isActive,
        assignedStudents: 0,
    });
});

// @desc    Bulk import faculty from parsed Excel rows
// @route   POST /api/admin/faculty/bulk-import
// @access  Private/Admin
const bulkImportFaculty = asyncHandler(async (req, res) => {
    const { rows } = req.body;

    if (!Array.isArray(rows) || rows.length === 0) {
        res.status(400);
        throw new Error('Rows array is required for bulk import');
    }

    const failedRows = [];
    let successCount = 0;

    const seenEmails = new Set();
    const seenEmployeeIds = new Set();

    for (let index = 0; index < rows.length; index += 1) {
        const row = rows[index] || {};
        const serialNumber = Number(row.serialNumber) || index + 1;

        const name = typeof row.name === 'string' ? row.name.trim() : '';
        const email = typeof row.email === 'string' ? row.email.trim().toLowerCase() : '';
        const employeeId = typeof row.employeeId === 'string' || typeof row.employeeId === 'number'
            ? String(row.employeeId).trim()
            : '';
        const department = typeof row.department === 'string' ? row.department.trim() : '';
        const office = typeof row.office === 'string' ? row.office.trim() : '';
        const phone = typeof row.phone === 'string' || typeof row.phone === 'number' ? String(row.phone).trim() : '';

        if (!name || !email || !employeeId) {
            failedRows.push({ serialNumber, reason: 'Missing required fields (name, email, employee ID)' });
            continue;
        }

        if (seenEmails.has(email)) {
            failedRows.push({ serialNumber, reason: 'Duplicate email in uploaded sheet' });
            continue;
        }
        if (seenEmployeeIds.has(employeeId)) {
            failedRows.push({ serialNumber, reason: 'Duplicate employee ID in uploaded sheet' });
            continue;
        }

        seenEmails.add(email);
        seenEmployeeIds.add(employeeId);

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            failedRows.push({ serialNumber, reason: 'Email already exists' });
            continue;
        }

        const existingFacultyId = await User.findOne({ role: 'Faculty', rollNumber: employeeId });
        if (existingFacultyId) {
            failedRows.push({ serialNumber, reason: 'Employee ID already exists for another faculty' });
            continue;
        }

        try {
            await User.create({
                name,
                email,
                password: String(employeeId),
                role: 'Faculty',
                department: department || undefined,
                phone: phone || undefined,
                office: office || undefined,
                rollNumber: employeeId,
            });
            successCount += 1;
        } catch (error) {
            failedRows.push({ serialNumber, reason: error.message || 'Failed to create faculty' });
        }
    }

    res.status(200).json({
        totalRows: rows.length,
        successCount,
        failedCount: failedRows.length,
        failedRows,
    });
});

// @desc    Get single faculty by ID
// @route   GET /api/admin/faculty/:id
// @access  Private/Admin
const getFacultyById = asyncHandler(async (req, res) => {
    const faculty = await User.findOne({ _id: req.params.id, role: 'Faculty' }).select('-password');
    if (!faculty) {
        res.status(404);
        throw new Error('Faculty member not found');
    }
    res.status(200).json(faculty);
});

// @desc    Update faculty by ID
// @route   PUT /api/admin/faculty/:id
// @access  Private/Admin
const updateFaculty = asyncHandler(async (req, res) => {
    const faculty = await User.findOne({ _id: req.params.id, role: 'Faculty' });
    if (!faculty) {
        res.status(404);
        throw new Error('Faculty member not found');
    }
    const { name, email, department, phone, office, isActive } = req.body;
    if (name) faculty.name = name;
    if (email) faculty.email = email.toLowerCase();
    if (department !== undefined) faculty.department = department;
    if (phone !== undefined) faculty.phone = phone;
    if (office !== undefined) faculty.office = office;
    if (typeof isActive === 'boolean') faculty.isActive = isActive;
    await faculty.save();
    res.status(200).json({ message: 'Faculty updated successfully' });
});

// @desc    Delete faculty by ID
// @route   DELETE /api/admin/faculty/:id
// @access  Private/Admin
const deleteFaculty = asyncHandler(async (req, res) => {
    const faculty = await User.findOne({ _id: req.params.id, role: 'Faculty' });
    if (!faculty) {
        res.status(404);
        throw new Error('Faculty member not found');
    }
    // Remove this faculty as advisor from all their students
    await User.updateMany({ facultyAdvisor: req.params.id }, { $set: { facultyAdvisor: null } });
    await User.deleteOne({ _id: req.params.id });
    res.status(200).json({ message: 'Faculty deleted successfully' });
});

// @desc    Get unassigned + assigned students for a faculty assignment page
// @route   GET /api/admin/faculty/:id/students
// @access  Private/Admin
const getFacultyStudents = asyncHandler(async (req, res) => {
    const faculty = await User.findOne({ _id: req.params.id, role: 'Faculty' }).select('-password');
    if (!faculty) {
        res.status(404);
        throw new Error('Faculty member not found');
    }
    const [assigned, unassigned] = await Promise.all([
        User.find({ role: 'Student', facultyAdvisor: req.params.id })
            .select('name rollNumber department isActive profilePicture')
            .sort({ name: 1 }),
        User.find({ role: 'Student', facultyAdvisor: null })
            .select('name rollNumber department isActive profilePicture')
            .sort({ name: 1 }),
    ]);
    res.status(200).json({ faculty, assigned, unassigned });
});

// @desc    Bulk assign/unassign students to a faculty
// @route   PUT /api/admin/faculty/:id/assign
// @access  Private/Admin
const assignStudents = asyncHandler(async (req, res) => {
    const { toAssign, toUnassign } = req.body;
    const facultyId = req.params.id;
    if (toAssign?.length > 0) {
        await User.updateMany(
            { _id: { $in: toAssign }, role: 'Student' },
            { $set: { facultyAdvisor: facultyId } }
        );
    }
    if (toUnassign?.length > 0) {
        await User.updateMany(
            { _id: { $in: toUnassign }, role: 'Student' },
            { $set: { facultyAdvisor: null } }
        );
    }
    res.status(200).json({ message: 'Assignments updated successfully' });
});

module.exports = {
    getDashboard,
    getReportsAnalytics,
    getStudents,
    createStudent,
    bulkImportStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
    getFaculty,
    createFaculty,
    bulkImportFaculty,
    getFacultyById,
    updateFaculty,
    deleteFaculty,
    getFacultyStudents,
    assignStudents,
};
