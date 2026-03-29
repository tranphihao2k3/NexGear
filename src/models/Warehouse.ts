import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IWarehouse extends Document {
    warehouseCode: string;
    name: string;
    address: string;
    managerId: Types.ObjectId | null;
    capacity: number;
    currentStock: number;
    isDefault: boolean;
    status: 'active' | 'inactive';
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const WarehouseSchema = new Schema<IWarehouse>(
    {
        warehouseCode: { type: String, required: true },
        name: { type: String, required: true },
        address: { type: String, default: '' },
        managerId: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        capacity: { type: Number, default: 0 },
        currentStock: { type: Number, default: 0 },
        isDefault: { type: Boolean, default: false },
        status: { type: String, enum: ['active', 'inactive'], default: 'active' },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

WarehouseSchema.index({ warehouseCode: 1 }, { unique: true });
WarehouseSchema.index({ isDefault: 1 });
WarehouseSchema.index({ status: 1 });

const Warehouse = models.Warehouse || model<IWarehouse>('Warehouse', WarehouseSchema);
export default Warehouse;
