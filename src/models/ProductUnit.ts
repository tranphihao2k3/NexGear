import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IProductUnit extends Document {
    product: Types.ObjectId;
    serialNumber: string;
    barcode: string | null;
    purchasePrice: number;
    sellingPrice: number;
    condition: 'new' | 'like_new' | 'customer_new' | 'good' | 'fair' | 'poor';
    conditionNote: string;
    batteryHealth: number | null;
    batteryCycleCount: number | null;
    source: 'import' | 'trade_sell' | 'repair';
    supplier: Types.ObjectId | null;
    warehouse: Types.ObjectId | null;
    purchaseDate: Date | null;
    warrantyStartDate: Date | null;
    warrantyEndDate: Date | null;
    warrantyProvider: 'manufacturer' | 'store';
    warrantyMonths: number;
    status: 'available' | 'reserved' | 'sold' | 'service' | 'returned' | 'scrapped';
    notes: string;
    images: string[];
    createdAt: Date;
    updatedAt: Date;
}

const ProductUnitSchema = new Schema<IProductUnit>(
    {
        product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        serialNumber: { type: String, required: true, uppercase: true, trim: true },
        barcode: { type: String, default: null, unique: true, sparse: true },
        purchasePrice: { type: Number, required: true, default: 0 },
        sellingPrice: { type: Number, required: true, default: 0 },
        condition: {
            type: String,
            enum: ['new', 'like_new', 'customer_new', 'good', 'fair', 'poor'],
            default: 'new',
        },
        conditionNote: { type: String, default: '' },
        batteryHealth: { type: Number, default: null, min: 0, max: 100 },
        batteryCycleCount: { type: Number, default: null },
        source: { type: String, enum: ['import', 'trade_sell', 'repair'], default: 'import' },
        supplier: { type: Schema.Types.ObjectId, ref: 'Supplier', default: null },
        warehouse: { type: Schema.Types.ObjectId, ref: 'Warehouse', default: null },
        purchaseDate: { type: Date, default: null },
        warrantyStartDate: { type: Date, default: null },
        warrantyEndDate: { type: Date, default: null },
        warrantyProvider: { type: String, enum: ['manufacturer', 'store'], default: 'store' },
        warrantyMonths: { type: Number, default: 12 },
        status: {
            type: String,
            enum: ['available', 'reserved', 'sold', 'service', 'returned', 'scrapped'],
            default: 'available',
        },
        notes: { type: String, default: '' },
        images: { type: [String], default: [] },
    },
    { timestamps: true }
);

ProductUnitSchema.index({ serialNumber: 1 }, { unique: true });
ProductUnitSchema.index({ product: 1, status: 1 });
ProductUnitSchema.index({ status: 1, warehouse: 1 });

ProductUnitSchema.pre('save', function (this: IProductUnit, next: any) {
    if (this.purchaseDate && this.warrantyMonths && !this.warrantyStartDate) {
        this.warrantyStartDate = this.purchaseDate;
        const endDate = new Date(this.purchaseDate);
        endDate.setMonth(endDate.getMonth() + this.warrantyMonths);
        this.warrantyEndDate = endDate;
    }
    next();
});

const ProductUnit = models.ProductUnit || model<IProductUnit>('ProductUnit', ProductUnitSchema);
export default ProductUnit;
