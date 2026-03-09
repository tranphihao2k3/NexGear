import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IShipping extends Document {
    order: Types.ObjectId;
    shippingMethod: string;
    trackingNumber: string;
    recipientName: string;
    recipientPhone: string;
    shippingAddress: string;
    status: 'pending' | 'picked_up' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'failed' | 'returned' | 'cancelled';
    shippedDate: Date | null;
    deliveredDate: Date | null;
    shippingCost: number;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const ShippingSchema = new Schema<IShipping>(
    {
        order: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        shippingMethod: { type: String, default: '' },
        trackingNumber: { type: String, default: '' },
        recipientName: { type: String, required: true },
        recipientPhone: { type: String, required: true },
        shippingAddress: { type: String, required: true },
        status: {
            type: String,
            enum: ['pending', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'returned', 'cancelled'],
            default: 'pending',
        },
        shippedDate: { type: Date, default: null },
        deliveredDate: { type: Date, default: null },
        shippingCost: { type: Number, default: 0 },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

ShippingSchema.index({ order: 1 }, { unique: true });
ShippingSchema.index({ trackingNumber: 1 });
ShippingSchema.index({ status: 1 });

const Shipping = models.Shipping || model<IShipping>('Shipping', ShippingSchema);
export default Shipping;
