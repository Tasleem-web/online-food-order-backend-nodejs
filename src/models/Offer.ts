import mongoose, { Schema, Document, Model } from "mongoose";


export interface OfferDoc extends Document {
    offerType: string; // VENDOR // GENERIC
    vendors: [any]; // ['987456sd8']
    title: string; // INR 200 off on week days
    description: string; //any description with terms and conditions
    minValue: number; //minimum order amount should 300
    offerAmount: number; // 200
    startValidity: Date;
    endValidity: Date;
    promoCode: string; // WEEK200
    promoType: string; // USER // ALL // BANK // CARD
    bank: [any];
    bins: [any];
    pinCode: string;
    isActive: boolean;
}

const orderSchema = new Schema({
    offerType: { type: String, required: true },
    vendors: [{ type: Schema.Types.ObjectId, ref: 'vendor' }],
    title: { type: String, required: true },
    description: { type: String },
    minValue: { type: Number, required: true },
    offerAmount: { type: Number, required: true },
    startValidity: Date,
    endValidity: Date,
    promoCode: { type: String, required: true },
    promoType: { type: String, required: true },
    bank: [{ type: String }],
    bins: [{ type: Number }],
    pinCode: { type: String, required: true },
    isActive: Boolean,
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

const Offer = mongoose.model<OfferDoc>('offer', orderSchema);

export { Offer };