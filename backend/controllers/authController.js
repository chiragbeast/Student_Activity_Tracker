const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const cloudinary = require('../config/cloudinary');
const { Resend } = require('resend');

const OTP_EXPIRY_MINUTES = Number(process.env.OTP_EXPIRY_MINUTES || 5);
const OTP_RESEND_COOLDOWN_SECONDS = Number(process.env.OTP_RESEND_COOLDOWN_SECONDS || 60);
const googleClient = new OAuth2Client();

const getResendClient = () => {
    if (!process.env.RESEND_API_KEY) {
        throw new Error('RESEND_API_KEY is not configured');
    }

    return new Resend(process.env.RESEND_API_KEY);
};

const generateOtpCode = () => String(Math.floor(100000 + Math.random() * 900000));

const setOtpForUser = async (user) => {
    const otpCode = generateOtpCode();
    user.otpCodeHash = await bcrypt.hash(otpCode, 10);
    user.otpExpiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);
    user.otpRequestedAt = new Date();
    user.otpAttempts = 0;
    await user.save();
    return otpCode;
};

const sendOtpEmail = async (toEmail, otpCode) => {
    if (!process.env.RESEND_FROM_EMAIL) {
        throw new Error('RESEND_FROM_EMAIL is not configured');
    }

    const resend = getResendClient();
        const expiryText = `${OTP_EXPIRY_MINUTES} minute${OTP_EXPIRY_MINUTES === 1 ? '' : 's'}`;
        const html = `
        <div style="margin:0;padding:0;background:#fdf8f0;font-family:Poppins,Segoe UI,Arial,sans-serif;color:#1a1a2e;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#fdf8f0;padding:32px 12px;">
                <tr>
                    <td align="center">
                        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;background:#ffffff;border:1px solid #e5e1d8;border-radius:18px;overflow:hidden;box-shadow:0 8px 26px rgba(26,26,46,0.08);">
                            <tr>
                                <td style="padding:24px 28px;background:linear-gradient(135deg,#f5a623 0%,#f7b731 100%);color:#1a1a2e;">
                                    <h1 style="margin:0;font-size:22px;line-height:1.3;font-weight:800;">SAPT Secure Verification</h1>
                                    <p style="margin:8px 0 0 0;font-size:14px;line-height:1.5;font-weight:500;">Use this one-time code to finish signing in.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:28px;">
                                    <p style="margin:0 0 14px 0;font-size:15px;line-height:1.7;color:#374151;">Hi,</p>
                                    <p style="margin:0 0 16px 0;font-size:15px;line-height:1.7;color:#374151;">We received a login request for your SAPT account. Enter the verification code below on the MFA page:</p>

                                    <div style="margin:18px 0 8px 0;padding:14px 16px;border:1px dashed #f5a623;border-radius:12px;background:#fff7e8;text-align:center;">
                                        <span style="font-size:34px;letter-spacing:8px;font-weight:800;color:#1a1a2e;">${otpCode}</span>
                                    </div>

                                    <p style="margin:14px 0 0 0;font-size:13px;line-height:1.6;color:#6b7280;">This code expires in ${expiryText}. If you did not request this login, please ignore this email.</p>
                                </td>
                            </tr>
                            <tr>
                                <td style="padding:14px 28px 24px 28px;border-top:1px solid #f3efe7;">
                                    <p style="margin:0;font-size:12px;line-height:1.6;color:#9ca3af;">Student Activity Points Tracker (SAPT)</p>
                                </td>
                            </tr>
                        </table>
                    </td>
                </tr>
            </table>
        </div>`;

    await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: toEmail,
        subject: 'Your SAPT verification code',
                text: `Your SAPT verification code is ${otpCode}. It expires in ${expiryText}.`,
                html,
    });
};

// Generate JWT Token
const generateToken = (id) => {
    if (!process.env.JWT_SECRET) {
        throw new Error('JWT_SECRET is not configured');
    }

    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });
};

const buildAuthPayload = (user) => ({
    _id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    token: generateToken(user._id),
});

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        res.status(400);
        throw new Error('Email and password are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();

    // Check for user email
    const user = await User.findOne({ email: normalizedEmail }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
        // Student logs in directly. Faculty/Admin must complete OTP verification.
        if (user.role === 'Faculty' || user.role === 'Admin') {
            const otpCode = await setOtpForUser(user);
            await sendOtpEmail(user.email, otpCode);

            return res.status(200).json({
                requires2FA: true,
                email: user.email,
                role: user.role,
                message: 'Verification code sent to your email',
            });
        }

        user.lastLogin = new Date();
        await user.save();

        res.json(buildAuthPayload(user));
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
});

// @desc    Google OAuth login (Student/Faculty/Admin)
// @route   POST /api/auth/google-login
// @access  Public
const loginWithGoogle = asyncHandler(async (req, res) => {
    const { idToken, role } = req.body;

    if (!idToken) {
        res.status(400);
        throw new Error('Google ID token is required');
    }

    if (!process.env.GOOGLE_CLIENT_ID) {
        res.status(500);
        throw new Error('GOOGLE_CLIENT_ID is not configured');
    }

    const ticket = await googleClient.verifyIdToken({
        idToken,
        audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email || !payload?.email_verified) {
        res.status(401);
        throw new Error('Google account email is not verified');
    }

    const normalizedEmail = String(payload.email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(404);
        throw new Error('No SAPT account exists for this Google email');
    }

    if (role && user.role !== role) {
        res.status(403);
        throw new Error(`This account is not allowed for ${role} login`);
    }

    if (!user.isActive || user.isLocked) {
        res.status(401);
        throw new Error('Not authorized, account disabled or locked');
    }

    user.lastLogin = new Date();
    await user.save();

    res.status(200).json(buildAuthPayload(user));
});

// @desc    Verify OTP for faculty/admin login
// @route   POST /api/auth/verify-2fa
// @access  Public
const verify2FA = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    if (!email || !code) {
        res.status(400);
        throw new Error('Email and verification code are required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const otpCode = String(code).trim();

    const user = await User.findOne({ email: normalizedEmail }).select('+otpCodeHash');
    if (!user) {
        res.status(401);
        throw new Error('Invalid verification request');
    }

    if (user.role !== 'Faculty' && user.role !== 'Admin') {
        res.status(400);
        throw new Error('Verification code is not required for this user role');
    }

    if (!user.otpCodeHash || !user.otpExpiresAt || user.otpExpiresAt.getTime() < Date.now()) {
        res.status(401);
        throw new Error('Verification code is invalid or expired');
    }

    const otpMatches = await bcrypt.compare(otpCode, user.otpCodeHash);
    if (!otpMatches) {
        user.otpAttempts = (user.otpAttempts || 0) + 1;
        await user.save();
        res.status(401);
        throw new Error('Verification code is invalid or expired');
    }

    user.otpCodeHash = null;
    user.otpExpiresAt = null;
    user.otpRequestedAt = null;
    user.otpAttempts = 0;
    user.lastLogin = new Date();
    await user.save();

    res.status(200).json({
        ...buildAuthPayload(user),
    });
});

// @desc    Resend OTP for faculty/admin login
// @route   POST /api/auth/resend-2fa
// @access  Public
const resend2FA = asyncHandler(async (req, res) => {
    const { email } = req.body;

    if (!email) {
        res.status(400);
        throw new Error('Email is required');
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        res.status(401);
        throw new Error('Invalid verification request');
    }

    if (user.role !== 'Faculty' && user.role !== 'Admin') {
        res.status(400);
        throw new Error('Verification code is not required for this user role');
    }

    if (user.otpRequestedAt) {
        const secondsSinceLastRequest = Math.floor((Date.now() - user.otpRequestedAt.getTime()) / 1000);
        if (secondsSinceLastRequest < OTP_RESEND_COOLDOWN_SECONDS) {
            res.status(429);
            throw new Error(`Please wait ${OTP_RESEND_COOLDOWN_SECONDS - secondsSinceLastRequest}s before requesting a new code`);
        }
    }

    const otpCode = await setOtpForUser(user);
    await sendOtpEmail(user.email, otpCode);

    res.status(200).json({
        message: 'Verification code resent successfully',
        cooldownSeconds: OTP_RESEND_COOLDOWN_SECONDS,
    });
});

// @desc    Register a new user (For testing/seeding purposes right now)
// @route   POST /api/auth/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role, department, rollNumber } = req.body;

    if (!name || !email || !password) {
        res.status(400);
        throw new Error('Please add all fields');
    }

    // Check if user exists
    const userExists = await User.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    // Create user (password hashed in pre-save hook in User model)
    const user = await User.create({
        name,
        email,
        password,
        role: role || 'Student',
        department,
        rollNumber
    });

    if (user) {
        res.status(201).json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id).select('name email role profilePicture notificationsEnabled emailNotifications');

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    res.status(200).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profilePicture,
        notificationsEnabled: user.notificationsEnabled,
        emailNotifications: user.emailNotifications,
    });
});

// @desc    Update logged-in user profile preferences
// @route   PUT /api/auth/me
// @access  Private
const updateMe = asyncHandler(async (req, res) => {
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const { notificationsEnabled, emailNotifications } = req.body;

    if (notificationsEnabled !== undefined) user.notificationsEnabled = notificationsEnabled;
    if (emailNotifications !== undefined) user.emailNotifications = emailNotifications;

    const updatedUser = await user.save();

    res.status(200).json({
        _id: updatedUser._id,
        notificationsEnabled: updatedUser.notificationsEnabled,
        emailNotifications: updatedUser.emailNotifications,
    });
});

// @desc    Upload/update logged-in user profile picture
// @route   PUT /api/auth/me/picture
// @access  Private
const updateMyProfilePicture = asyncHandler(async (req, res) => {
    if (!req.file) {
        res.status(400);
        throw new Error('Please upload an image file');
    }

    const user = await User.findById(req.user._id);
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    if (user.profilePicture) {
        try {
            const urlParts = user.profilePicture.split('/');
            const folderAndFile = urlParts.slice(-2).join('/');
            const publicId = folderAndFile.replace(/\.[^/.]+$/, '');
            await cloudinary.uploader.destroy(publicId);
        } catch (err) {
            console.error('Failed to delete old profile picture:', err.message);
        }
    }

    const result = await new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: 'profile-pictures',
                resource_type: 'image',
                public_id: `user-${user._id}-${Date.now()}`,
                transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
            },
            (error, uploadedResult) => {
                if (error) return reject(error);
                resolve(uploadedResult);
            }
        );

        const { Readable } = require('stream');
        const readable = Readable.from(req.file.buffer);
        readable.pipe(uploadStream);
    });

    user.profilePicture = result.secure_url;
    await user.save();

    res.status(200).json({
        success: true,
        profilePicture: user.profilePicture,
    });
});

// @desc    Change logged-in user password
// @route   PUT /api/auth/change-password
// @access  Private
const changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
        res.status(400);
        throw new Error('Current password, new password and confirm password are required');
    }

    if (newPassword !== confirmPassword) {
        res.status(400);
        throw new Error('New password and confirm password do not match');
    }

    if (newPassword.length < 6) {
        res.status(400);
        throw new Error('Password must be at least 6 characters');
    }

    const user = await User.findById(req.user._id).select('+password');
    if (!user) {
        res.status(404);
        throw new Error('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
        res.status(401);
        throw new Error('Current password is incorrect');
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
});

module.exports = {
    loginUser,
    loginWithGoogle,
    verify2FA,
    resend2FA,
    registerUser,
    getMe,
    updateMe,
    updateMyProfilePicture,
    changePassword,
};
