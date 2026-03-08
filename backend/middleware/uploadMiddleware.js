const multer = require('multer');
const path = require('path');

// Use memory storage — files are uploaded to Cloudinary, not saved to disk
const storage = multer.memoryStorage();

// File filter: only allow PDF, JPG, JPEG, PNG
const fileFilter = (req, file, cb) => {
    const allowedTypes = /pdf|jpg|jpeg|png/;
    const ext = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mime = allowedTypes.test(file.mimetype);

    if (ext && mime) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, JPEG, and PNG files are allowed'), false);
    }
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024, // 10 MB per file
        files: 5,                    // Max 5 files per request
    },
});

module.exports = upload;
