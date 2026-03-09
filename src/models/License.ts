import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ILicense extends Document {
    key: string;
    hwid: string;
    software: Types.ObjectId;
    expiryDate: Date;
    customerName: string;
    customerPhone: string;
    status: 'active' | 'blocked' | 'expired';
    note: string;
    lastUsed: Date;
    createdAt: Date;
    updatedAt: Date;
}

const LicenseSchema = new Schema<ILicense>(
    {
        key: { type: String, required: true, unique: true, trim: true },
        hwid: { type: String, default: '', trim: true },
        software: { type: Schema.Types.ObjectId, ref: 'Software', required: true },
        expiryDate: { type: Date, required: true },
        customerName: { type: String, default: '', trim: true },
        customerPhone: { type: String, default: '', trim: true },
        status: { type: String, enum: ['active', 'blocked', 'expired'], default: 'active' },
        note: { type: String, default: '' },
        lastUsed: { type: Date, default: Date.now },
    },
    { timestamps: true }
);

LicenseSchema.index({ key: 1 });
LicenseSchema.index({ hwid: 1 });
LicenseSchema.index({ status: 1 });

const License = models.License || model<ILicense>('License', LicenseSchema);
export default License;
