import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ISalary extends Document {
    employee: Types.ObjectId;
    month: number;
    year: number;
    baseSalary: number;
    allowances: number;
    bonuses: number;
    deductions: number;
    workingDays: number;
    actualWorkingDays: number;
    overtimeHours: number;
    grossSalary: number;
    netSalary: number;
    status: 'draft' | 'pending' | 'paid' | 'cancelled';
    paidDate: Date | null;
    notes: string;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const SalarySchema = new Schema<ISalary>(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        baseSalary: { type: Number, required: true },
        allowances: { type: Number, default: 0 },
        bonuses: { type: Number, default: 0 },
        deductions: { type: Number, default: 0 },
        workingDays: { type: Number, default: 0 },
        actualWorkingDays: { type: Number, default: 0 },
        overtimeHours: { type: Number, default: 0 },
        grossSalary: { type: Number, default: 0 },
        netSalary: { type: Number, default: 0 },
        status: { type: String, enum: ['draft', 'pending', 'paid', 'cancelled'], default: 'draft' },
        paidDate: { type: Date, default: null },
        notes: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

SalarySchema.index({ employee: 1, year: 1, month: 1 }, { unique: true });
SalarySchema.index({ status: 1 });

const Salary = models.Salary || model<ISalary>('Salary', SalarySchema);
export default Salary;
