const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/adminController');
const { protect, role } = require('../middleware/authMiddleware');

router.get('/dashboard', protect, role('Admin'), getDashboard);
router.get('/reports', protect, role('Admin'), getReportsAnalytics);
router.get('/students', protect, role('Admin'), getStudents);
router.post('/students', protect, role('Admin'), createStudent);
router.post('/students/bulk-import', protect, role('Admin'), bulkImportStudents);
router.get('/students/:id', protect, role('Admin'), getStudentById);
router.put('/students/:id', protect, role('Admin'), updateStudent);
router.delete('/students/:id', protect, role('Admin'), deleteStudent);
router.get('/faculty', protect, role('Admin'), getFaculty);
router.post('/faculty', protect, role('Admin'), createFaculty);
router.post('/faculty/bulk-import', protect, role('Admin'), bulkImportFaculty);
router.get('/faculty/:id', protect, role('Admin'), getFacultyById);
router.put('/faculty/:id', protect, role('Admin'), updateFaculty);
router.delete('/faculty/:id', protect, role('Admin'), deleteFaculty);
router.get('/faculty/:id/students', protect, role('Admin'), getFacultyStudents);
router.put('/faculty/:id/assign', protect, role('Admin'), assignStudents);

module.exports = router;
