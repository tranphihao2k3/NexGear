import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IServiceItem extends Document {
    service: Types.ObjectId;
    itemName: string;
    issue: string;
    solution: string;
    quantity: number;
    unitPrice: number;
    warrantyDays: number;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceItemSchema = new Schema<IServiceItem>(
    {
        service: { type: Schema.Types.ObjectId, ref: 'Service', required: true },
        itemName: { type: String, required: true },
        issue: { type: String, default: '' },
        solution: { type: String, default: '' },
        quantity: { type: Number, default: 1 },
        unitPrice: { type: Number, default: 0 },
        warrantyDays: { type: Number, default: 0 },
    },
    { timestamps: true }
);

ServiceItemSchema.index({ service: 1 });

const ServiceItem = models.ServiceItem || model<IServiceItem>('ServiceItem', ServiceItemSchema);
export default ServiceItem;
