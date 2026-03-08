const mongoose = require('mongoose');

const submissionSchema = new mongoose.Schema({
    // ── Ownership ──
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student reference is required'],
    },

    // ── Activity Details (FR-2.1, BR-05) ──
    activityName: {
        type: String,
        required: [true, 'Activity name is required'],
        trim: true,
        maxlength: 200,
    },
    activityDate: {
        type: Date,
        default: null,
    },
    activityLevel: {
        type: String,
        enum: ['Institute', 'Department'],
        required: [true, 'Activity level (Institute/Department) is required'],
    },

    // ── Points (FR-6.1, FR-6.2, FR-6.3, FR-6.4) ──
    pointsRequested: {
        type: Number,
        required: [true, 'Requested points are required'],
        min: [0, 'Points cannot be negative'],
    },
    pointsApproved: {
        type: Number,
        default: 0,
        min: 0,
    },

    // ── Supporting Documents (FR-2.2, 3.4.2) ──
    documents: [{
        fileName: { type: String, required: true },
        fileUrl: { type: String, required: true },
        fileType: {
            type: String,
            enum: ['pdf', 'jpg', 'jpeg', 'png'],
        },
        fileSize: { type: Number }, // in bytes, max 1MB per SRS
        cloudinaryId: { type: String, default: '' }, // Cloudinary public_id for deletion
        uploadedAt: { type: Date, default: Date.now },
    }],

    // ── Status & Workflow (FR-2.3, BR-06) ──
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Approved', 'Modified', 'Denied', 'Returned'],
        default: 'Draft',
    },

    // ── Notes ──
    notes: {
        type: String,
        maxlength: 500,
        default: '',
    },

    // ── Faculty Review (FR-3.3, FR-2.6) ──
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },
    reviewedAt: {
        type: Date,
        default: null,
    },
    reviewComments: {
        type: String,
        default: '',
    },


    // ── Semester Tracking (FR-6.7) ──
    academicYear: {
        type: String,
        trim: true,
        default: '', // e.g., "2025-2026"
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        default: null,
    },

    // ── Duplicate Detection (FR-6.5) ──
    eventHash: {
        type: String,
        default: null, // Hash of (activityName + activityDate + student) for dedup
    },

}, {
    timestamps: true, // createdAt = uploadTime, updatedAt
});

// ── Indexes ──
submissionSchema.index({ student: 1, createdAt: -1 });
submissionSchema.index({ student: 1, status: 1 });
submissionSchema.index({ reviewedBy: 1, status: 1 });
submissionSchema.index({ activityLevel: 1 });
submissionSchema.index({ academicYear: 1, semester: 1 });
submissionSchema.index({ eventHash: 1 }, { sparse: true }); // For duplicate detection (FR-6.5)

// ── Virtual: was points modified? ──
submissionSchema.virtual('pointsModified').get(function () {
    return this.status === 'Approved' && this.pointsApproved !== this.pointsRequested;
});

// ── Pre-save: Generate event hash for duplicate detection ──
submissionSchema.pre('save', function () {
    if (this.activityName && this.activityDate && this.student) {
        const dateStr = this.activityDate instanceof Date ? this.activityDate.toISOString().split('T')[0] : '';
        const str = `${this.student}-${this.activityName.toLowerCase().trim()}-${dateStr}`;
        // Simple hash — in production, use crypto
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash |= 0;
        }
        this.eventHash = hash.toString();
    }
});

module.exports = mongoose.model('Submission', submissionSchema);
