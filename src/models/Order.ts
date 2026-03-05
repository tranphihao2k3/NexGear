import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IOrder extends Document {
    orderCode: string;
    channel: 'online' | 'pos' | 'phone';
    user: Types.ObjectId | null;
    customerInfo: {
        name: string;
        phone: string;
        email: string;
    };
    items: {
        product: Types.ObjectId;
        variant: Types.ObjectId | null;
        name: string;
        sku: string;
        qty: number;
        unitPrice: number;
        totalPrice: number;
    }[];
    subtotal: number;
    discount: number;
    shippingFee: number;
    total: number;
    coupon: Types.ObjectId | null;
    shippingAddress: {
        name: string;
        phone: string;
        address: string;
        ward: string;
        district: string;
        province: string;
    } | null;
    status: 'pending' | 'confirmed' | 'packing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
    payment: {
        method: 'cash' | 'vnpay' | 'stripe' | 'transfer';
        status: 'pending' | 'paid' | 'failed';
        txnId: string;
        paidAt: Date | null;
    };
    shipping: {
        provider: string;
        trackingCode: string;
        estimatedAt: Date | null;
    };
    timeline: {
        status: string;
        note: string;
        updatedBy: Types.ObjectId;
        updatedAt: Date;
    }[];
    notes: string;
    staffNotes: string;
    processedBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const OrderItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variant: { type: Schema.Types.ObjectId, default: null },
        name: { type: String, required: true },
        sku: { type: String, default: '' },
        qty: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true },
        totalPrice: { type: Number, required: true },
    },
    { _id: false }
);

const TimelineSchema = new Schema(
    {
        status: { type: String, required: true },
        note: { type: String, default: '' },
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        updatedAt: { type: Date, default: Date.now },
    },
    { _id: false }
);

const OrderSchema = new Schema<IOrder>(
    {
        orderCode: { type: String, required: true, unique: true },
        channel: {
            type: String,
            enum: ['online', 'pos', 'phone'],
            default: 'online',
        },
        user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        customerInfo: {
            name: { type: String, default: '' },
            phone: { type: String, default: '' },
            email: { type: String, default: '' },
        },
        items: [OrderItemSchema],
        subtotal: { type: Number, required: true },
        discount: { type: Number, default: 0 },
        shippingFee: { type: Number, default: 0 },
        total: { type: Number, required: true },
        coupon: { type: Schema.Types.ObjectId, ref: 'Coupon', default: null },
        shippingAddress: {
            type: new Schema(
                {
                    name: String,
                    phone: String,
                    address: String,
                    ward: String,
                    district: String,
                    province: String,
                },
                { _id: false }
            ),
            default: null,
        },
        status: {
            type: String,
            enum: ['pending', 'confirmed', 'packing', 'shipped', 'delivered', 'cancelled', 'refunded'],
            default: 'pending',
        },
        payment: {
            method: {
                type: String,
                enum: ['cash', 'vnpay', 'stripe', 'transfer'],
                default: 'cash',
            },
            status: {
                type: String,
                enum: ['pending', 'paid', 'failed'],
                default: 'pending',
            },
            txnId: { type: String, default: '' },
            paidAt: { type: Date, default: null },
        },
        shipping: {
            provider: { type: String, default: '' },
            trackingCode: { type: String, default: '' },
            estimatedAt: { type: Date, default: null },
        },
        timeline: [TimelineSchema],
        notes: { type: String, default: '' },
        staffNotes: { type: String, default: '' },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

// Indexes
// Removed duplicate index for orderCode
OrderSchema.index({ status: 1 });
OrderSchema.index({ user: 1 });
OrderSchema.index({ channel: 1 });
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ 'payment.status': 1 });

const Order = models.Order || model<IOrder>('Order', OrderSchema);
export default Order;
