import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IPromotion extends Document {
    name: string;
    code: string;
    description: string;
    discountType: 'percentage' | 'fixed';
    discountValue: number;
    maxDiscountAmount: number;
    applicableProducts: Types.ObjectId[];
    applicableCategories: Types.ObjectId[];
    minOrderAmount: number;
    startDate: Date;
    endDate: Date;
    maxUses: number;
    usedCount: number;
    isActive: boolean;
    status: 'draft' | 'active' | 'scheduled' | 'expired' | 'cancelled';
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const PromotionSchema = new Schema<IPromotion>(
    {
        name: { type: String, required: true },
        code: { type: String, default: '', uppercase: true, trim: true },
        description: { type: String, default: '' },
        discountType: { type: String, enum: ['percentage', 'fixed'], required: true },
        discountValue: { type: Number, required: true, min: 0 },
        maxDiscountAmount: { type: Number, default: 0 },
        applicableProducts: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        applicableCategories: [{ type: Schema.Types.ObjectId, ref: 'Category' }],
        minOrderAmount: { type: Number, default: 0 },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        maxUses: { type: Number, default: 0 },
        usedCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        status: { type: String, enum: ['draft', 'active', 'scheduled', 'expired', 'cancelled'], default: 'draft' },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

PromotionSchema.index({ code: 1 });
PromotionSchema.index({ status: 1, startDate: 1, endDate: 1 });
PromotionSchema.index({ isActive: 1 });

const Promotion = models.Promotion || model<IPromotion>('Promotion', PromotionSchema);
export default Promotion;
