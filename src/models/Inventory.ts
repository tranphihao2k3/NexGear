import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IInventory extends Document {
    product: Types.ObjectId;
    warehouse: Types.ObjectId;
    quantity: number;
    reservedQuantity: number;
    availableQuantity: number;
    minStock: number;
    maxStock: number;
    reorderPoint: number;
    createdAt: Date;
    updatedAt: Date;
}

const InventorySchema = new Schema<IInventory>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        quantity: { type: Number, default: 0, min: 0 },
        reservedQuantity: { type: Number, default: 0, min: 0 },
        availableQuantity: { type: Number, default: 0, min: 0 },
        minStock: { type: Number, default: 0 },
        maxStock: { type: Number, default: 0 },
        reorderPoint: { type: Number, default: 0 },
    },
    { timestamps: true }
);

InventorySchema.index({ product: 1, warehouse: 1 }, { unique: true });
InventorySchema.index({ warehouse: 1 });
InventorySchema.index({ availableQuantity: 1 });

InventorySchema.pre('save', function () {
    this.availableQuantity = this.quantity - this.reservedQuantity;
});

const Inventory = models.Inventory || model<IInventory>('Inventory', InventorySchema);
export default Inventory;
