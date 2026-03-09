import { Schema, model, models, type Document } from 'mongoose';

export interface IFAQ extends Document {
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const FAQSchema = new Schema<IFAQ>(
    {
        question: { type: String, required: true },
        answer: { type: String, required: true },
        category: { type: String, default: 'general' },
        order: { type: Number, default: 0 },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

FAQSchema.index({ category: 1, order: 1 });
FAQSchema.index({ isActive: 1 });

const FAQ = models.FAQ || model<IFAQ>('FAQ', FAQSchema);
export default FAQ;
