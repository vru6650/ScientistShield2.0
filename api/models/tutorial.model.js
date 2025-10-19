import mongoose from 'mongoose';

// Define the schema for a single sub-chapter
const subChapterSchema = new mongoose.Schema(
    {
        chapterTitle: {
            type: String,
            required: true,
        },
        chapterSlug: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ['text', 'code-interactive', 'quiz'],
            default: 'text',
        },
        content: {
            type: String,
            default: '',
        },
        initialCode: {
            type: String,
            default: '',
        },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
        },
        order: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
);

// Define the schema for a single top-level chapter
const tutorialChapterSchema = new mongoose.Schema(
    {
        chapterTitle: {
            type: String,
            required: true,
        },
        chapterSlug: {
            type: String,
            required: true,
        },
        contentType: {
            type: String,
            enum: ['text', 'code-interactive', 'quiz'],
            default: 'text',
        },
        content: {
            type: String,
            default: '',
        },
        initialCode: {
            type: String,
            default: '',
        },
        quizId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Quiz',
        },
        order: {
            type: Number,
            required: true,
        },
        completedBy: [{
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            default: [],
        }],
        subChapters: [subChapterSchema], // Nested sub-chapters array
    },
    { timestamps: true }
);

const tutorialSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            unique: true,
        },
        slug: {
            type: String,
            required: true,
            unique: true,
        },
        description: {
            type: String,
            required: true,
        },
        thumbnail: {
            type: String,
            default: 'https://www.hostinger.com/tutorials/wp-content/uploads/sites/2/2021/09/how-to-write-a-blog-post.png',
        },
        category: {
            type: String,
            default: 'uncategorized',
        },
        authorId: {
            type: String,
            required: true,
        },
        chapters: [tutorialChapterSchema],
        difficulty: {
            type: String,
            enum: ['Beginner', 'Intermediate', 'Advanced'],
            default: 'Beginner',
        },
        readingTime: {
            type: Number,
            default: 0,
        },
        completedBy: {
            type: [mongoose.Schema.Types.ObjectId],
            ref: 'User',
            default: [],
        },
    },
    { timestamps: true }
);

tutorialSchema.index({ category: 1, updatedAt: -1 });
tutorialSchema.index({ authorId: 1, updatedAt: -1 });
tutorialSchema.index({ createdAt: -1 });

const Tutorial = mongoose.model('Tutorial', tutorialSchema);

const dropLegacyChapterSlugIndex = async () => {
    try {
        if (!Tutorial.collection) {
            return;
        }

        await Tutorial.collection.dropIndex('chapters.chapterSlug_1');
    } catch (error) {
        const isIndexNotFound = error?.codeName === 'IndexNotFound' || error?.code === 27;
        const isNamespaceNotFound = error?.codeName === 'NamespaceNotFound' || error?.code === 26;

        if (!isIndexNotFound && !isNamespaceNotFound) {
            console.warn('Failed to drop legacy chapters.chapterSlug_1 index:', error);
        }
    }
};

if (mongoose.connection.readyState === 1) {
    dropLegacyChapterSlugIndex();
} else {
    mongoose.connection.once('connected', dropLegacyChapterSlugIndex);
}

export default Tutorial;
