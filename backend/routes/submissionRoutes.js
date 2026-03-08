const express = require('express');
const router = express.Router();
const {
    createSubmission,
    getMySubmissions,
    getSubmissionById,
    updateSubmission,
    withdrawSubmission,
    downloadReceipt,
    deleteDocument,
} = require('../controllers/submissionController');
const { protect, role } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

// Protect all routes and restrict to 'Student' role
router.use(protect, role('Student'));

router.route('/')
    .post(upload.array('files', 5), createSubmission)
    .get(getMySubmissions);

router.route('/:id')
    .get(getSubmissionById)
    .put(upload.array('files', 5), updateSubmission)
    .delete(withdrawSubmission);

router.get('/:id/receipt', downloadReceipt);

// Delete a specific document from a submission
router.delete('/:id/documents/:docId', deleteDocument);

module.exports = router;
