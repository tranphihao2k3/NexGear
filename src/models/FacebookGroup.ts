import mongoose, { Schema, Document, models, model } from 'mongoose';

export interface IFacebookGroup extends Document {
    name: string;
    url: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FacebookGroupSchema = new Schema<IFacebookGroup>(
    {
        name: { type: String, required: true },
        url: { type: String, required: true, unique: true },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default models.FacebookGroup || model<IFacebookGroup>('FacebookGroup', FacebookGroupSchema);
