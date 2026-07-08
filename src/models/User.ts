import mongoose, { Schema, model, models } from 'mongoose';

const UserSchema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        password: { type: String, required: false }, // Null for OAuth users
        image: { type: String },
        role: {
            type: String,
            enum: ['admin', 'superadmin', 'manager', 'staff', 'cashier', 'customer'],
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
        // ── Nhân viên ──
        baseSalary: { type: Number, default: 0 },       // lương cứng (VNĐ)
        leaveQuota: { type: Number, default: 2 },        // số ngày phép/tháng
        // ── Multi-tenant ──
        siteId: { type: String, default: 'laptopthanhvo', index: true }, // shop mà user này thuộc về
    },
    { timestamps: true }
);

// Trong dev, xóa cache để tránh Mongoose giữ schema cũ sau HMR
if (process.env.NODE_ENV !== 'production' && models.User) {
    delete (models as any).User;
}

const User = models.User || model('User', UserSchema);

export default User;
