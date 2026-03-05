import { Schema, model, models, type Document } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    contact: string;
    phone: string;
    email: string;
    address: string;
    paymentTerms: string;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    notes: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true },
        contact: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        paymentTerms: { type: String, default: '' },
        bankInfo: {
            bankName: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            accountHolder: { type: String, default: '' },
        },
        notes: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Supplier = models.Supplier || model<ISupplier>('Supplier', SupplierSchema);
export default Supplier;
