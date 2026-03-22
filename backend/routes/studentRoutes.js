const express = require('express');
const router = express.Router();
const { getDashboard, getProfile, updateProfile, updateProfilePicture } = require('../controllers/studentController');
const { protect, role } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.route('/dashboard').get(protect, role('Student'), getDashboard);
router.route('/profile')
	.get(protect, role('Student'), getProfile)
	.put(protect, role('Student'), updateProfile);
router.route('/profile/picture')
	.put(protect, role('Student'), upload.single('profilePicture'), updateProfilePicture);

module.exports = router;
