import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IReview extends Document {
    product: Types.ObjectId;
    user: Types.ObjectId;
    order: Types.ObjectId | null;
    rating: number;
    title: string;
    content: string;
    images: string[];
    pros: string[];
    cons: string[];
    isVerified: boolean;
    isApproved: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        rating: { type: Number, required: true, min: 1, max: 5 },
        title: { type: String, default: '' },
        content: { type: String, default: '' },
        images: [{ type: String }],
        pros: [{ type: String }],
        cons: [{ type: String }],
        isVerified: { type: Boolean, default: false },
        isApproved: { type: Boolean, default: false },
    },
    { timestamps: true }
);

ReviewSchema.index({ product: 1, createdAt: -1 });
ReviewSchema.index({ user: 1 });
ReviewSchema.index({ isApproved: 1 });

const Review = models.Review || model<IReview>('Review', ReviewSchema);
export default Review;
