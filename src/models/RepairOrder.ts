import { Schema, model, models, type Document } from 'mongoose';

export interface IRepairOrder extends Document {
    repairNumber: string;
    customerName: string;
    customerPhone: string;
    deviceInfo: { brand: string; model: string };
    issueType: string;
    severity: string;
    description: string;
    images: string[];
    status: 'pending' | 'diagnosing' | 'quoted' | 'repairing' | 'completed' | 'cancelled';
    technicianNote: string;
    quotedPrice: number;
    createdAt: Date;
    updatedAt: Date;
}

const RepairOrderSchema = new Schema<IRepairOrder>({
    repairNumber: { type: String, unique: true },
    customerName: { type: String, default: '' },
    customerPhone: { type: String, required: true },
    deviceInfo: {
        brand: { type: String, default: '' },
        model: { type: String, default: '' },
    },
    issueType: { type: String, required: true },
    severity: { type: String, default: 'Bình thường' },
    description: { type: String, required: true },
    images: { type: [String], default: [] },
    status: {
        type: String,
        enum: ['pending', 'diagnosing', 'quoted', 'repairing', 'completed', 'cancelled'],
        default: 'pending'
    },
    technicianNote: { type: String, default: '' },
    quotedPrice: { type: Number, default: 0 }
}, { timestamps: true });

// Pre-save hook to generate repairNumber
RepairOrderSchema.pre('save', async function () {
    if (!this.repairNumber) {
        let count = 0;
        try {
            count = await model('RepairOrder').countDocuments();
        } catch(e) { /* ignore */ }
        const dateStr = new Date().toISOString().slice(2, 10).replace(/-/g, ''); // YYMMDD
        this.repairNumber = `REP-${dateStr}-${(count + 1).toString().padStart(4, '0')}`;
    }
});

if (models.RepairOrder) {
    delete models.RepairOrder;
}

const RepairOrder = model<IRepairOrder>('RepairOrder', RepairOrderSchema);
export default RepairOrder;
