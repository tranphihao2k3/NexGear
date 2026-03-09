import { Schema, model, models, type Document, Types } from 'mongoose';

export interface INotification extends Document {
    user: Types.ObjectId | null;
    type: 'order' | 'payment' | 'warranty' | 'inventory' | 'system' | 'promotion';
    title: string;
    message: string;
    referenceType: string | null;
    referenceId: Types.ObjectId | null;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    isRead: boolean;
    readAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
}

const NotificationSchema = new Schema<INotification>(
    {
        user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        type: { type: String, enum: ['order', 'payment', 'warranty', 'inventory', 'system', 'promotion'], required: true },
        title: { type: String, required: true },
        message: { type: String, required: true },
        referenceType: { type: String, default: null },
        referenceId: { type: Schema.Types.ObjectId, default: null },
        priority: { type: String, enum: ['low', 'normal', 'high', 'urgent'], default: 'normal' },
        isRead: { type: Boolean, default: false },
        readAt: { type: Date, default: null },
    },
    { timestamps: true }
);

NotificationSchema.index({ user: 1, isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, createdAt: -1 });

const Notification = models.Notification || model<INotification>('Notification', NotificationSchema);
export default Notification;
