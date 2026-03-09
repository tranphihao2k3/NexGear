import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IFeedback extends Document {
    customerName: string;
    customerEmail: string;
    customerPhone: string;
    type: 'contact' | 'feedback' | 'complaint' | 'suggestion';
    subject: string;
    message: string;
    status: 'new' | 'pending' | 'replied' | 'resolved' | 'closed';
    reply: string;
    repliedBy: Types.ObjectId | null;
    repliedAt: Date | null;
    order: Types.ObjectId | null;
    product: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>(
    {
        customerName: { type: String, required: true },
        customerEmail: { type: String, default: '' },
        customerPhone: { type: String, default: '' },
        type: { type: String, enum: ['contact', 'feedback', 'complaint', 'suggestion'], default: 'feedback' },
        subject: { type: String, required: true },
        message: { type: String, required: true },
        status: { type: String, enum: ['new', 'pending', 'replied', 'resolved', 'closed'], default: 'new' },
        reply: { type: String, default: '' },
        repliedBy: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        repliedAt: { type: Date, default: null },
        order: { type: Schema.Types.ObjectId, ref: 'Order', default: null },
        product: { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    },
    { timestamps: true }
);

FeedbackSchema.index({ status: 1, createdAt: -1 });
FeedbackSchema.index({ type: 1 });

const Feedback = models.Feedback || model<IFeedback>('Feedback', FeedbackSchema);
export default Feedback;
