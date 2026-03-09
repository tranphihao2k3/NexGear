import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ILoyaltyPoints extends Document {
    customer: Types.ObjectId;
    points: number;
    pointsType: 'earned' | 'redeemed' | 'expired' | 'adjusted';
    order: Types.ObjectId | null;
    description: string;
    expiryDate: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const LoyaltyPointsSchema = new Schema<ILoyaltyPoints>(
    {
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', required: true },
        points: { type: Number, required: true },
        pointsType: { type: String, enum: ['earned', 'redeemed', 'expired', 'adjusted'], required: true },
        order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        description: { type: String, required: true },
        expiryDate: { type: Date, default: null },
    },
    { timestamps: true }
);

LoyaltyPointsSchema.index({ customer: 1, createdAt: -1 });
LoyaltyPointsSchema.index({ order: 1 });
LoyaltyPointsSchema.index({ expiryDate: 1 });

const LoyaltyPoints = models.LoyaltyPoints || model<ILoyaltyPoints>('LoyaltyPoints', LoyaltyPointsSchema);
export default LoyaltyPoints;
