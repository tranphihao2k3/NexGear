import { Schema, model, models, type Document } from 'mongoose';

export interface IInstallmentEntry {
    loanAmount: number;
    monthly: number;
}

export interface IInstallmentPlan extends Document {
    provider: string;
    term: number; // months
    entries: IInstallmentEntry[];
    note: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const InstallmentEntrySchema = new Schema<IInstallmentEntry>(
    {
        loanAmount: { type: Number, required: true },
        monthly: { type: Number, required: true },
    },
    { _id: false }
);

const InstallmentPlanSchema = new Schema<IInstallmentPlan>(
    {
        provider: { type: String, required: true },
        term: { type: Number, required: true },
        entries: { type: [InstallmentEntrySchema], default: [] },
        note: { type: String, default: '' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

InstallmentPlanSchema.index({ provider: 1, term: 1 }, { unique: true });

const InstallmentPlan = models.InstallmentPlan || model<IInstallmentPlan>('InstallmentPlan', InstallmentPlanSchema);
export default InstallmentPlan;
