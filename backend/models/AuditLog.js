const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
    // ── Who (NFR-2.6) ──
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    userRole: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'],
        required: true,
    },

    // ── What ──
    action: {
        type: String,
        required: [true, 'Action is required'],
        enum: [
            // Auth actions
            'LOGIN', 'LOGOUT', 'LOGIN_FAILED', 'PASSWORD_CHANGE', 'PASSWORD_RESET',
            // Submission actions
            'SUBMISSION_CREATE', 'SUBMISSION_UPDATE', 'SUBMISSION_DELETE',
            'SUBMISSION_SUBMIT', 'SUBMISSION_WITHDRAW',
            // Review actions
            'SUBMISSION_APPROVE', 'SUBMISSION_DENY', 'SUBMISSION_MODIFY',
            'SUBMISSION_RETURN',
            // Admin actions
            'USER_CREATE', 'USER_UPDATE', 'USER_DEACTIVATE', 'USER_REACTIVATE',
            'ASSIGN_FA', 'REASSIGN_FA',
            'CONFIG_UPDATE', 'DEADLINE_CREATE', 'DEADLINE_UPDATE',
            'BULK_IMPORT',
            // System
            'SYSTEM_BACKUP', 'SYSTEM_RESTORE',
        ],
    },
    description: {
        type: String,
        default: '',
        maxlength: 500,
    },

    // ── On What ──
    targetModel: {
        type: String,
        enum: ['User', 'Submission', 'Notification', 'Deadline', 'SystemConfig', null],
        default: null,
    },
    targetId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },

    // ── Context ──
    ipAddress: {
        type: String,
        default: '',
    },
    userAgent: {
        type: String,
        default: '',
    },

    // ── Change Details ──
    previousValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null, // Snapshot of changed fields before
    },
    newValues: {
        type: mongoose.Schema.Types.Mixed,
        default: null, // Snapshot of changed fields after
    },

}, {
    timestamps: true, // createdAt = when the action happened
});

// ── Indexes ──
auditLogSchema.index({ user: 1, createdAt: -1 });
auditLogSchema.index({ action: 1, createdAt: -1 });
auditLogSchema.index({ targetModel: 1, targetId: 1 });
auditLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 365 * 24 * 60 * 60 }); // DR-8: 1 year TTL

module.exports = mongoose.model('AuditLog', auditLogSchema);
