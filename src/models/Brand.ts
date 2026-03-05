import { Schema, model, models, type Document } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    slug: string;
    logo: string;
    country: string;
    description: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const BrandSchema = new Schema<IBrand>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        logo: { type: String, default: '' },
        country: { type: String, default: '' },
        description: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

BrandSchema.index({ slug: 1 });

const Brand = models.Brand || model<IBrand>('Brand', BrandSchema);
export default Brand;
