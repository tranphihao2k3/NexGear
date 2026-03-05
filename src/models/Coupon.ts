import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ICoupon extends Document {
    code: string;
    type: 'percent' | 'fixed' | 'shipping';
    value: number;
    minOrderValue: number;
    maxDiscount: number | null;
    maxUses: number;
    usedCount: number;
    usedBy: Types.ObjectId[];
    startAt: Date;
    expireAt: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CouponSchema = new Schema<ICoupon>(
    {
        code: { type: String, required: true, unique: true, uppercase: true },
        type: {
            type: String,
            enum: ['percent', 'fixed', 'shipping'],
            required: true,
        },
        value: { type: Number, required: true },
        minOrderValue: { type: Number, default: 0 },
        maxDiscount: { type: Number, default: null },
        maxUses: { type: Number, default: 0 },
        usedCount: { type: Number, default: 0 },
        usedBy: [{ type: Schema.Types.ObjectId, ref: 'User' }],
        startAt: { type: Date, required: true },
        expireAt: { type: Date, required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CouponSchema.index({ code: 1 });
CouponSchema.index({ isActive: 1, expireAt: 1 });

const Coupon = models.Coupon || model<ICoupon>('Coupon', CouponSchema);
export default Coupon;
