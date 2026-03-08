const asyncHandler = require('express-async-handler');
const Submission = require('../models/Submission');
const ActivityPoints = require('../models/ActivityPoints');
const cloudinary = require('../config/cloudinary');
const { Readable } = require('stream');

// ── Helper: Upload a buffer to Cloudinary ──
function uploadToCloudinary(fileBuffer, options = {}) {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'student-activity-docs',
                resource_type: 'auto',
                ...options,
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        );
        const readable = Readable.from(fileBuffer);
        readable.pipe(uploadStream);
    });
}

// ── Helper: Build documents array from multer files ──
async function processUploadedFiles(files) {
    if (!files || files.length === 0) return [];

    const docs = [];
    for (const file of files) {
        const result = await uploadToCloudinary(file.buffer, {
            public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '')}`,
        });
        const ext = file.originalname.split('.').pop().toLowerCase();
        docs.push({
            fileName: file.originalname,
            fileUrl: result.secure_url,
            fileType: ext,
            fileSize: file.size,
            cloudinaryId: result.public_id,
        });
    }
    return docs;
}

// @desc    Create new submission
// @route   POST /api/submissions
// @access  Private/Student
const createSubmission = asyncHandler(async (req, res) => {
    const {
        activityName,
        activityDate,
        activityLevel,
        pointsRequested,
        notes,
        academicYear,
        semester,
        status, // allow saving as Draft or Pending
    } = req.body;

    if (!activityName || !activityLevel || pointsRequested === undefined) {
        res.status(400);
        throw new Error('Please provide at least activityName, activityLevel, and pointsRequested');
    }

    // Upload files to Cloudinary
    const documents = await processUploadedFiles(req.files);

    const submissionData = {
        student: req.user._id,
        activityName,
        activityDate,
        activityLevel,
        pointsRequested,
        documents,
        notes,
        academicYear,
        semester,
        status: status === 'Pending' ? 'Pending' : 'Draft',
    };

    const submission = await Submission.create(submissionData);

    res.status(201).json(submission);
});

// @desc    Get all submissions for logged in student
// @route   GET /api/submissions
// @access  Private/Student
const getMySubmissions = asyncHandler(async (req, res) => {
    const submissions = await Submission.find({ student: req.user._id })
        .sort({ createdAt: -1 });
    res.status(200).json(submissions);
});

// @desc    Get specific submission details
// @route   GET /api/submissions/:id
// @access  Private/Student
const getSubmissionById = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate('reviewedBy', 'name email');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    // Check ownership
    if (submission.student.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to view this submission');
    }

    res.status(200).json(submission);
});

// @desc    Update submission (only if Draft, Returned, or Modified)
// @route   PUT /api/submissions/:id
// @access  Private/Student
const updateSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    // Check ownership
    if (submission.student.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to update this submission');
    }

    // Only allow update if status is Draft, Returned, or Modified
    if (!['Draft', 'Returned', 'Modified'].includes(submission.status)) {
        res.status(400);
        throw new Error('Cannot edit a submission that is Pending, Approved, or Denied');
    }

    // Update text fields
    const updatableFields = [
        'activityName', 'activityDate', 'activityLevel', 'pointsRequested',
        'notes', 'academicYear', 'semester', 'status'
    ];

    updatableFields.forEach(field => {
        if (req.body[field] !== undefined) {
            submission[field] = req.body[field];
        }
    });

    // Upload and append any new files
    const newDocs = await processUploadedFiles(req.files);
    if (newDocs.length > 0) {
        submission.documents.push(...newDocs);
    }

    // If student updates a Returned or Modified submission, reset to Pending (or Draft if they choose)
    if (req.body.status !== 'Draft') {
        submission.status = 'Pending';
    }

    const updatedSubmission = await submission.save();

    res.status(200).json(updatedSubmission);
});

// @desc    Delete a specific document from a submission
// @route   DELETE /api/submissions/:id/documents/:docId
// @access  Private/Student
const deleteDocument = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    if (submission.student.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized');
    }

    if (!['Draft', 'Returned', 'Modified'].includes(submission.status)) {
        res.status(400);
        throw new Error('Cannot modify documents on this submission');
    }

    const doc = submission.documents.id(req.params.docId);
    if (!doc) {
        res.status(404);
        throw new Error('Document not found');
    }

    // Delete from Cloudinary if we have the public_id
    if (doc.cloudinaryId) {
        try {
            await cloudinary.uploader.destroy(doc.cloudinaryId);
        } catch (err) {
            console.error('Cloudinary delete error:', err.message);
        }
    }

    // Remove from documents array
    submission.documents.pull(req.params.docId);
    await submission.save();

    res.status(200).json({ message: 'Document removed', documents: submission.documents });
});

// @desc    Withdraw/Delete a draft submission
// @route   DELETE /api/submissions/:id
// @access  Private/Student
const withdrawSubmission = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id);

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    // Check ownership
    if (submission.student.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to delete this submission');
    }

    // Can only withdraw if Draft or Pending
    if (!['Draft', 'Pending', 'Returned'].includes(submission.status)) {
        res.status(400);
        throw new Error(`Cannot withdraw a submission with status: ${submission.status}`);
    }

    // Delete all documents from Cloudinary
    for (const doc of submission.documents) {
        if (doc.cloudinaryId) {
            try {
                await cloudinary.uploader.destroy(doc.cloudinaryId);
            } catch (err) {
                console.error('Cloudinary delete error:', err.message);
            }
        }
    }

    await submission.deleteOne();
    res.status(200).json({ message: 'Submission withdrawn/removed' });
});

// @desc    Generate a receipt of the submission
// @route   GET /api/submissions/:id/receipt
// @access  Private/Student
const downloadReceipt = asyncHandler(async (req, res) => {
    const submission = await Submission.findById(req.params.id)
        .populate('student', 'name rollNumber department');

    if (!submission) {
        res.status(404);
        throw new Error('Submission not found');
    }

    if (submission.student._id.toString() !== req.user._id.toString()) {
        res.status(401);
        throw new Error('Not authorized to download receipt for this submission');
    }

    res.status(200).json({
        receiptId: `REC-${submission._id.toString().substring(0, 8).toUpperCase()}`,
        generatedAt: new Date(),
        student: {
            name: submission.student.name,
            rollNumber: submission.student.rollNumber,
            department: submission.student.department,
        },
        submission: {
            activityName: submission.activityName,
            activityDate: submission.activityDate,
            activityLevel: submission.activityLevel,
            pointsRequested: submission.pointsRequested,
            pointsApproved: submission.pointsApproved,
            status: submission.status,
            documentsAttached: submission.documents.length
        }
    });
});

module.exports = {
    createSubmission,
    getMySubmissions,
    getSubmissionById,
    updateSubmission,
    withdrawSubmission,
    downloadReceipt,
    deleteDocument,
};
