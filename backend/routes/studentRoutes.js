const express = require('express');
const router = express.Router();
const { getDashboard, getProfile } = require('../controllers/studentController');
const { protect, role } = require('../middleware/authMiddleware');

router.route('/dashboard').get(protect, role('Student'), getDashboard);
router.route('/profile').get(protect, role('Student'), getProfile);

module.exports = router;
