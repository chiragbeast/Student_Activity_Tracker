const asyncHandler = require('express-async-handler');
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cloudinary = require('../config/cloudinary');

// Generate JWT Token
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET || 'fallback_secret', {
        expiresIn: '30d',
    });
};

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const loginUser = asyncHandler(async (req, res) => {
    const { email, password, role } = req.body;

    // Check for user email
    const user = await User.findOne({ email }).select('+password');

    if (user && (await bcrypt.compare(password, user.password))) {
        // Optional: verify role if requested
        if (role && user.role !== role) {
            res.status(401);
            throw new Error(`Account exists, but not as a ${role}`);
        }

        res.json({
            _id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            token: generateToken(user._id),
        });
    } else {
        res.status(401);
        throw new Error('Invalid email or password');
    }
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
    const user = await User.findById(req.user._id).select('name email role notificationsEnabled emailNotifications');

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
    registerUser,
    getMe,
    updateMe,
    updateMyProfilePicture,
    changePassword,
};
