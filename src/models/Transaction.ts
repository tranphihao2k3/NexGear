import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ITransaction extends Document {
    type: 'revenue' | 'expense' | 'refund' | 'adjustment';
    category: 'product_sale' | 'shipping_fee' | 'import_cost' | 'salary' | 'rent' | 'marketing' | 'tool' | 'other';
    amount: number;
    currency: string;
    direction: 'in' | 'out';
    paymentMethod: 'cash' | 'bank_transfer' | 'vnpay' | 'stripe';
    reference: string;
    orderId: Types.ObjectId | null;
    description: string;
    date: Date;
    attachments: string[];
    createdBy: Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const TransactionSchema = new Schema<ITransaction>(
    {
        type: {
            type: String,
            enum: ['revenue', 'expense', 'refund', 'adjustment'],
            required: true,
        },
        category: {
            type: String,
            enum: ['product_sale', 'shipping_fee', 'import_cost', 'salary', 'rent', 'marketing', 'tool', 'other'],
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        currency: { type: String, default: 'VND' },
        direction: {
            type: String,
            enum: ['in', 'out'],
            required: true,
        },
        paymentMethod: {
            type: String,
            enum: ['cash', 'bank_transfer', 'vnpay', 'stripe'],
            default: 'cash',
        },
        reference: { type: String, default: '' },
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        description: { type: String, required: true },
        date: { type: Date, required: true },
        attachments: [{ type: String }],
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true }
);

TransactionSchema.index({ type: 1, date: -1 });
TransactionSchema.index({ direction: 1 });
TransactionSchema.index({ date: -1 });
TransactionSchema.index({ orderId: 1 });

const Transaction = models.Transaction || model<ITransaction>('Transaction', TransactionSchema);
export default Transaction;
