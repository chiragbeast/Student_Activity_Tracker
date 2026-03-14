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
            .select('name email role createdAt lastLogin isActive')
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
                totalPoints: { $ifNull: [{ $arrayElemAt: ['$points.totalPoints', 0] }, 0] },
            },
        },
        {
            $project: {
                name: 1, email: 1, rollNumber: 1, department: 1,
                isActive: 1, lastLogin: 1, createdAt: 1, totalPoints: 1,
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
    const { name, email, rollNumber, department, phone } = req.body;

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

// @desc    Get single student by ID (with faculty list for dropdown)
// @route   GET /api/admin/students/:id
// @access  Private/Admin
const getStudentById = asyncHandler(async (req, res) => {
    const student = await User.findOne({ _id: req.params.id, role: 'Student' })
        .select('-password')
        .populate('facultyAdvisor', 'name department');
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }
    const facultyList = await User.find({ role: 'Faculty' })
        .select('name department')
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
    const { name, rollNumber, department, phone, isActive, facultyAdvisorId } = req.body;
    if (name) student.name = name;
    if (rollNumber !== undefined) student.rollNumber = rollNumber;
    if (department !== undefined) student.department = department;
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
        { $addFields: { assignedStudents: { $size: '$assignedStudentsList' } } },
        {
            $project: {
                name: 1, email: 1, department: 1, phone: 1, rollNumber: 1,
                isActive: 1, lastLogin: 1, createdAt: 1, assignedStudents: 1,
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
    const { name, email, department, phone, employeeId } = req.body;
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
        rollNumber: employeeId,
    });
    res.status(201).json({
        _id: faculty._id,
        name: faculty.name,
        email: faculty.email,
        department: faculty.department,
        isActive: faculty.isActive,
        assignedStudents: 0,
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
    const { name, email, department, phone, isActive } = req.body;
    if (name) faculty.name = name;
    if (email) faculty.email = email.toLowerCase();
    if (department !== undefined) faculty.department = department;
    if (phone !== undefined) faculty.phone = phone;
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
            .select('name rollNumber department isActive')
            .sort({ name: 1 }),
        User.find({ role: 'Student', facultyAdvisor: null })
            .select('name rollNumber department isActive')
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

module.exports = { getDashboard, getStudents, createStudent, getStudentById, updateStudent, deleteStudent, getFaculty, createFaculty, getFacultyById, updateFaculty, deleteFaculty, getFacultyStudents, assignStudents };
