import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IProductHistory extends Document {
    productUnit: Types.ObjectId;
    eventType: string;
    eventDate: Date;
    description: string;
    relatedType: string | null;
    relatedId: Types.ObjectId | null;
    performedBy: Types.ObjectId | null;
    metadata: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const ProductHistorySchema = new Schema<IProductHistory>(
    {
        productUnit: { type: Schema.Types.ObjectId, ref: 'ProductUnit', required: true },
        eventType: {
            type: String,
            enum: ['purchased', 'sold', 'transferred', 'repaired', 'warranty_claimed', 'returned', 'scrapped', 'condition_changed'],
            required: true,
        },
        eventDate: { type: Date, default: Date.now },
        description: { type: String, required: true },
        relatedType: { type: String, default: null },
        relatedId: { type: Schema.Types.ObjectId, default: null },
        performedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        metadata: { type: Schema.Types.Mixed, default: {} },
    },
    { timestamps: true }
);

ProductHistorySchema.index({ productUnit: 1, eventDate: -1 });
ProductHistorySchema.index({ eventType: 1 });
ProductHistorySchema.index({ relatedType: 1, relatedId: 1 });

const ProductHistory = models.ProductHistory || model<IProductHistory>('ProductHistory', ProductHistorySchema);
export default ProductHistory;
