import { Schema, model, models, type Document } from 'mongoose';

export interface ISoftware extends Document {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    featuredImage: string;
    downloadUrl: string;
    version: string;
    developer: string;
    category: string;
    fileSize: string;
    platform: string;
    type: 'Free' | 'Trial' | 'Crack' | 'License' | 'Repack' | 'Portable';
    tags: string[];
    status: 'draft' | 'published';
    views: number;
    createdAt: Date;
    updatedAt: Date;
}

const SoftwareSchema = new Schema<ISoftware>(
    {
        title: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        excerpt: { type: String, default: '' },
        content: { type: String, required: true },
        featuredImage: { type: String, default: '' },
        downloadUrl: { type: String, default: '' },
        version: { type: String, default: '' },
        developer: { type: String, default: '' },
        category: { type: String, default: 'Tiện ích' },
        fileSize: { type: String, default: '' },
        platform: { type: String, default: 'Windows' },
        type: { type: String, enum: ['Free', 'Trial', 'Crack', 'License', 'Repack', 'Portable'], default: 'Free' },
        tags: { type: [String], default: [] },
        status: { type: String, enum: ['draft', 'published'], default: 'draft' },
        views: { type: Number, default: 0 },
    },
    { timestamps: true }
);

SoftwareSchema.index({ status: 1, createdAt: -1 });

const Software = models.Software || model<ISoftware>('Software', SoftwareSchema);
export default Software;
