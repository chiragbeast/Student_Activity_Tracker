const express = require('express');
const router = express.Router();
const {
	loginUser,
	registerUser,
	getMe,
	updateMe,
	updateMyProfilePicture,
	changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/login', loginUser);
router.post('/register', registerUser);
router.route('/me').get(protect, getMe).put(protect, updateMe);
router.put('/me/picture', protect, upload.single('profilePicture'), updateMyProfilePicture);
router.put('/change-password', protect, changePassword);

module.exports = router;
