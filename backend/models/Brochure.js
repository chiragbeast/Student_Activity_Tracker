const mongoose = require('mongoose');

const brochureSchema = new mongoose.Schema(
    {
        brochureUrl: {
            type: String,
            required: [true, 'Brochure URL is required'],
            trim: true,
        },
        brochurePublicId: {
            type: String,
            required: [true, 'Brochure public id is required'],
            trim: true,
        },
        fileName: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
        },
        fileMimeType: {
            type: String,
            required: [true, 'File mime type is required'],
            trim: true,
        },
        fileSize: {
            type: Number,
            default: 0,
        },
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
    },
    {
        timestamps: true,
    }
);

module.exports = mongoose.model('Brochure', brochureSchema);
