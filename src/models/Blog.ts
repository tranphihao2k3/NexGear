import { Schema, model, models, type Document } from 'mongoose';

export interface IBlog extends Document {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    author: string;
    tags: string[];
    metaTitle: string;
    metaDescription: string;
    status: 'draft' | 'published';
    publishedAt: Date | null;
    viewCount: number;
    createdAt: Date;
    updatedAt: Date;
}

const BlogSchema = new Schema<IBlog>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        excerpt: { type: String, default: '' },
        content: { type: String, required: true },
        featuredImage: { type: String, default: '' },
        author: { type: String, default: 'Admin' },
        tags: { type: [String], default: [] },
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        publishedAt: { type: Date, default: null },
        viewCount: { type: Number, default: 0 },
    },
    { timestamps: true }
);

BlogSchema.index({ slug: 1 });
BlogSchema.index({ status: 1, publishedAt: -1 });

const Blog = models.Blog || model<IBlog>('Blog', BlogSchema);
export default Blog;
