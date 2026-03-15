import { Schema, model, models, type Document, Types } from 'mongoose';

export interface ISalary extends Document {
    employee: Types.ObjectId;   // ref: User
    month: number;
    year: number;
    baseSalary: number;
    allowances: number;
    bonuses: number;             // Tổng thưởng từ SalaryTransaction
    deductions: number;          // Tổng khấu trừ (transactions + nghỉ quá phép)
    // ── Phép nghỉ ──
    leaveQuota: number;          // Số ngày phép được cấp trong tháng
    leaveUsed: number;           // Số ngày đã dùng (status='leave' trong Attendance)
    absentDays: number;          // Số ngày vắng không phép (status='absent')
    leaveDeduction: number;      // Tiền trừ do nghỉ quá phép/vắng: (salary/30) * ngày
    // ──────────────
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
        // Phép nghỉ
        leaveQuota: { type: Number, default: 0 },
        leaveUsed: { type: Number, default: 0 },
        absentDays: { type: Number, default: 0 },
        leaveDeduction: { type: Number, default: 0 },
        //
        workingDays: { type: Number, default: 26 },
        actualWorkingDays: { type: Number, default: 26 },
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

// Trong dev, xóa cache để tránh Mongoose giữ schema cũ sau HMR
if (process.env.NODE_ENV !== 'production' && models.Salary) {
    delete (models as any).Salary;
}

const Salary = models.Salary || model<ISalary>('Salary', SalarySchema);
export default Salary;
