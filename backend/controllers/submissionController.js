const crypto = require('crypto');
const pdfParse = require('pdf-parse');
const Tesseract = require('tesseract.js');
const { Jimp } = require('jimp');
const asyncHandler = require('express-async-handler');
const Submission = require('../models/Submission');
const User = require('../models/User');
const Notification = require('../models/Notification');
const ActivityPoints = require('../models/ActivityPoints');
const { sendEmail } = require('../utils/mailer');
const { Readable } = require('stream');
const socketUtils = require('../utils/socket');
const cloudinary = require('../config/cloudinary');
// ── Helper: Normalize activity name for comparison ──
const normalizeName = (name) => name.toLowerCase().replace(/[^a-z0-9]/g, '').replace(/0+(\d)/g, '$1');

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

// ── Helper: Calculate Hamming distance mathematically for binary strings ──
function calculateHammingDistance(str1, str2) {
    if (!str1 || !str2) return 64;
    // Pad both to 64 chars to guard against leading-zero truncation in base-2 output
    const a = str1.padStart(64, '0');
    const b = str2.padStart(64, '0');
    let distance = 0;
    for (let i = 0; i < 64; i++) {
        if (a[i] !== b[i]) distance++;
    }
    return distance; // 0-64
}

// ── Helper: Autocrop near-white borders from an image for crop-resistant pHash ──
// Certificates typically have white/light borders. Cropping them normalises both
// the original and any slightly-cropped variant to the same core content region,
// so dHash produces a near-identical fingerprint for both.
function autoCropWhitespace(image, threshold = 230) {
    const { width, height } = image.bitmap;
    let minX = width, maxX = 0, minY = height, maxY = 0;

    // Sample every few pixels for performance on large images
    const step = Math.max(1, Math.floor(Math.min(width, height) / 300));
    image.scan(0, 0, width, height, (x, y, idx) => {
        if (x % step !== 0 || y % step !== 0) return;
        const r = image.bitmap.data[idx];
        const g = image.bitmap.data[idx + 1];
        const b = image.bitmap.data[idx + 2];
        if ((r + g + b) / 3 < threshold) {
            if (x < minX) minX = x;
            if (x > maxX) maxX = x;
            if (y < minY) minY = y;
            if (y > maxY) maxY = y;
        }
    });

    if (maxX > minX && maxY > minY) {
        const pad = Math.max(5, step);
        const x = Math.max(0, minX - pad);
        const y = Math.max(0, minY - pad);
        const w = Math.min(width - x, maxX - minX + 2 * pad + 1);
        const h = Math.min(height - y, maxY - minY + 2 * pad + 1);
        // Only crop if we found a meaningful border (>3% on at least one axis)
        if (w < width * 0.97 || h < height * 0.97) {
            image.crop({ x, y, w, h });
        }
    }
    return image;
}

// ── Helper: Calculate Levenshtein textual distance mathematically ──
function calculateLevenshteinDistance(a, b) {
    if (!a || !b) return 1000;
    if (a.length === 0) return b.length;
    if (b.length === 0) return a.length;
    var matrix = [];
    for (var i = 0; i <= b.length; i++) { matrix[i] = [i]; }
    for (var j = 0; j <= a.length; j++) { matrix[0][j] = j; }
    for (var i = 1; i <= b.length; i++) {
        for (var j = 1; j <= a.length; j++) {
            if (b.charAt(i-1) === a.charAt(j-1)) {
                matrix[i][j] = matrix[i-1][j-1];
            } else {
                matrix[i][j] = Math.min(matrix[i-1][j-1] + 1, Math.min(matrix[i][j-1] + 1, matrix[i-1][j] + 1));
            }
        }
    }
    return matrix[b.length][a.length];
}

// ── Helper: Extract pure text from buffer ──
async function extractTextFromFile(buffer, fileType) {
    try {
        let text = '';
        if (fileType === 'pdf') {
            const data = await pdfParse(buffer);
            text = data.text || '';
        } else if (['jpg', 'jpeg', 'png'].includes(fileType)) {
            const result = await Tesseract.recognize(buffer, 'eng');
            text = result.data.text || '';
        }
        
        if (!text) return null;
        // Normalize: lowercase, strip all non-alphanumeric chars
        const normalized = text.toLowerCase().replace(/[^a-z0-9]/g, '');
        if (normalized.length < 10) return null; // Too short to be reliable

        return normalized.substring(0, 500); // Store up to 500 chars natively for Levenshtein processing
    } catch (err) {
        console.error('Text extraction failed:', err);
        return null; // Gracefully fail parsing rather than crashing upload
    }
}

// ── Helper: Build documents array from multer files ──
async function processUploadedFiles(files, res) {
    if (!files || files.length === 0) return [];

    const docs = [];
    for (const file of files) {
        // Calculate SHA-256 Hash of the file buffer
        const hash = crypto.createHash('sha256').update(file.buffer).digest('hex');

        // Check for duplicates globally across submissions
        const existingDoc = await Submission.findOne({ 'documents.fileHash': hash });
        const exactMemMatch = docs.find(d => d.fileHash === hash);
        if ((existingDoc || exactMemMatch) && res) {
            res.status(400);
            throw new Error(`Duplicate Document Detected: The file ${file.originalname} has already been submitted.`);
        }

        const ext = file.originalname.split('.').pop().toLowerCase();
        
        // Check for fundamentally identical text content via OCR/PDF Parsing utilizing Levenshtein limits
        const contentHash = await extractTextFromFile(file.buffer, ext);
        console.log(`\n🔍 [OCR] File: ${file.originalname} | Length: ${contentHash ? contentHash.length : 'NULL'} | Text: ${(contentHash || '').substring(0, 30)}...`);
        
        if (contentHash) {
            for (const localDoc of docs) {
                if (localDoc.contentHash) {
                    const lDist = calculateLevenshteinDistance(contentHash, localDoc.contentHash);
                    console.log(`   ► [In-Memory Text Check] Distance: ${lDist} | MaxLen: ${Math.max(contentHash.length, localDoc.contentHash.length)}`);
                    if (lDist < Math.max(contentHash.length, localDoc.contentHash.length) * 0.20) {
                        if (res) res.status(400);
                        throw new Error(`Duplicate Content Detected: A fundamentally identical text document to ${file.originalname} is attached in this batch.`);
                    }
                }
            }

            const existingContentDocs = await Submission.find(
                { 'documents.contentHash': { $ne: null } },
                'documents.contentHash documents.fileName'
            );
            
            for (const sub of existingContentDocs) {
                for (const doc of sub.documents) {
                    if (doc.contentHash) {
                        const distance = calculateLevenshteinDistance(contentHash, doc.contentHash);
                        const maxLength = Math.max(contentHash.length, doc.contentHash.length);
                        console.log(`   ► [DB Text Check] vs ${doc.fileName} | Distance: ${distance} | Threshold: ${maxLength * 0.20}`);
                        if (distance < maxLength * 0.20) {
                            if (res) res.status(400);
                            throw new Error(`Duplicate Content Detected: A fundamentally identical document to ${file.originalname} has already been submitted.`);
                        }
                    }
                }
            }
        }

        // Perceptual Visual Hashing (dHash) — crop-resistant via whitespace normalisation
        // autoCropWhitespace removes light borders so original + border-cropped variant
        // both resolve to the same core content before the 9×8 dHash is computed.
        let pHash = null;
        if (['jpg', 'jpeg', 'png'].includes(ext)) {
            try {
                const image = await Jimp.read(file.buffer);
                autoCropWhitespace(image); // normalise: strip whitespace borders
                pHash = image.hash(2).padStart(64, '0'); // always 64-char binary string
                console.log(`🎨 [pHash] File: ${file.originalname} | Result: ${pHash}`);
            } catch (err) {
                console.error("pHash/Jimp Image Buffer processing failed", err.message);
            }
        }

        if (pHash) {
            for (const localDoc of docs) {
                if (localDoc.pHash) {
                    const mDist = calculateHammingDistance(pHash, localDoc.pHash);
                    console.log(`   ► [In-Memory pHash Check] Distance: ${mDist}`);
                    if (mDist <= 12) {
                        if (res) res.status(400);
                        throw new Error(`Duplicate Visual Detected: Image corresponding to ${file.originalname} is attached identically in this batch.`);
                    }
                }
            }

            const existingDocs = await Submission.find(
                { 'documents.pHash': { $ne: null } },
                'documents.pHash documents.fileName'
            );
            
            for (const sub of existingDocs) {
                for (const doc of sub.documents) {
                    if (doc.pHash) {
                        const distance = calculateHammingDistance(pHash, doc.pHash);
                        console.log(`   ► [DB pHash Check] vs ${doc.fileName} | Distance: ${distance}`);
                        if (distance <= 12) {
                            if (res) res.status(400);
                            throw new Error(`Duplicate Visual Detected: An identical or slightly altered image corresponding to ${file.originalname} has already been uploaded.`);
                        }
                    }
                }
            }
        }

        const result = await uploadToCloudinary(file.buffer, {
            public_id: `${Date.now()}-${file.originalname.replace(/\.[^/.]+$/, '').trim()}`,
        });
        docs.push({
            fileName: file.originalname,
            fileUrl: result.secure_url,
            fileType: ext,
            fileSize: file.size,
            fileHash: hash,
            contentHash: contentHash,
            pHash: pHash,
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

    // ── Check for duplicates ──
    const normalizedNew = normalizeName(activityName);
    const existingSubmissions = await Submission.find({ student: req.user._id });
    const isDuplicate = existingSubmissions.some(sub => normalizeName(sub.activityName) === normalizedNew);

    if (isDuplicate) {
        res.status(400);
        throw new Error(`You have already submitted an activity with the name or similar to "${activityName}". Duplicate submissions are not allowed.`);
    }

    // Upload files to Cloudinary
    const documents = await processUploadedFiles(req.files, res);

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

    if (status === 'Pending') {
        const student = await User.findById(req.user._id);
        if (student && student.facultyAdvisor) {
            const notif = await Notification.create({
                user: student.facultyAdvisor,
                type: 'new_submission',
                title: 'New Submission for Review',
                message: `${student.name} has submitted a new activity: ${activityName}`,
                sender: student.name,
                senderRole: 'Student',
                relatedSubmission: submission._id,
            });

            // Emit live notification
            socketUtils.sendNotification(student.facultyAdvisor, notif);

            const facultyAdvisor = await User.findById(student.facultyAdvisor);
            if (facultyAdvisor && facultyAdvisor.emailNotifications) {
                const html = `
                <div style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;line-height:1.6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 10px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                                    <tr>
                                        <td style="padding:30px 40px;background-color:#2563eb;color:#ffffff;">
                                            <h1 style="margin:0;font-size:24px;font-weight:700;">New Submission for Review</h1>
                                            <p style="margin:8px 0 0 0;font-size:16px;opacity:0.9;">Student Activity Points Tracker</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:40px;">
                                            <p style="margin:0 0 20px 0;font-size:16px;">Dear ${facultyAdvisor.name},</p>
                                            <p style="margin:0 0 25px 0;font-size:16px;">A student assigned to you has submitted a new activity for review. Please find the details below:</p>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:30px;">
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;width:140px;">Student Name:</td>
                                                    <td style="padding-bottom:12px;">${student.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Roll Number:</td>
                                                    <td style="padding-bottom:12px;">${student.rollNumber || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Activity Name:</td>
                                                    <td style="padding-bottom:12px;">${activityName}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Points Requested:</td>
                                                    <td style="padding-bottom:12px;">${pointsRequested}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight:600;">Semester:</td>
                                                    <td>${student.semester || 'N/A'} (AY: ${student.academicYear || 'N/A'})</td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 20px 0;font-size:16px;">You can review this submission and provide your decision by logging into the SAPT Faculty Dashboard.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                            <p style="margin:0;font-size:14px;color:#64748b;">&copy; ${new Date().getFullYear()} Student Activity Points Tracker (SAPT)</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>`;

                await sendEmail({
                    to: facultyAdvisor.email,
                    subject: `SAPT: New Activity Submission for Review - ${student.name}`,
                    text: `${student.name} has submitted a new activity "${activityName}" for review in the SAPT system.`,
                    html,
                });
            }
        }
    }

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

    // ── Check for duplicates if name changed ──
    if (req.body.activityName) {
        const normalizedNew = normalizeName(req.body.activityName);
        const others = await Submission.find({ 
            student: req.user._id, 
            _id: { $ne: submission._id } 
        });
        const isDuplicate = others.some(sub => normalizeName(sub.activityName) === normalizedNew);

        if (isDuplicate) {
            res.status(400);
            throw new Error(`You already have another submission with the name or similar to "${req.body.activityName}".`);
        }
    }

    // Upload and append any new files
    const newDocs = await processUploadedFiles(req.files, res);
    if (newDocs.length > 0) {
        submission.documents.push(...newDocs);
    }

    // If student updates a Returned or Modified submission, reset to Pending (or Draft if they choose)
    if (req.body.status !== 'Draft') {
        submission.status = 'Pending';
    }

    const updatedSubmission = await submission.save();

    if (submission.status === 'Pending') {
        const student = await User.findById(req.user._id);
        if (student && student.facultyAdvisor) {
            const notif = await Notification.create({
                user: student.facultyAdvisor,
                type: 'new_submission',
                title: 'Submission Resubmitted',
                message: `${student.name} has updated/resubmitted: ${submission.activityName}`,
                sender: student.name,
                senderRole: 'Student',
                relatedSubmission: updatedSubmission._id,
            });

            // Emit live notification
            socketUtils.sendNotification(student.facultyAdvisor, notif);

            const facultyAdvisor = await User.findById(student.facultyAdvisor);
            if (facultyAdvisor && facultyAdvisor.emailNotifications) {
                const html = `
                <div style="margin:0;padding:0;background-color:#f8fafc;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;color:#1e293b;line-height:1.6;">
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f8fafc;padding:40px 10px;">
                        <tr>
                            <td align="center">
                                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;background-color:#ffffff;border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);">
                                    <tr>
                                        <td style="padding:30px 40px;background-color:#0f172a;color:#ffffff;">
                                            <h1 style="margin:0;font-size:24px;font-weight:700;">Submission Updated</h1>
                                            <p style="margin:8px 0 0 0;font-size:16px;opacity:0.9;">Student Activity Points Tracker</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:40px;">
                                            <p style="margin:0 0 20px 0;font-size:16px;">Dear ${facultyAdvisor.name},</p>
                                            <p style="margin:0 0 25px 0;font-size:16px;">A student assigned to you has updated and <strong>resubmitted</strong> an activity that was previously reviewed or held. Please find the updated details below:</p>
                                            
                                            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color:#f1f5f9;border-radius:8px;padding:20px;margin-bottom:30px;">
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;width:140px;">Student Name:</td>
                                                    <td style="padding-bottom:12px;">${student.name}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Roll Number:</td>
                                                    <td style="padding-bottom:12px;">${student.rollNumber || 'N/A'}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Activity Name:</td>
                                                    <td style="padding-bottom:12px;">${submission.activityName}</td>
                                                </tr>
                                                <tr>
                                                    <td style="padding-bottom:12px;font-weight:600;">Points Requested:</td>
                                                    <td style="padding-bottom:12px;">${submission.pointsRequested}</td>
                                                </tr>
                                                <tr>
                                                    <td style="font-weight:600;">Semester:</td>
                                                    <td>${student.semester || 'N/A'} (AY: ${student.academicYear || 'N/A'})</td>
                                                </tr>
                                            </table>

                                            <p style="margin:0 0 20px 0;font-size:16px;">The student may have made changes based on your previous feedback. You can review the updated submission in your dashboard.</p>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style="padding:20px 40px;background-color:#f8fafc;border-top:1px solid #e2e8f0;text-align:center;">
                                            <p style="margin:0;font-size:14px;color:#64748b;">&copy; ${new Date().getFullYear()} Student Activity Points Tracker (SAPT)</p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </div>`;

                await sendEmail({
                    to: facultyAdvisor.email,
                    subject: `SAPT Alert: Submission Resubmitted - ${student.name}`,
                    text: `${student.name} has resubmitted the activity "${submission.activityName}" for your review.`,
                    html,
                });
            }
        }
    }

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

// @desc    Export logged-in student's submissions as Excel
// @route   GET /api/submissions/export-excel
// @access  Private/Student
const exportMySubmissionsExcel = asyncHandler(async (req, res) => {
    const ExcelJS = require('exceljs');

    const student = await User.findById(req.user._id).select('name email rollNumber department');
    if (!student) {
        res.status(404);
        throw new Error('Student not found');
    }

    const pointsRecord = await ActivityPoints.findOne({ student: req.user._id });
    const pts = pointsRecord || { institutePoints: 0, departmentPoints: 0, totalPoints: 0 };

    const submissions = await Submission.find({ student: req.user._id }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('My Submissions');

    const headerStyle = {
        font: { bold: true, size: 14 },
        alignment: { horizontal: 'center' },
    };

    sheet.mergeCells('A1:E1');
    sheet.getCell('A1').value = 'Student Activity Points Report';
    sheet.getCell('A1').style = headerStyle;

    sheet.addRow([]);
    sheet.addRow(['Student Information']);
    sheet.getRow(3).font = { bold: true };
    sheet.addRow(['Name', student.name]);
    sheet.addRow(['Roll Number', student.rollNumber || 'N/A']);
    sheet.addRow(['Department', student.department || 'N/A']);
    sheet.addRow(['Email', student.email]);
    sheet.addRow([]);

    sheet.addRow(['Points Summary']);
    sheet.getRow(9).font = { bold: true };
    sheet.addRow(['Institute Points', pts.institutePoints]);
    sheet.addRow(['Department Points', pts.departmentPoints]);
    sheet.addRow(['Total Cumulative Points', pts.totalPoints]);
    sheet.getRow(12).font = { bold: true, color: { argb: 'FF000000' } };
    sheet.addRow([]);

    sheet.addRow(['Submission History']);
    sheet.getRow(14).font = { bold: true };
    sheet.addRow(['Activity', 'Level', 'Points', 'Status', 'Date']);
    sheet.getRow(15).font = { bold: true };

    submissions.forEach((sub) => {
        const ptsValue = sub.status === 'Approved' ? sub.pointsApproved : sub.pointsRequested;
        sheet.addRow([
            sub.activityName || 'Unknown Activity',
            sub.activityLevel || 'N/A',
            ptsValue != null ? ptsValue : 0,
            sub.status || 'Pending',
            sub.createdAt ? new Date(sub.createdAt).toLocaleDateString() : 'N/A',
        ]);
    });

    sheet.getColumn(1).width = 40;
    sheet.getColumn(2).width = 15;
    sheet.getColumn(3).width = 10;
    sheet.getColumn(4).width = 15;
    sheet.getColumn(5).width = 15;

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader(
        'Content-Disposition',
        `attachment; filename=My_Submissions_${student.rollNumber || student.name.replace(/\s+/g, '_')}.xlsx`
    );

    await workbook.xlsx.write(res);
    res.end();
});

// @desc    Check if activity name is a duplicate (Real-time check)
// @route   POST /api/submissions/check-duplicate
// @access  Private/Student
const checkDuplicateActivity = asyncHandler(async (req, res) => {
    const { activityName, submissionId } = req.body;

    if (!activityName) {
        return res.json({ isDuplicate: false });
    }

    const normalizedNew = normalizeName(activityName);
    const query = { student: req.user._id };
    if (submissionId) {
        query._id = { $ne: submissionId };
    }

    const existing = await Submission.find(query);
    const duplicate = existing.find(sub => normalizeName(sub.activityName) === normalizedNew);

    if (duplicate) {
        return res.json({
            isDuplicate: true,
            message: `A similar activity ("${duplicate.activityName}") has been previously submitted. This will not be allowed.`,
        });
    }

    res.json({ isDuplicate: false });
});

module.exports = {
    createSubmission,
    getMySubmissions,
    getSubmissionById,
    updateSubmission,
    withdrawSubmission,
    downloadReceipt,
    deleteDocument,
    exportMySubmissionsExcel,
    checkDuplicateActivity, // Exported
};
