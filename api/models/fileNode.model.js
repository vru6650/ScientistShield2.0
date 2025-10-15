import mongoose from 'mongoose';

const fileNodeSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            trim: true,
        },
        type: {
            type: String,
            enum: ['file', 'folder'],
            required: true,
        },
        parent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'FileNode',
            default: null,
        },
        ancestors: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'FileNode',
            },
        ],
        size: {
            type: Number,
            default: 0,
        },
        mimeType: {
            type: String,
        },
        extension: {
            type: String,
        },
        storagePath: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
);

fileNodeSchema.index(
    { parent: 1, name: 1 },
    {
        unique: true,
        collation: { locale: 'en', strength: 2 },
        partialFilterExpression: { type: { $exists: true } },
    }
);

const FileNode = mongoose.model('FileNode', fileNodeSchema);

export default FileNode;
