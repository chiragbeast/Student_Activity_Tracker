const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    // ── Identity ──
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true,
        maxlength: 100,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters'],
        select: false, // Never return password by default
    },

    // ── Role & Institute Info (FR-1.1, BR-01) ──
    role: {
        type: String,
        enum: ['Student', 'Faculty', 'Admin'],
        required: [true, 'Role is required'],
        default: 'Student',
    },
    rollNumber: {
        type: String,
        trim: true,
        sparse: true, // Only students have roll numbers (BR-02)
    },
    department: {
        type: String,
        trim: true,
    },

    // ── Faculty Advisor Assignment (BR-03, BR-04) ──
    facultyAdvisor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null, // Only for students — references their assigned FA
    },

    // ── Profile ──
    profilePicture: {
        type: String,
        default: '',
    },
    phone: {
        type: String,
        trim: true,
    },

    // ── Preferences (FR-5.4) ──
    notificationsEnabled: {
        type: Boolean,
        default: true,
    },
    emailNotifications: {
        type: Boolean,
        default: true,
    },

    // ── Security (FR-1.6, NFR-2.8) ──
    failedLoginAttempts: {
        type: Number,
        default: 0,
    },
    isLocked: {
        type: Boolean,
        default: false,
    },
    lockUntil: {
        type: Date,
        default: null,
    },
    lastLogin: {
        type: Date,
        default: null,
    },
    passwordChangedAt: {
        type: Date,
        default: null,
    },
    passwordResetToken: {
        type: String,
        default: null,
    },
    passwordResetExpires: {
        type: Date,
        default: null,
    },

    // ── Account Status (FR-4.1, DR-10) ──
    isActive: {
        type: Boolean,
        default: true,
    },
    deactivatedAt: {
        type: Date,
        default: null, // Soft delete (DR-10: 90-day recovery)
    },

}, {
    timestamps: true, // createdAt, updatedAt
});

// ── Indexes ──
userSchema.index({ role: 1 });
userSchema.index({ facultyAdvisor: 1 });
userSchema.index({ department: 1 });


// ── Pre-save: Hash password (NFR-2.1) ──
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    this.password = await bcrypt.hash(this.password, 12);
    this.passwordChangedAt = Date.now() - 1000; // Ensure token issued after change
});

// ── Methods ──
userSchema.methods.comparePassword = async function (candidatePassword) {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.changedPasswordAfter = function (jwtTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(this.passwordChangedAt.getTime() / 1000, 10);
        return jwtTimestamp < changedTimestamp;
    }
    return false;
};

module.exports = mongoose.model('User', userSchema);
