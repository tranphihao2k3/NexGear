import { Schema, model, models, type Document, Types } from 'mongoose';

export interface IAuditLog extends Document {
    collectionName: string;
    documentId: Types.ObjectId;
    action: 'create' | 'update' | 'delete';
    changes: { before: unknown; after: unknown };
    user: Types.ObjectId | null;
    ipAddress: string;
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const AuditLogSchema = new Schema<IAuditLog>(
    {
        collectionName: { type: String, required: true },
        documentId: { type: Schema.Types.ObjectId, required: true },
        action: { type: String, enum: ['create', 'update', 'delete'], required: true },
        changes: {
            before: { type: Schema.Types.Mixed, default: null },
            after: { type: Schema.Types.Mixed, default: null },
        },
        user: { type: Schema.Types.ObjectId, ref: 'User', default: null },
        ipAddress: { type: String, default: '' },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

AuditLogSchema.index({ collectionName: 1, documentId: 1 });
AuditLogSchema.index({ user: 1, createdAt: -1 });
AuditLogSchema.index({ action: 1, createdAt: -1 });

const AuditLog = models.AuditLog || model<IAuditLog>('AuditLog', AuditLogSchema);
export default AuditLog;
