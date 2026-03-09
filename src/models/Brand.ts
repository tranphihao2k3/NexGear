import { Schema, model, models, type Document } from 'mongoose';

export interface IBrand extends Document {
    name: string;
    slug: string;
    logo: string;
    country: string;
    description: string;
    website: string;
    isActive: boolean;
    metaTitle: string;
    metaDescription: string;
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
        website: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
        metaTitle: { type: String, default: '' },
        metaDescription: { type: String, default: '' },
    },
    { timestamps: true }
);

const Brand = models.Brand || model<IBrand>('Brand', BrandSchema);
export default Brand;
