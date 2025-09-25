import mongoose from 'mongoose';

const sampleSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            default: '',
        },
        input: {
            type: String,
            required: true,
        },
        output: {
            type: String,
            required: true,
        },
        explanation: {
            type: String,
            default: '',
        },
    },
    { _id: false }
);

const hintSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: '',
        },
        body: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const solutionSnippetSchema = new mongoose.Schema(
    {
        language: {
            type: String,
            required: true,
        },
        code: {
            type: String,
            required: true,
        },
        timeComplexity: {
            type: String,
            default: '',
        },
        spaceComplexity: {
            type: String,
            default: '',
        },
    },
    { _id: false }
);

const resourceLinkSchema = new mongoose.Schema(
    {
        label: {
            type: String,
            required: true,
        },
        url: {
            type: String,
            required: true,
        },
    },
    { _id: false }
);

const statsSchema = new mongoose.Schema(
    {
        submissions: {
            type: Number,
            default: 0,
        },
        accepted: {
            type: Number,
            default: 0,
        },
        likes: {
            type: Number,
            default: 0,
        },
    },
    { _id: false }
);

const problemSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        description: {
            type: String,
            required: true,
        },
        statement: {
            type: String,
            required: true,
        },
        difficulty: {
            type: String,
            enum: ['Beginner', 'Easy', 'Medium', 'Hard', 'Advanced'],
            default: 'Easy',
        },
        topics: {
            type: [String],
            default: [],
        },
        tags: {
            type: [String],
            default: [],
        },
        companies: {
            type: [String],
            default: [],
        },
        inputFormat: {
            type: String,
            default: '',
        },
        outputFormat: {
            type: String,
            default: '',
        },
        constraints: {
            type: [String],
            default: [],
        },
        samples: {
            type: [sampleSchema],
            default: [],
        },
        hints: {
            type: [hintSchema],
            default: [],
        },
        solutionApproach: {
            type: String,
            default: '',
        },
        editorial: {
            type: String,
            default: '',
        },
        solutionSnippets: {
            type: [solutionSnippetSchema],
            default: [],
        },
        resources: {
            type: [resourceLinkSchema],
            default: [],
        },
        stats: {
            type: statsSchema,
            default: () => ({}),
        },
        estimatedTime: {
            type: Number,
            default: 0,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        isPublished: {
            type: Boolean,
            default: true,
        },
    },
    { timestamps: true }
);

const Problem = mongoose.model('Problem', problemSchema);

export default Problem;
