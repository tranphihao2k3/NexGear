import { Schema, model, models, type Document, Types } from 'mongoose';

// Variant attribute sub-schema (e.g. { key: "RAM", value: "16GB" })
const VariantAttributeSchema = new Schema(
    {
        key: { type: String, required: true },
        value: { type: String, required: true },
    },
    { _id: false }
);

// Variant sub-schema
const VariantSchema = new Schema(
    {
        name: { type: String, required: true },
        sku: { type: String },
        price: { type: Number },
        stock: { type: Number, default: 0 },
        images: [{ type: String }],
        attributes: [VariantAttributeSchema],
    },
    { _id: true }
);

export interface IProduct extends Document {
    name: string;
    slug: string;
    sku: string;
    barcode: string;
    category: Types.ObjectId;
    brand: Types.ObjectId;
    variants: {
        _id: Types.ObjectId;
        name: string;
        sku: string;
        price: number;
        stock: number;
        images: string[];
        attributes: { key: string; value: string }[];
    }[];
    basePrice: number;
    salePrice: number | null;
    costPrice: number;
    stock: number;
    lowStockAlert: number;
    images: string[];
    description: string;
    specs: Record<string, unknown>;
    tags: string[];
    ratings: { avg: number; count: number };
    soldCount: number;
    isActive: boolean;
    isFeatured: boolean;
    seoTitle: string;
    seoDesc: string;
    // --- Fields from LapLap ---
    isUsed: boolean;
    condition: 'new' | 'like_new' | 'used' | 'refurbished';
    usedGrade: 'A' | 'B' | 'C' | null;
    conditionNote: string;
    warranty: { duration: number; items: string[] };
    warrantyMonths: number;
    viewCount: number;
    gift: string;
    source: 'nexgear' | 'laplap';
    createdAt: Date;
    updatedAt: Date;
}

const ProductSchema = new Schema<IProduct>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        sku: { type: String, required: true, unique: true },
        barcode: { type: String, default: '' },
        category: { type: Schema.Types.ObjectId, ref: 'Category', required: true },
        brand: { type: Schema.Types.ObjectId, ref: 'Brand', required: true },
        variants: [VariantSchema],
        basePrice: { type: Number, required: true },
        salePrice: { type: Number, default: null },
        costPrice: { type: Number, default: 0 },
        stock: { type: Number, default: 0 },
        lowStockAlert: { type: Number, default: 5 },
        images: [{ type: String }],
        description: { type: String, default: '' },
        specs: { type: Schema.Types.Mixed, default: {} },
        tags: [{ type: String }],
        ratings: {
            avg: { type: Number, default: 0 },
            count: { type: Number, default: 0 },
        },
        soldCount: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
        isFeatured: { type: Boolean, default: false },
        seoTitle: { type: String, default: '' },
        seoDesc: { type: String, default: '' },
        // --- Fields from LapLap ---
        isUsed: { type: Boolean, default: false },
        condition: {
            type: String,
            enum: ['new', 'like_new', 'used', 'refurbished'],
            default: 'new',
        },
        usedGrade: { type: String, enum: ['A', 'B', 'C'], default: null },
        conditionNote: { type: String, default: '' },
        warranty: {
            duration: { type: Number, default: 0 },
            items: [{ type: String }],
        },
        warrantyMonths: { type: Number, default: 12 },
        viewCount: { type: Number, default: 0 },
        gift: { type: String, default: '' },
        source: { type: String, enum: ['nexgear', 'laplap'], default: 'nexgear' },
    },
    { timestamps: true }
);

// Indexes for performance
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ name: 'text', tags: 'text' });
ProductSchema.index({ isUsed: 1, condition: 1 });
ProductSchema.index({ source: 1 });

const Product = models.Product || model<IProduct>('Product', ProductSchema);
export default Product;
