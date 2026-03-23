const asyncHandler = require('express-async-handler');
const path = require('path');
const cloudinary = require('../config/cloudinary');
const Brochure = require('../models/Brochure');

const ALLOWED_BROCHURE_MIME_TYPES = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

const uploadBrochure = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload a brochure file');
    }

    if (!ALLOWED_BROCHURE_MIME_TYPES.includes(req.file.mimetype)) {
        res.status(400);
        throw new Error('Only PDF, DOC, and DOCX files are allowed for brochure upload');
    }

    const existing = await Brochure.findOne().sort({ updatedAt: -1 });

    if (existing?.brochurePublicId) {
        try {
            await cloudinary.uploader.destroy(existing.brochurePublicId, {
                resource_type: 'raw',
                invalidate: true,
            });
        } catch (error) {
            console.error('Failed to delete old brochure from Cloudinary:', error.message);
        }
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;
    const extension = path.extname(req.file.originalname || '').toLowerCase();
    const safeExtension = ['.pdf', '.doc', '.docx'].includes(extension) ? extension : '';

    const uploaded = await cloudinary.uploader.upload(dataUri, {
        folder: 'sapt/brochures',
        resource_type: 'raw',
        public_id: `points_brochure_${Date.now()}${safeExtension}`,
        overwrite: true,
        invalidate: true,
    });

    const brochure = await Brochure.findOneAndUpdate(
        {},
        {
            brochureUrl: uploaded.secure_url,
            brochurePublicId: uploaded.public_id,
            fileName: req.file.originalname,
            fileMimeType: req.file.mimetype,
            fileSize: req.file.size,
            uploadedBy: req.user._id,
        },
        {
            upsert: true,
            new: true,
            setDefaultsOnInsert: true,
        }
    );

    res.status(200).json({
        message: 'Brochure uploaded successfully',
        brochure,
    });
});

const getCurrentBrochure = asyncHandler(async (req, res) => {
    const brochure = await Brochure.findOne().sort({ updatedAt: -1 }).populate('uploadedBy', 'name email');

    if (!brochure) {
        return res.status(200).json({ brochure: null });
    }

    return res.status(200).json({ brochure });
});

module.exports = {
    uploadBrochure,
    getCurrentBrochure,
};
