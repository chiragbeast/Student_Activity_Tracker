const mongoose = require('mongoose');

const systemConfigSchema = new mongoose.Schema({
    // ── Config Key (unique identifier) ──
    key: {
        type: String,
        required: [true, 'Config key is required'],
        unique: true,
        trim: true,
    },

    // ── Activity Categories (FR-8.1) ──
    // key: 'activity_categories'
    // value: { categories: [{ name, description, pointRange }] }

    // ── Point Limits (FR-8.2, FR-8.3, FP-6.10) ──
    // key: 'point_limits'
    // value: { institute: { min, max }, department: { min, max } }

    // ── Submission Settings (FR-8.6) ──
    // key: 'upload_settings'
    // value: { maxFileSize, allowedTypes, maxFilesPerSubmission }

    // ── Approval Workflow (FR-8.5) ──
    // key: 'approval_settings'
    // value: { requireCommentOnReject, requireCommentOnModify, autoApproveThreshold }

    // ── Academic Calendar (FR-8.4) ──
    // key: 'academic_calendar'
    // value: { currentYear, currentSemester, semesterDates }

    // ── Notification Templates (FR-8.7) ──
    // key: 'notification_templates'
    // value: { submission_approved: { subject, body }, ... }

    // ── Graduation Requirements (FR-2.9) ──
    // key: 'graduation_requirements'
    // value: { institutePoints: 40, departmentPoints: 40, totalRequired: 80 }

    // ── Flexible Value Store ──
    value: {
        type: mongoose.Schema.Types.Mixed,
        required: [true, 'Config value is required'],
    },

    // ── Metadata ──
    description: {
        type: String,
        default: '',
    },
    updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null,
    },

}, {
    timestamps: true,
});

module.exports = mongoose.model('SystemConfig', systemConfigSchema);
