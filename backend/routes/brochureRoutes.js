const express = require('express');
const multer = require('multer');
const path = require('path');
const router = express.Router();
const { protect, role } = require('../middleware/authMiddleware');
const { uploadBrochure, getCurrentBrochure } = require('../controllers/brochureController');

const brochureStorage = multer.memoryStorage();

const brochureFileFilter = (req, file, cb) => {
	const allowedExtensions = ['.pdf', '.doc', '.docx'];
	const allowedMimeTypes = [
		'application/pdf',
		'application/msword',
		'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
	];

	const ext = path.extname(file.originalname || '').toLowerCase();
	const hasAllowedExtension = allowedExtensions.includes(ext);
	const hasAllowedMime = allowedMimeTypes.includes(file.mimetype);

	if (hasAllowedExtension && hasAllowedMime) {
		cb(null, true);
		return;
	}

	cb(new Error('Only PDF, DOC, and DOCX files are allowed for brochure upload'), false);
};

const brochureUpload = multer({
	storage: brochureStorage,
	fileFilter: brochureFileFilter,
	limits: {
		fileSize: 10 * 1024 * 1024,
		files: 1,
	},
});

router.get('/current', protect, getCurrentBrochure);
router.post('/upload', protect, role('Admin'), brochureUpload.single('brochure'), uploadBrochure);

module.exports = router;
