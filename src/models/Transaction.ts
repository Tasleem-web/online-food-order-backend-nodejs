import mongoose, { Schema, Document, Model } from "mongoose";


export interface TransactionDoc extends Document {
    customer: string;
    vendorId: string;
    orderId: string;
    orderValue: number;
    offerUsed: string;
    status: string;
    paymentMode: string;
    paymentResponse: string;
}

const TransactionSchema = new Schema({
    customer: { type: String, required: true },
    vendorId: { type: String },
    orderId: { type: String },
    orderValue: { type: Number },
    offerUsed: { type: String },
    status: { type: String },
    paymentMode: { type: String, required: true },
    paymentResponse: { type: String }
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

const Transaction = mongoose.model<TransactionDoc>('transaction', TransactionSchema);

export { Transaction };