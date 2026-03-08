const mongoose = require('mongoose');

const activityPointsSchema = new mongoose.Schema({
    // ── Student Reference ──
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Student reference is required'],
    },

    // ── Category-wise Totals (FR-2.4, FR-6.1) ──
    institutePoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    departmentPoints: {
        type: Number,
        default: 0,
        min: 0,
    },
    totalPoints: {
        type: Number,
        default: 0,
        min: 0,
    },

    // ── Semester-wise Breakdown (FR-6.7) ──
    semesterWise: [{
        academicYear: { type: String, trim: true },
        semester: { type: Number, min: 1, max: 8 },
        institutePoints: { type: Number, default: 0 },
        departmentPoints: { type: Number, default: 0 },
    }],

    // ── Graduation Progress (FR-2.9) ──
    graduationRequirement: {
        instituteRequired: { type: Number, default: 60 },
        departmentRequired: { type: Number, default: 20 },
    },

    // ── Points History Log (FR-6.8) ──
    pointsHistory: [{
        submission: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Submission',
        },
        activityName: { type: String },
        activityLevel: { type: String, enum: ['Institute', 'Department'] },
        pointsRequested: { type: Number },
        pointsApproved: { type: Number },
        action: {
            type: String,
            enum: ['approved', 'modified', 'revoked'],
        },
        date: { type: Date, default: Date.now },
    }],

}, {
    timestamps: true,
});

// ── Indexes ──
activityPointsSchema.index({ student: 1 }, { unique: true }); // One record per student
activityPointsSchema.index({ totalPoints: -1 }); // For leaderboard (FR-7.7)

// ── Virtual: Graduation eligibility (FR-7.6) ──
activityPointsSchema.virtual('isGraduationEligible').get(function () {
    return (
        this.institutePoints >= this.graduationRequirement.instituteRequired &&
        this.departmentPoints >= this.graduationRequirement.departmentRequired
    );
});

// ── Virtual: Graduation percentage ──
activityPointsSchema.virtual('graduationProgress').get(function () {
    const totalRequired = this.graduationRequirement.instituteRequired + this.graduationRequirement.departmentRequired;
    return totalRequired > 0 ? Math.min(100, Math.round((this.totalPoints / totalRequired) * 100)) : 0;
});

// Ensure virtuals are included in JSON output
activityPointsSchema.set('toJSON', { virtuals: true });
activityPointsSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('ActivityPoints', activityPointsSchema);
