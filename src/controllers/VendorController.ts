import { Request, Response, NextFunction } from "express";
import { CreateFoodInputs, CreateOfferInputs, EditVendorInputs, VendorLoginInput } from "../dto";
import { findVendor } from "./AdminController";
import { GenerateSignature, validatePassword } from "../utilities";
import { Food } from "../models/Food";
import { Order } from "../models/Order";
import { Offer } from "../models/Offer";

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
    const { lat, lng } = req.body;

    if (user) {
        const existingVendor = await findVendor(user._id);
        existingVendor.serviceAvailable = !existingVendor.serviceAvailable;
        if (existingVendor) {
            if (lat && lng) {
                existingVendor.lat = lat;
                existingVendor.lng = lng;
            }

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

export const GetOffers = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    if (user) {
        let currentOffers = [];
        const offers = await Offer.find().populate('vendors');
        if (offers) {
            offers.map(item => {
                if (item.vendors) {
                    item.vendors.map(vendor => {
                        if (vendor._id.toString() === user._id) {
                            currentOffers.push(item);
                        }
                    })
                }
                if (item.offerType === 'GENERIC') {
                    currentOffers.push(item)
                }
            })
            return res.status(200).json({ result: currentOffers });
        }
    }
    return res.status(401).json({ message: 'Unable to process order.' })
}

export const AddOffer = async (req: Request, res: Response, next: NextFunction) => {

    const user = req.user;
    if (user) {
        const {
            offerType,
            vendors,
            title,
            description,
            minValue,
            offerAmount,
            startValidity,
            endValidity,
            promoCode,
            promoType,
            bank,
            bins,
            pinCode,
            isActive
        } = <CreateOfferInputs>req.body;

        const vendor = await findVendor(user._id);
        if (vendor) {
            const offer = await Offer.create({
                offerType,
                vendors: [vendor],
                title,
                description,
                minValue,
                offerAmount,
                startValidity,
                endValidity,
                promoCode,
                promoType,
                bank,
                bins,
                pinCode,
                isActive
            })
            return res.status(200).json({ result: offer });
        }
    }
    return res.status(401).json({ message: 'Unable to Add offer!' });
}

export const EditOffer = async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;
    const offerId = req.params.id;
    if (user) {
        const {
            offerType,
            vendors,
            title,
            description,
            minValue,
            offerAmount,
            startValidity,
            endValidity,
            promoCode,
            promoType,
            bank,
            bins,
            pinCode,
            isActive
        } = <CreateOfferInputs>req.body;

        const currentOffer = await Offer.findById(offerId);
        if (currentOffer) {
            const vendor = await findVendor(user._id);
            if (vendor) {
                currentOffer.offerType = offerType,
                    currentOffer.title = title,
                    currentOffer.description = description,
                    currentOffer.minValue = minValue,
                    currentOffer.offerAmount = offerAmount,
                    currentOffer.startValidity = startValidity,
                    currentOffer.endValidity = endValidity,
                    currentOffer.promoCode = promoCode,
                    currentOffer.promoType = promoType,
                    currentOffer.bank = bank,
                    currentOffer.bins = bins,
                    currentOffer.pinCode = pinCode,
                    currentOffer.isActive = isActive
                const result = await currentOffer.save();
                return res.status(200).json({ result });
            }
        }
    }
    return res.status(401).json({ message: 'Unable to Edit Offer.' })
}
