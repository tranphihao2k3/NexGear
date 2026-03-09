import { Schema, model, models, type Document } from 'mongoose';

export interface IEmployee extends Document {
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    salary: number;
    hireDate: Date;
    status: 'active' | 'on_leave' | 'suspended' | 'terminated';
    profileImage: string;
    address: string;
    identityCard: string;
    birthday: Date | null;
    notes: string;
    createdAt: Date;
    updatedAt: Date;
}

const EmployeeSchema = new Schema<IEmployee>(
    {
        employeeCode: { type: String, required: true, unique: true },
        firstName: { type: String, required: true },
        lastName: { type: String, required: true },
        email: { type: String, unique: true, sparse: true },
        phone: { type: String, required: true },
        position: {
            type: String,
            enum: ['admin', 'manager', 'sales', 'technician', 'accountant', 'warehouse', 'receptionist'],
            default: 'sales',
        },
        department: { type: String, default: '' },
        salary: { type: Number, default: 0 },
        hireDate: { type: Date, default: Date.now },
        status: {
            type: String,
            enum: ['active', 'on_leave', 'suspended', 'terminated'],
            default: 'active',
        },
        profileImage: { type: String, default: '' },
        address: { type: String, default: '' },
        identityCard: { type: String, default: '' },
        birthday: { type: Date, default: null },
        notes: { type: String, default: '' },
    },
    { timestamps: true }
);

EmployeeSchema.index({ employeeCode: 1 }, { unique: true });
EmployeeSchema.index({ phone: 1 });
EmployeeSchema.index({ position: 1 });
EmployeeSchema.index({ status: 1 });

EmployeeSchema.virtual('fullName').get(function () {
    return `${this.firstName} ${this.lastName}`;
});

const Employee = models.Employee || model<IEmployee>('Employee', EmployeeSchema);
export default Employee;
