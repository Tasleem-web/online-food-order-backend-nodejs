import { Request, Response, NextFunction } from "express";
import { CreateVendorInput } from "../dto";
import { DeliveryUser, Vendor } from "../models";
import { GeneratePassword, GenerateSalt } from "../utilities";
import { Transaction } from "../models/Transaction";

export const findVendor = async (id: string | undefined, email?: string) => {
    if (email) return await Vendor.findOne({ email });
    else return await Vendor.findById(id);
}

export const CreateVendor = async (req: Request, res: Response, next: NextFunction) => {
    const { name, ownerName, foodType, pinCode, address, phone, email, password } = <CreateVendorInput>req.body;

    const existingVendor = await findVendor('', email);
    if (existingVendor) {
        return res.status(403).json({ message: `A Vendor is already exist with this '${email}' email ID.` });
    }

    // Generate a salt
    const salt = await GenerateSalt();
    // Encrypt the password using salt
    const userPassword = await GeneratePassword(password, salt);

    const createVendor = await Vendor.create({
        name,
        ownerName,
        foodType,
        pinCode,
        address,
        phone,
        email,
        password: userPassword,
        salt: salt,
        rating: 0,
        serviceAvailable: false,
        coverImage: [],
        foods: [],
        lat: 0,
        lng: 0
    })

    return res.json({ createVendor });
}

export const GetVendors = async (req: Request, res: Response, next: NextFunction) => {
    const vendors = await Vendor.find();
    if (vendors) {
        return res.status(200).json({ result: vendors, count: vendors.length });
    }

    return res.status(404).json({ result: "Vendors data not available.", count: 0 });
}

export const GetVendorByID = async (req: Request, res: Response, next: NextFunction) => {
    const vendorId = req.params.id;
    const vendor = await findVendor(vendorId);
    if (vendor) {
        return res.status(200).json({ result: vendor });
    }

    return res.status(404).json({ result: "Vendors data not available." });
}

export const GetTransaction = async (req: Request, res: Response, next: NextFunction) => {
    const transactions = await Transaction.find();
    if (transactions) {
        return res.status(200).json({ result: transactions });
    }

    return res.status(404).json({ message: "Transactions not available." });
}

export const GetTransactionById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const transaction = await Transaction.findById(id);
    if (transaction) {
        return res.status(200).json({ result: transaction });
    }

    return res.status(404).json({ message: "Transactions not available." });
}

export const VerifyDeliveryUser = async (req: Request, res: Response, next: NextFunction) => {

    const { _id, status } = req.body;

    if (_id) {
        const profile = await DeliveryUser.findById(_id);
        if (profile) {
            profile.verified = status;
            const result = await profile.save();
            return res.status(200).json({ result });
        }
    }

    return res.status(404).json({ message: "Unable to verify Delivery user." });
}

export const GetDeliveryUser = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUser = await DeliveryUser.find();
    if (deliveryUser) {
        return res.status(200).json({ result: deliveryUser });

    }
    return res.status(404).json({ message: "Unable to get Delivery user." });
}
