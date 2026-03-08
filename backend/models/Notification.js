const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    // ── Target User ──
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'User reference is required'],
    },

    // ── Notification Content (FR-5.1, FR-5.2) ──
    type: {
        type: String,
        enum: [
            'submission_approved',    // FR-2.5: Status change
            'submission_denied',      // FR-2.5: Status change
            'submission_modified',    // FR-2.5: Points modified
            'submission_returned',    // FR-3.5: Returned for corrections
            'deadline_approaching',   // FR-5.5: Deadline reminder
            'new_submission',         // FR-5.6: For FAs — new pending review
            'system_announcement',    // FR-4.10: Admin announcements
            'account_update',         // Account-related notifications
            'info',                   // General info
        ],
        required: [true, 'Notification type is required'],
    },
    title: {
        type: String,
        required: [true, 'Notification title is required'],
        trim: true,
        maxlength: 200,
    },
    message: {
        type: String,
        required: [true, 'Notification message is required'],
        maxlength: 500,
    },

    // ── Related Entity ──
    relatedSubmission: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Submission',
        default: null,
    },

    // ── Status (FR-5.9) ──
    read: {
        type: Boolean,
        default: false,
    },
    readAt: {
        type: Date,
        default: null,
    },

    // ── Delivery Channels (FR-5.2, FR-5.7) ──
    emailSent: {
        type: Boolean,
        default: false,
    },
    emailSentAt: {
        type: Date,
        default: null,
    },

}, {
    timestamps: true, // createdAt = notification time
});

// ── Indexes ──
notificationSchema.index({ user: 1, createdAt: -1 });
notificationSchema.index({ user: 1, read: 1 });
notificationSchema.index({ type: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
