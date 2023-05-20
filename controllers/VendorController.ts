import { Request, Response, NextFunction } from "express";
import { EditVendorInputs, VendorLoginInput } from "../dto";
import { findVendor } from "./AdminController";
import { GenerateSignature, validatePassword } from "../utilities";

export const VendorLogin = async (req: Request, res: Response, next: NextFunction) => {

    const { email, password } = <VendorLoginInput>req.body;

    const existingVendor = await findVendor('', email);
    if (existingVendor) {
        const validatingPassword = await validatePassword(password, existingVendor.password, existingVendor.salt);

        if (validatingPassword) {
            const signature = await GenerateSignature({
                _id: existingVendor.id,
                email: existingVendor.email,
                name: existingVendor.name,
                foodTypes: existingVendor.foodType
            })
            return res.status(200).json(signature);
        } else {
            // return res.status(401).json({ message: "Password is not valid." });
            return res.status(401).json({ message: "Invalid credentials." });
        }
    }

    return res.status(401).json({ message: "Invalid credentials." });
}

export const GetVenderProfile = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {
        const existingVendor = await findVendor(user._id);
        return res.status(200).json(existingVendor);
    }

    return res.status(401).json({ message: "Vendor information not found." });
}

export const UpdateVenderProfile = async (req: Request, res: Response, next: NextFunction) => {
    const { name, address, phone, foodTypes } = <EditVendorInputs>req.body;

    const user = req.user;

    if (user) {
        const existingVendor = await findVendor(user._id);
        if (existingVendor) {
            existingVendor.name = name;
            existingVendor.address = address;
            existingVendor.phone = phone;
            existingVendor.foodType = foodTypes;
            const saveResult = await existingVendor.save();
            return res.status(200).json(saveResult);
        }
    }

    return res.status(401).json({ message: "Vendor information not found." });
}

export const UpdateVenderService = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;

    if (user) {
        const existingVendor = await findVendor(user._id);
        if (existingVendor) {
            existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
            const saveResult = await existingVendor.save();
            return res.status(200).json(saveResult);
        }
    }

    return res.status(401).json({ message: "Vendor information not found." });
}

export const AddFood = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {

    }

    return res.status(401).json({ message: 'Something went wrong to add food.' })
}

export const GetFood = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {

    }

    return res.status(401).json({ message: 'Food information not found.' })
}