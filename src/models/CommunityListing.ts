import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ICommunityListing extends Document {
    title: string;
    slug: string;
    seller: Types.ObjectId;
    category: 'keyboard' | 'mouse' | 'headphone' | 'speaker' | 'accessory' | 'combo' | 'other';
    condition: 'like_new' | 'used' | 'warranty' | 'minor_defect';
    price: number;
    description: string;
    images: string[];
    contact: { phone: string; zalo: string };
    location: string;
    status: 'active' | 'sold' | 'hidden' | 'reported';
    reportCount: number;
    reportedBy: { user: Types.ObjectId; reason: string; createdAt: Date }[];
    views: number;
    expiresAt: Date;
    createdAt: Date;
    updatedAt: Date;
}

const CommunityListingSchema = new Schema<ICommunityListing>(
    {
        title: { type: String, required: true, maxlength: 120 },
        slug: { type: String, required: true, unique: true },
        seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        category: {
            type: String,
            required: true,
            enum: ['keyboard', 'mouse', 'headphone', 'speaker', 'accessory', 'combo', 'other'],
        },
        condition: {
            type: String,
            required: true,
            enum: ['like_new', 'used', 'warranty', 'minor_defect'],
        },
        price: { type: Number, required: true },
        description: { type: String, required: true, maxlength: 2000 },
        images: [{ type: String }],
        contact: {
            phone: { type: String, default: '' },
            zalo: { type: String, default: '' },
        },
        location: { type: String, default: '' },
        status: {
            type: String,
            enum: ['active', 'sold', 'hidden', 'reported'],
            default: 'active',
        },
        reportCount: { type: Number, default: 0 },
        reportedBy: [
            {
                user: { type: Schema.Types.ObjectId, ref: 'User' },
                reason: { type: String },
                createdAt: { type: Date, default: Date.now },
            },
        ],
        views: { type: Number, default: 0 },
        expiresAt: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày
        },
    },
    { timestamps: true }
);

CommunityListingSchema.index({ seller: 1 });
CommunityListingSchema.index({ status: 1 });
CommunityListingSchema.index({ category: 1 });
CommunityListingSchema.index({ createdAt: -1 });
CommunityListingSchema.index({ title: 'text', description: 'text' });
// TTL index — MongoDB tự xoá document khi expiresAt đến hạn
CommunityListingSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const CommunityListing = models.CommunityListing || model<ICommunityListing>('CommunityListing', CommunityListingSchema);
export default CommunityListing;
