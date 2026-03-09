import { Schema, model, models, type Document } from 'mongoose';

export interface IComponent extends Document {
    name: string;
    type: 'RAM' | 'SSD' | 'MOUSE' | 'KEYBOARD' | 'CPU' | 'VGA' | 'MAINBOARD' | 'PSU' | 'CASE' | 'COOLING' | 'OTHER';
    specs: Record<string, unknown>;
    price: number;
    image: string;
    stock: number;
    description: string;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const ComponentSchema = new Schema<IComponent>(
    {
        name: { type: String, required: true, trim: true },
        type: { type: String, required: true, enum: ['RAM', 'SSD', 'MOUSE', 'KEYBOARD', 'CPU', 'VGA', 'MAINBOARD', 'PSU', 'CASE', 'COOLING', 'OTHER'] },
        specs: { type: Object, default: {} },
        price: { type: Number, required: true, min: 0 },
        image: { type: String, default: '' },
        stock: { type: Number, default: 0 },
        description: { type: String, trim: true },
        active: { type: Boolean, default: true },
    },
    { timestamps: true }
);

const Component = models.Component || model<IComponent>('Component', ComponentSchema);
export default Component;
