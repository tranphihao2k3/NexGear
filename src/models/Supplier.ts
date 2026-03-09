import { Schema, model, models, type Document } from 'mongoose';

export interface ISupplier extends Document {
    name: string;
    supplierCode: string;
    contact: string;
    contactPerson: string;
    phone: string;
    email: string;
    address: string;
    taxCode: string;
    paymentTerms: string;
    bankInfo: {
        bankName: string;
        accountNumber: string;
        accountHolder: string;
    };
    totalDebt: number;
    rating: number;
    notes: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const SupplierSchema = new Schema<ISupplier>(
    {
        name: { type: String, required: true },
        supplierCode: { type: String, default: '' },
        contact: { type: String, default: '' },
        contactPerson: { type: String, default: '' },
        phone: { type: String, default: '' },
        email: { type: String, default: '' },
        address: { type: String, default: '' },
        taxCode: { type: String, default: '' },
        paymentTerms: { type: String, default: '' },
        bankInfo: {
            bankName: { type: String, default: '' },
            accountNumber: { type: String, default: '' },
            accountHolder: { type: String, default: '' },
        },
        totalDebt: { type: Number, default: 0 },
        rating: { type: Number, default: 0, min: 0, max: 5 },
        notes: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Supplier = models.Supplier || model<ISupplier>('Supplier', SupplierSchema);
export default Supplier;
