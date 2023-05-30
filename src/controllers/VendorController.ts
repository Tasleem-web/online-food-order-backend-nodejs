import { Request, Response, NextFunction } from "express";
import { CreateFoodInputs, EditVendorInputs, VendorLoginInput } from "../dto";
import { findVendor } from "./AdminController";
import { GenerateSignature, validatePassword } from "../utilities";
import { Food } from "../models/Food";
import { Order } from "../models/Order";

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
        const { name, description, category, foodType, readyTime, price } = <CreateFoodInputs>req.body;
        const vendor = await findVendor(user._id);
        if (vendor) {

            const files = req.files as [Express.Multer.File];
            const images = files.map((file: Express.Multer.File) => file.originalname);

            const createdFood = await Food.create({
                venderId: vendor._id,
                name: name,
                description: description,
                category: category,
                foodType: foodType,
                images: images,
                readyTime: readyTime,
                price: price,
                rating: 0
            })
            vendor.foods.push(createdFood);
            const result = await vendor.save();
            return res.status(200).json(result);
        }
    }

    return res.status(401).json({ message: 'Something went wrong to add food.' })
}

export const GetFoods = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {
        const food = await Food.find({ venderId: user._id });
        if (food) {
            return res.status(200).json(food);
        }
    }

    return res.status(401).json({ message: 'Food information not found.' })
}

export const updateVenderCoverImage = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {
        const vendor = await findVendor(user._id);
        if (vendor) {

            const files = req.files as [Express.Multer.File];
            const images = files.map((file: Express.Multer.File) => file.originalname);

            vendor.coverImage.push(...images);
            const result = await vendor.save();
            return res.status(200).json({ result: result });
        }
    }

    return res.status(401).json({ message: 'Something went wrong to add food.' })
}

export const GetCurrentOrders = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;
    if (user) {
        const orders = await Order.find({ vendorId: user._id }).populate('items.food');
        if (orders) {
            return res.status(200).json({ result: orders });
        }
    }

    return res.status(401).json({ message: 'Order not found.' })
}

export const GetOrderDetails = async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;
    if (orderId) {
        const orders = await Order.findById(orderId).populate('items.food');
        if (orders) {
            return res.status(200).json({ result: orders });
        }
    }
    return res.status(401).json({ message: 'Order not found.' })
}

export const ProcessOrder = async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;
    const { status, remarks, time } = req.body;
    if (orderId) {
        const order = await Order.findById(orderId).populate('items.food');
        order.orderStatus = status;
        order.remarks = remarks;
        time && (order.readyTime = time);
        const orderResult = await order.save();

        if (orderResult) {
            return res.status(200).json({ result: orderResult })
        }
    }
    return res.status(401).json({ message: 'Unable to process order.' })
}
