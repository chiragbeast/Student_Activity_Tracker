const express = require('express');
const router = express.Router();
const {
    createDeadline,
    getDeadlines,
    deleteDeadline
} = require('../controllers/deadlineController');
const { protect, role } = require('../middleware/authMiddleware');

// All deadline routes are protected for Faculty and Admin
router.use(protect, role('Faculty', 'Admin'));

router.post('/', createDeadline);
router.get('/', getDeadlines);
router.delete('/:id', deleteDeadline);

module.exports = router;
