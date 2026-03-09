import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IReturnItem extends Document {
    returnOrder: Types.ObjectId;
    product: Types.ObjectId;
    productUnit: Types.ObjectId | null;
    quantity: number;
    reason: string;
    condition: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReturnItemSchema = new Schema<IReturnItem>(
    {
        returnOrder: { type: Schema.Types.ObjectId, ref: 'Return', required: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productUnit: { type: Schema.Types.ObjectId, ref: 'ProductUnit', default: null },
        quantity: { type: Number, default: 1 },
        reason: { type: String, default: '' },
        condition: { type: String, default: '' },
    },
    { timestamps: true }
);

ReturnItemSchema.index({ returnOrder: 1 });

const ReturnItem = models.ReturnItem || model<IReturnItem>('ReturnItem', ReturnItemSchema);
export default ReturnItem;
