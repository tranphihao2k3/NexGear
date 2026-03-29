import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IBuybackOrder extends Document {
    buybackNumber: string;
    sellerName: string;
    sellerPhone: string;
    sellerIdNumber: string;
    sellerAddress: string;
    productInfo: { brand: string; model: string; serialNumber: string; condition: string; specs: Record<string, unknown> };
    images: string[];
    buyPrice: number;
    quotedPrice: number;
    inspectionNotes: string;
    inspectedBy: Types.ObjectId | null;
    inspectedAt: Date | null;
    status: 'pending' | 'inspecting' | 'approved' | 'rejected' | 'cancelled';
    approvedBy: Types.ObjectId | null;
    approvedAt: Date | null;
    rejectionReason: string;
    paymentMethod: 'cash' | 'bank' | 'qr';
    paidAt: Date | null;
    notes: string;
    voucher: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const BuybackOrderSchema = new Schema<IBuybackOrder>(
    {
        buybackNumber: { type: String, required: true },
        sellerName: { type: String, required: true },
        sellerPhone: { type: String, required: true },
        sellerIdNumber: { type: String, default: '' },
        sellerAddress: { type: String, default: '' },
        productInfo: {
            brand: { type: String, default: '' },
            model: { type: String, default: '' },
            serialNumber: { type: String, default: '' },
            condition: { type: String, default: '' },
            specs: { type: Schema.Types.Mixed, default: {} },
        },
        images: { type: [String], default: [] },
        buyPrice: { type: Number, required: true, default: 0 },
        quotedPrice: { type: Number, default: 0 },
        inspectionNotes: { type: String, default: '' },
        inspectedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        inspectedAt: { type: Date, default: null },
        status: { type: String, enum: ['pending', 'inspecting', 'approved', 'rejected', 'cancelled'], default: 'pending' },
        approvedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        approvedAt: { type: Date, default: null },
        rejectionReason: { type: String, default: '' },
        paymentMethod: { type: String, enum: ['cash', 'bank', 'qr'], default: 'cash' },
        paidAt: { type: Date, default: null },
        notes: { type: String, default: '' },
        voucher: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
    },
    { timestamps: true }
);

BuybackOrderSchema.index({ buybackNumber: 1 }, { unique: true });
BuybackOrderSchema.index({ status: 1, createdAt: -1 });
BuybackOrderSchema.index({ sellerPhone: 1 });

const BuybackOrder = models.BuybackOrder || model<IBuybackOrder>('BuybackOrder', BuybackOrderSchema);
export default BuybackOrder;
