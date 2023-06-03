import mongoose, { Schema, Document, Model } from "mongoose";


export interface OrderDoc extends Document {
    orderId: number;
    vendorId: string;
    items: [any];
    totalAmount: number;
    orderDate: Date;
    paidAmount: number;
    orderStatus: string; // To determine the current status "waiting", "failed", "accept", "reject", "under-process", "ready"
    remarks: string;
    deliveryId: string;
    readyTime: number; // max 60 minutes
}

const orderSchema = new Schema({
    orderId: { type: Number, required: true },
    vendorId: { type: String, required: true },
    items: [
        {
            food: { type: Schema.Types.ObjectId, ref: 'food', required: true },
            unit: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date },
    paidAmount: { type: Number },
    orderStatus: { type: String },
    remarks: { type: String },
    deliveryId: { type: String },
    readyTime: { type: Number },
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

const Order = mongoose.model<OrderDoc>('order', orderSchema);

export { Order };