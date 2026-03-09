import { Schema, model, models, type Document } from 'mongoose';

export interface IVisitor extends Document {
    count: number;
    label: string;
    createdAt: Date;
    updatedAt: Date;
}

const VisitorSchema = new Schema<IVisitor>(
    {
        count: { type: Number, default: 0 },
        label: { type: String, default: 'total_visitors', unique: true },
    },
    { timestamps: true }
);

const Visitor = models.Visitor || model<IVisitor>('Visitor', VisitorSchema);
export default Visitor;
