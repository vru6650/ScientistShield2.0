import mongoose from 'mongoose';

const pageItemSchema = new mongoose.Schema(
    {
        title: { type: String, trim: true },
        body: { type: String, trim: true },
        icon: { type: String, trim: true },
    },
    { _id: false }
);

const pageSectionSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ['hero', 'rich-text', 'feature-grid', 'cta', 'custom'],
            default: 'rich-text',
        },
        title: { type: String, trim: true },
        subtitle: { type: String, trim: true },
        body: { type: String, trim: true },
        alignment: {
            type: String,
            enum: ['left', 'center', 'right'],
            default: 'left',
        },
        background: { type: String, trim: true, default: 'default' },
        media: {
            url: { type: String, trim: true },
            alt: { type: String, trim: true },
        },
        cta: {
            label: { type: String, trim: true },
            url: { type: String, trim: true },
        },
        items: [pageItemSchema],
        order: { type: Number, default: 0 },
    },
    { timestamps: false }
);

const seoSchema = new mongoose.Schema(
    {
        metaTitle: { type: String, trim: true },
        metaDescription: { type: String, trim: true },
        keywords: { type: [String], default: [] },
    },
    { _id: false }
);

const pageSchema = new mongoose.Schema(
    {
        title: { type: String, required: true, trim: true },
        slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
        description: { type: String, trim: true },
        status: {
            type: String,
            enum: ['draft', 'published'],
            default: 'draft',
        },
        publishedAt: { type: Date },
        seo: { type: seoSchema, default: () => ({}) },
        sections: { type: [pageSectionSchema], default: () => [] },
        createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    },
    { timestamps: true }
);

const Page = mongoose.model('Page', pageSchema);

export default Page;
