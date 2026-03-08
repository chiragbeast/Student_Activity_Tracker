const mongoose = require('mongoose');

const deadlineSchema = new mongoose.Schema({
    // ── Deadline Details (FR-2.11, FR-8.4) ──
    title: {
        type: String,
        required: [true, 'Deadline title is required'],
        trim: true,
        maxlength: 200,
    },
    description: {
        type: String,
        default: '',
        maxlength: 500,
    },
    date: {
        type: Date,
        required: [true, 'Deadline date is required'],
    },
    category: {
        type: String,
        enum: ['Institute', 'Department', 'General'],
        required: [true, 'Category is required'],
    },

    // ── Visibility ──
    visibleToRoles: {
        type: [String],
        enum: ['Student', 'Faculty', 'Admin'],
        default: ['Student', 'Faculty', 'Admin'],
    },
    department: {
        type: String,
        default: null, // null = visible to all departments
        trim: true,
    },

    // ── Academic Context (FR-8.4) ──
    academicYear: {
        type: String,
        trim: true,
        default: '',
    },
    semester: {
        type: Number,
        min: 1,
        max: 8,
        default: null,
    },

    // ── Admin ──
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    isActive: {
        type: Boolean,
        default: true,
    },

}, {
    timestamps: true,
});

// ── Indexes ──
deadlineSchema.index({ date: 1 });
deadlineSchema.index({ category: 1, date: 1 });
deadlineSchema.index({ isActive: 1, date: 1 });

module.exports = mongoose.model('Deadline', deadlineSchema);
