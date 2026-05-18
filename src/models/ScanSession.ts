import mongoose, { Schema, Document } from 'mongoose';

export interface IScanSession extends Document {
    token: string;
    expiresAt: Date;
    hardware?: {
        cpu?: { 
            name?: string; 
            cores?: string; 
            threads?: string;
            speed?: string;
        };
        ram?: { 
            total?: string; 
            type?: string;
            maxCapacity?: string;
            maxSlots?: string;
            activeSlots?: string;
            emptySlots?: string;
            slots?: Array<{
                bank?: string;
                capacity?: string;
                speed?: string;
                manufacturer?: string;
            }>;
        };
        gpu?: { 
            devices?: Array<{
                name?: string;
                type?: string;
                vram?: string;
                tdp?: string;
            }>;
        };
        storage?: { 
            drives?: Array<{ 
                model?: string; 
                size?: string; 
                busType?: string;
                mediaType?: string;
            }> 
        };
        monitor?: {
            resolution?: string;
            refreshRate?: string;
        };
        wifi?: {
            adapterName?: string;
            currentSsid?: string;
            currentSignal?: string;
            availableNetworks?: Array<{
                ssid?: string;
                signal?: string;
                band?: string;
                auth?: string;
            }>;
        };
        battery?: {
            designCapacity?: string;
            currentCapacity?: string;
            wearLevel?: string;
            status?: string;
            estimatedRuntime?: string;
            voltage?: string;
        };
        system?: { 
            manufacturer?: string; 
            model?: string; 
            os?: string;
        };
    };
    usedAt?: Date;
    status: 'pending' | 'completed' | 'expired';
    createdAt: Date;
}

const ScanSessionSchema = new Schema<IScanSession>(
    {
        token: { type: String, required: true, unique: true, index: true },
        expiresAt: { type: Date, required: true, index: true },
        hardware: { type: Schema.Types.Mixed },
        usedAt: { type: Date },
        status: { type: String, enum: ['pending', 'completed', 'expired'], default: 'pending' },
    },
    { timestamps: true }
);

ScanSessionSchema.index({ createdAt: 1 }, { expireAfterSeconds: 3600 });

export default mongoose.models.ScanSession || mongoose.model<IScanSession>('ScanSession', ScanSessionSchema);
