import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    slug: string;
    parent: Types.ObjectId | null;
    icon: string;
    description: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const CategorySchema = new Schema<ICategory>(
    {
        name: { type: String, required: true },
        slug: { type: String, required: true, unique: true },
        parent: { type: Schema.Types.ObjectId, ref: 'Category', default: null },
        icon: { type: String, default: '' },
        description: { type: String, default: '' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CategorySchema.index({ slug: 1 });
CategorySchema.index({ parent: 1 });

const Category = models.Category || model<ICategory>('Category', CategorySchema);
export default Category;
