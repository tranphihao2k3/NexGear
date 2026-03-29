import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IService extends Document {
    serviceNumber: string;
    serviceType: 'repair' | 'cleaning' | 'upgrade' | 'warranty' | 'inspection';
    customer: Types.ObjectId | null;
    customerName: string;
    customerPhone: string;
    productInfo: { brand: string; model: string; serialNumber: string; purchaseDate: Date | null };
    images: string[];
    technician: Types.ObjectId | null;
    status: 'pending' | 'diagnosing' | 'in_progress' | 'waiting_parts' | 'completed' | 'cancelled';
    priority: 'low' | 'normal' | 'high' | 'urgent';
    issueDescription: string;
    diagnosis: string;
    estimatedCost: number;
    actualCost: number;
    quotedPrice: number;
    receivedDate: Date;
    estimatedCompletionDate: Date | null;
    completedDate: Date | null;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const ServiceSchema = new Schema<IService>(
    {
        serviceNumber: { type: String, required: true },
        serviceType: { type: String, enum: ['repair', 'cleaning', 'upgrade', 'warranty', 'inspection'], required: true },
        customer: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
        customerName: { type: String, required: true },
        customerPhone: { type: String, required: true },
        productInfo: {
            brand: { type: String, default: '' },
            model: { type: String, default: '' },
            serialNumber: { type: String, default: '' },
            purchaseDate: { type: Date, default: null },
        },
        images: { type: [String], default: [] },
        technician: { type: Schema.Types.ObjectId, ref: 'Employee', default: null },
        status: {
            type: String,
            enum: ['pending', 'diagnosing', 'in_progress', 'waiting_parts', 'completed', 'cancelled'],
            default: 'pending',
        },
        priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
        issueDescription: { type: String, required: true },
        diagnosis: { type: String, default: '' },
        estimatedCost: { type: Number, default: 0 },
        actualCost: { type: Number, default: 0 },
        quotedPrice: { type: Number, default: 0 },
        receivedDate: { type: Date, default: Date.now },
        estimatedCompletionDate: { type: Date, default: null },
        completedDate: { type: Date, default: null },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

ServiceSchema.index({ serviceNumber: 1 }, { unique: true });
ServiceSchema.index({ status: 1, createdAt: -1 });
ServiceSchema.index({ customerPhone: 1 });
ServiceSchema.index({ technician: 1 });

const Service = models.Service || model<IService>('Service', ServiceSchema);
export default Service;
