const express = require('express');
const router = express.Router();
const {
	loginUser,
	verify2FA,
	resend2FA,
	registerUser,
	getMe,
	updateMe,
	updateMyProfilePicture,
	changePassword,
} = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/login', loginUser);
router.post('/verify-2fa', verify2FA);
router.post('/resend-2fa', resend2FA);
router.post('/register', registerUser);
router.route('/me').get(protect, getMe).put(protect, updateMe);
router.put('/me/picture', protect, upload.single('profilePicture'), updateMyProfilePicture);
router.put('/change-password', protect, changePassword);

module.exports = router;
