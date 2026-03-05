import { Schema, model, models, type Document, Types } from 'mongoose';

// Variant sub-schema
const VariantSchema = new Schema(
    {
        name: { type: String, required: true },
        sku: { type: String },
        price: { type: Number },
        stock: { type: Number, default: 0 },
        images: [{ type: String }],
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
    },
    { timestamps: true }
);

// Indexes for performance
ProductSchema.index({ slug: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ category: 1 });
ProductSchema.index({ brand: 1 });
ProductSchema.index({ isActive: 1, isFeatured: 1 });
ProductSchema.index({ tags: 1 });
ProductSchema.index({ basePrice: 1 });
ProductSchema.index({ soldCount: -1 });
ProductSchema.index({ name: 'text', tags: 'text' });

const Product = models.Product || model<IProduct>('Product', ProductSchema);
export default Product;
