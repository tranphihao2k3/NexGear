import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IAttendance extends Document {
    employee: Types.ObjectId;
    date: Date;
    checkIn: Date | null;
    checkOut: Date | null;
    status: 'present' | 'absent' | 'late' | 'leave' | 'holiday';
    reason: string;
    notes: string;
    createdBy: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const AttendanceSchema = new Schema<IAttendance>(
    {
        employee: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, required: true },
        checkIn: { type: Date, default: null },
        checkOut: { type: Date, default: null },
        status: { type: String, enum: ['present', 'absent', 'late', 'leave', 'holiday'], default: 'present' },
        reason: { type: String, default: '' },
        notes: { type: String, default: '' },
        createdBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
    },
    { timestamps: true }
);

AttendanceSchema.index({ employee: 1, date: 1 }, { unique: true });
AttendanceSchema.index({ date: 1 });
AttendanceSchema.index({ status: 1 });

// Trong dev, xóa cache để tránh Mongoose giữ schema cũ sau HMR
if (process.env.NODE_ENV !== 'production' && models.Attendance) {
    delete (models as any).Attendance;
}

const Attendance = models.Attendance || model<IAttendance>('Attendance', AttendanceSchema);
export default Attendance;
