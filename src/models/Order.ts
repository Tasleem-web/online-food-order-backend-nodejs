import mongoose, { Schema, Document, Model } from "mongoose";


export interface OrderDoc extends Document {
    orderId: number;
    items: [any];
    totalAmount: number;
    orderDate: Date;
    paidThrough: string;
    paymentResponse: string;
    orderStatus: string;
}

const orderSchema = new Schema({
    orderId: { type: Number, required: true },
    items: [
        {
            food: { type: Schema.Types.ObjectId, ref: 'food', required: true },
            unit: { type: Number, required: true }
        }
    ],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date },
    paidThrough: { type: String },
    paymentResponse: { type: String },
    orderStatus: { type: String }
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