import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IInventoryLog extends Document {
    product: Types.ObjectId;
    type: 'import' | 'sale' | 'return' | 'adjustment' | 'damage' | 'transfer';
    quantity: number;
    stockBefore: number;
    stockAfter: number;
    costPrice: number | null;
    totalCost: number | null;
    supplier: Types.ObjectId | null;
    reference: string;
    note: string;
    createdBy: Types.ObjectId;
    createdAt: Date;
}

const InventoryLogSchema = new Schema<IInventoryLog>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        type: {
            type: String,
            enum: ['import', 'sale', 'return', 'adjustment', 'damage', 'transfer'],
            required: true,
        },
        quantity: { type: Number, required: true },
        stockBefore: { type: Number, required: true },
        stockAfter: { type: Number, required: true },
        costPrice: { type: Number, default: null },
        totalCost: { type: Number, default: null },
        supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
        reference: { type: String, default: '' },
        note: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: { createdAt: true, updatedAt: false } }
);

InventoryLogSchema.index({ product: 1, createdAt: -1 });
InventoryLogSchema.index({ type: 1 });
InventoryLogSchema.index({ createdAt: -1 });

const InventoryLog = models.InventoryLog || model<IInventoryLog>('InventoryLog', InventoryLogSchema);
export default InventoryLog;
