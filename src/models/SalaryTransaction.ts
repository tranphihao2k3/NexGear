import { Schema, model, models, type Document, Types } from 'mongoose';

/**
 * SalaryTransaction — Ghi nhận từng khoản thưởng/phạt trong tháng
 * Ví dụ: "50k giao máy", "100k thưởng tối macbook", "4tr2 trả anh thành"
 * Cuối tháng sẽ aggregate tất cả transactions → tạo Salary record
 */
export interface ISalaryTransaction extends Document {
    employee: Types.ObjectId;   // ref Employee
    type: 'bonus' | 'deduction' | 'other';
    amount: number;
    label: string;              // Mô tả: "giao máy", "thưởng tăng ca"
    date: Date;                 // Ngày ghi nhận
    month: number;              // Tháng tính (1-12)
    year: number;
    isAddition?: boolean;       // true: cộng vào lương, false: trừ đi               // Năm
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const SalaryTransactionSchema = new Schema<ISalaryTransaction>(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        type: {
            type: String,
            enum: ['bonus', 'deduction', 'other'],
            required: true,
        },
        amount: { type: Number, required: true, min: 0 },
        label: { type: String, required: true },
        date: { type: Date, default: Date.now },
        month: { type: Number, required: true },
        year: { type: Number, required: true },
        isAddition: { type: Boolean, default: false },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

SalaryTransactionSchema.index({ employee: 1, year: 1, month: 1 });
SalaryTransactionSchema.index({ year: 1, month: 1 });
SalaryTransactionSchema.index({ date: -1 });

// Trong dev, xóa cache để tránh Mongoose giữ schema cũ sau HMR
if (process.env.NODE_ENV !== 'production' && models.SalaryTransaction) {
    delete (models as any).SalaryTransaction;
}

const SalaryTransaction = models.SalaryTransaction ||
    model<ISalaryTransaction>('SalaryTransaction', SalaryTransactionSchema);

export default SalaryTransaction;
