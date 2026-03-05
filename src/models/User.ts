import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false }, // Null for OAuth users
        image: { type: String },
        role: {
            type: String,
            enum: ['admin', 'manager', 'staff', 'cashier', 'customer'],
            default: 'customer',
        },
        addresses: [
            {
                name: String,
                phone: String,
                address: String,
                ward: String,
                district: String,
                province: String,
                isDefault: Boolean,
            },
        ],
        wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
        totalSpent: { type: Number, default: 0 },
        loyaltyPoints: { type: Number, default: 0 },
    },
    { timestamps: true }
);

const User = models.User || model('User', UserSchema);

export default User;
