import mongoose, { Document, Schema, model, mongo } from "mongoose";

interface VendorDoc extends Document {
    name: string;
    ownerName: string;
    foodType: [string];
    pinCode: string;
    address: string;
    phone: string;
    email: string;
    password: string;
    salt: string;
    serviceAvailable: boolean;
    coverImage: [string];
    rating: number;
    foods: any;
    lat: number;
    lng: number;
}

const VendorSchema = new Schema({
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    foodType: { type: [String] },
    pinCode: { type: String, required: true },
    address: { type: String },
    phone: { type: String, required: true },
    email: { type: String, required: true },
    password: { type: String, required: true },
    salt: { type: String, required: true },
    serviceAvailable: { type: Boolean, required: true },
    coverImage: { type: [String] },
    rating: { type: Number, default: 0 },
    foods: [{
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'food'
    }],
    lat: { type: Number },
    lng: { type: Number }
}, {
    toJSON: {
        transform(doc, ret, options) {
            delete ret.password;
            delete ret.salt;
            delete ret.__v;
            delete ret.createdAt;
            delete ret.updatedAt;
        },
    },
    timestamps: true
});


const Vendor = mongoose.model<VendorDoc>('vendor', VendorSchema);

export { Vendor }