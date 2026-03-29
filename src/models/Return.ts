import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IReturn extends Document {
    returnNumber: string;
    order: Types.ObjectId;
    customer: Types.ObjectId;
    returnType: 'refund' | 'exchange' | 'store_credit';
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'processed' | 'cancelled';
    refundAmount: number;
    refundMethod: string;
    processedBy: Types.ObjectId | null;
    processedAt: Date | null;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const ReturnSchema = new Schema<IReturn>(
    {
        returnNumber: { type: String, required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        returnType: { type: String, enum: ['refund', 'exchange', 'store_credit'], required: true },
        reason: { type: String, required: true },
        status: { type: String, enum: ['pending', 'approved', 'rejected', 'processed', 'cancelled'], default: 'pending' },
        refundAmount: { type: Number, default: 0 },
        refundMethod: { type: String, default: '' },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        processedAt: { type: Date, default: null },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

ReturnSchema.index({ returnNumber: 1 }, { unique: true });
ReturnSchema.index({ order: 1 });
ReturnSchema.index({ customer: 1 });
ReturnSchema.index({ status: 1 });

const Return = models.Return || model<IReturn>('Return', ReturnSchema);
export default Return;
