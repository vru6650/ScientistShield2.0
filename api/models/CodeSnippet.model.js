import mongoose from 'mongoose';

const CodeSnippetSchema = new mongoose.Schema(
    {
        html: {
            type: String,
            default: '',
        },
        css: {
            type: String,
            default: '',
        },
        js: {
            type: String,
            default: '',
        },
    },
    { timestamps: true }
);

const CodeSnippet = mongoose.model('CodeSnippet', CodeSnippetSchema);

export default CodeSnippet;