import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IWarrantyCard extends Document {
    warrantyNumber: string;
    product: Types.ObjectId;
    order: Types.ObjectId | null;
    customer: Types.ObjectId;
    productUnit: Types.ObjectId | null;
    serialNumber: string;
    warrantyType: 'manufacturer' | 'store';
    coverageDetails: Record<string, unknown>;
    purchaseDate: Date | null;
    warrantyStartDate: Date | null;
    warrantyEndDate: Date | null;
    warrantyMonths: number;
    warrantyTerms: string;
    status: 'active' | 'expired' | 'voided' | 'claimed';
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const WarrantyCardSchema = new Schema<IWarrantyCard>(
    {
        warrantyNumber: { type: String, required: true, unique: true },
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        productUnit: { type: Schema.Types.ObjectId, ref: 'ProductUnit', default: null },
        serialNumber: { type: String, default: '' },
        warrantyType: { type: String, enum: ['manufacturer', 'store'], default: 'store' },
        coverageDetails: { type: Schema.Types.Mixed, default: {} },
        purchaseDate: { type: Date, default: null },
        warrantyStartDate: { type: Date, default: null },
        warrantyEndDate: { type: Date, default: null },
        warrantyMonths: { type: Number, default: 12 },
        warrantyTerms: { type: String, default: '' },
        status: { type: String, enum: ['active', 'expired', 'voided', 'claimed'], default: 'active' },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

WarrantyCardSchema.index({ warrantyNumber: 1 }, { unique: true });
WarrantyCardSchema.index({ serialNumber: 1 });
WarrantyCardSchema.index({ customer: 1, status: 1 });
WarrantyCardSchema.index({ warrantyEndDate: 1 });

const WarrantyCard = models.WarrantyCard || model<IWarrantyCard>('WarrantyCard', WarrantyCardSchema);
export default WarrantyCard;
