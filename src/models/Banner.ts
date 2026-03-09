import { Schema, model, models, type Document } from 'mongoose';

export interface IBanner extends Document {
    title: string;
    image: string;
    link: string;
    position: 'home' | 'promotion' | 'banner' | 'popup';
    order: number;
    startDate: Date | null;
    endDate: Date | null;
    status: 'active' | 'inactive' | 'scheduled';
    description: string;
    createdAt: Date;
    updatedAt: Date;
}

const BannerSchema = new Schema<IBanner>(
    {
        title: { type: String, required: true },
        image: { type: String, required: true },
        link: { type: String, default: '' },
        position: { type: String, enum: ['home', 'promotion', 'banner', 'popup'], default: 'home' },
        order: { type: Number, default: 0 },
        startDate: { type: Date, default: null },
        endDate: { type: Date, default: null },
        status: { type: String, enum: ['active', 'inactive', 'scheduled'], default: 'active' },
        description: { type: String, default: '' },
    },
    { timestamps: true }
);

BannerSchema.index({ position: 1, order: 1 });
BannerSchema.index({ status: 1, startDate: 1, endDate: 1 });

const Banner = models.Banner || model<IBanner>('Banner', BannerSchema);
export default Banner;
