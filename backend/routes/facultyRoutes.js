const express = require('express');
const router = express.Router();
const {
    getFacultyStats,
    getAssignedStudents,
    getPendingSubmissions,
    getSubmissionDetails,
    reviewSubmission,
    bulkReviewSubmissions,
    exportStudentsCSV,
    getFacultyProfile,
} = require('../controllers/facultyController');
const { protect, role } = require('../middleware/authMiddleware');

// All routes require Faculty role
router.use(protect, role('Faculty'));

router.get('/stats', getFacultyStats);
router.get('/students', getAssignedStudents);
router.get('/submissions/pending', getPendingSubmissions);
router.post('/submissions/bulk-review', bulkReviewSubmissions);
router.get('/submissions/:id', getSubmissionDetails);
router.post('/submissions/:id/review', reviewSubmission);
router.get('/export', exportStudentsCSV);
router.get('/profile', getFacultyProfile);

module.exports = router;
