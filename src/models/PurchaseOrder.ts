import { Schema, model, models, type Document, Types } from 'mongoose';

const PurchaseOrderItemSchema = new Schema(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        productName: { type: String, required: true },
        quantity: { type: Number, required: true, min: 1 },
        unitPrice: { type: Number, required: true, default: 0 },
        totalPrice: { type: Number, default: 0 },
        receivedQuantity: { type: Number, default: 0 },
    },
    { _id: false }
);

export interface IPurchaseOrder extends Document {
    orderNumber: string;
    supplier: Types.ObjectId;
    supplierName: string;
    warehouse: Types.ObjectId;
    items: { product: Types.ObjectId; productName: string; quantity: number; unitPrice: number; totalPrice: number; receivedQuantity: number }[];
    subtotal: number;
    tax: number;
    discount: number;
    totalAmount: number;
    paidAmount: number;
    paymentStatus: 'unpaid' | 'partial' | 'paid';
    paymentMethod: string;
    status: 'draft' | 'ordered' | 'partial' | 'received' | 'cancelled';
    orderDate: Date | null;
    expectedDeliveryDate: Date | null;
    receivedDate: Date | null;
    notes: string;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const PurchaseOrderSchema = new Schema<IPurchaseOrder>(
    {
        orderNumber: { type: String, required: true, unique: true },
        supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', required: true },
        supplierName: { type: String, required: true },
        warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
        items: [PurchaseOrderItemSchema],
        subtotal: { type: Number, default: 0 },
        tax: { type: Number, default: 0 },
        discount: { type: Number, default: 0 },
        totalAmount: { type: Number, default: 0 },
        paidAmount: { type: Number, default: 0 },
        paymentStatus: { type: String, enum: ['unpaid', 'partial', 'paid'], default: 'unpaid' },
        paymentMethod: { type: String, default: '' },
        status: { type: String, enum: ['draft', 'ordered', 'partial', 'received', 'cancelled'], default: 'draft' },
        orderDate: { type: Date, default: null },
        expectedDeliveryDate: { type: Date, default: null },
        receivedDate: { type: Date, default: null },
        notes: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

PurchaseOrderSchema.pre('save', function () {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    this.totalAmount = this.subtotal - this.discount + this.tax;
    if (this.paidAmount >= this.totalAmount) this.paymentStatus = 'paid';
    else if (this.paidAmount > 0) this.paymentStatus = 'partial';
});

PurchaseOrderSchema.index({ orderNumber: 1 }, { unique: true });
PurchaseOrderSchema.index({ supplier: 1, status: 1 });
PurchaseOrderSchema.index({ status: 1, createdAt: -1 });

const PurchaseOrder = models.PurchaseOrder || model<IPurchaseOrder>('PurchaseOrder', PurchaseOrderSchema);
export default PurchaseOrder;
