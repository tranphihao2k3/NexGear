import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IDebt extends Document {
    debtType: 'customer' | 'supplier';
    customer: Types.ObjectId | null;
    supplier: Types.ObjectId | null;
    order: Types.ObjectId | null;
    purchaseOrder: Types.ObjectId | null;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    dueDate: Date | null;
    status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
    description: string;
    notes: string;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const DebtSchema = new Schema<IDebt>(
    {
        debtType: { type: String, enum: ['customer', 'supplier'], required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
        supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
        order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        purchaseOrder: { type: Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null },
        totalAmount: { type: Number, required: true, default: 0 },
        paidAmount: { type: Number, default: 0 },
        remainingAmount: { type: Number, default: 0 },
        dueDate: { type: Date, default: null },
        status: { type: String, enum: ['pending', 'partial', 'paid', 'overdue', 'cancelled'], default: 'pending' },
        description: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

DebtSchema.index({ debtType: 1, status: 1 });
DebtSchema.index({ customer: 1 });
DebtSchema.index({ supplier: 1 });
DebtSchema.index({ dueDate: 1 });

DebtSchema.pre('save', function (this: IDebt, next: any) {
    this.remainingAmount = this.totalAmount - this.paidAmount;
    if (this.remainingAmount <= 0) this.status = 'paid';
    else if (this.dueDate && this.dueDate < new Date()) this.status = 'overdue';
    else if (this.paidAmount > 0) this.status = 'partial';
    next();
});

const Debt = models.Debt || model<IDebt>('Debt', DebtSchema);
export default Debt;
