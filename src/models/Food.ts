import mongoose, { Schema, Document, Model } from "mongoose";


export interface FoodDoc extends Document {
    venderId: number;
    name: string;
    description: string;
    category: string;
    foodType: string;
    readyTime: number;
    price: number;
    rating: number;
    images: [string]
}

const foodSchema = new Schema({
    venderId: { type: String },
    name: { type: String, required: true },
    description: { type: String, required: true },
    category: { type: String },
    foodType: { type: String, required: true },
    readyTime: { type: Number },
    price: { type: Number, required: true },
    rating: { type: String },
    images: { type: [String] }
}, {
    toJSON: {
        transform(doc, ret, options) {
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
        },
    },
    timestamps: true
})

const Food = mongoose.model<FoodDoc>('food', foodSchema);

export { Food };