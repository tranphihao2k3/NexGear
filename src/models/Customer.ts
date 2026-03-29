import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ICustomer extends Document {
    name: string;
    phone: string;
    email: string;
    address: string;
    birthday: Date | null;
    gender: 'male' | 'female' | null;
    orders: Types.ObjectId[];
    loyaltyPoints: number;
    totalSpent: number;
    totalOrders: number;
    customerType: 'regular' | 'vip';
    tags: string[];
    status: 'active' | 'blocked';
    notes: string;
    source: string;
    createdAt: Date;
    updatedAt: Date;
}

const CustomerSchema = new Schema<ICustomer>(
    {
        name: { type: String, required: true, trim: true },
        phone: { type: String, required: true, trim: true },
        email: { type: String, trim: true, lowercase: true },
        address: { type: String, trim: true },
        birthday: { type: Date, default: null },
        gender: { type: String, enum: ['male', 'female'], default: null },
        orders: [{ type: Schema.Types.ObjectId, ref: 'Order' }],
        loyaltyPoints: { type: Number, default: 0 },
        totalSpent: { type: Number, default: 0 },
        totalOrders: { type: Number, default: 0 },
        customerType: { type: String, enum: ['regular', 'vip'], default: 'regular' },
        tags: { type: [String], default: ['New'] },
        status: { type: String, enum: ['active', 'blocked'], default: 'active' },
        notes: { type: String, default: '' },
        source: { type: String, default: 'website' },
    },
    { timestamps: true }
);

CustomerSchema.index({ phone: 1 }, { unique: true });
CustomerSchema.index({ email: 1 });
CustomerSchema.index({ customerType: 1 });
CustomerSchema.index({ totalSpent: -1 });

const Customer = models.Customer || model<ICustomer>('Customer', CustomerSchema);
export default Customer;
