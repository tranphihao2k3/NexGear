import { Schema, model, models, type Document } from 'mongoose';

export interface IPopupBanner extends Document {
    title: string;
    imageUrl: string;
    link: string;
    isActive: boolean;
    displayDelay: number;
    updatedAt: Date;
}

const PopupBannerSchema = new Schema<IPopupBanner>({
    title: { type: String, required: true },
    imageUrl: { type: String, required: true },
    link: { type: String, default: '' },
    isActive: { type: Boolean, default: false },
    displayDelay: { type: Number, default: 2000 },
    updatedAt: { type: Date, default: Date.now },
});

const PopupBanner = models.PopupBanner || model<IPopupBanner>('PopupBanner', PopupBannerSchema);
export default PopupBanner;
