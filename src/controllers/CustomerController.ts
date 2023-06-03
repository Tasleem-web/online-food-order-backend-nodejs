import { plainToClass } from "class-transformer";
import { Request, Response, NextFunction } from "express";
import { CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs, CardItem, OrderInputs } from "../dto/Customer.dto";
import { validate } from "class-validator";
import { GenerateOtp, GeneratePassword, GenerateSalt, GenerateSignature, OnRequestOtp, validatePassword } from "../utilities";
import { Customer } from "../models/Customer";
import { Food } from "../models/Food";
import { Order } from "../models/Order";
import { Offer } from "../models/Offer";
import { Transaction } from "../models/Transaction";
import { DeliveryUser, Vendor } from "../models";

export const CustomerSignUp = async (req: Request, res: Response, next: NextFunction) => {
    const customerInputs = plainToClass(CreateCustomerInputs, req.body);
    const inputErrors = await validate(customerInputs, { validationError: { target: true } });

    if (inputErrors.length) {
        return res.status(400).json({ result: inputErrors });
    }

    const { email, phone, password } = customerInputs;
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);

    const { otp, expiry } = GenerateOtp();


    const existingCustomer = await Customer.findOne({ email });
    if (existingCustomer) {
        return res.status(401).json({ message: `An User is exist with ${email} ID.` });
    }

    const result = await Customer.create({
        email: email,
        password: userPassword,
        salt: salt,
        phone: phone,
        otp: otp,
        otp_expiry: expiry,
        firstName: '',
        lastName: '',
        address: '',
        verified: false,
        lat: 0,
        lng: 0,
        orders: []
    })

    if (result) {
        // send the OTP to customer
        await OnRequestOtp(otp, phone);

        // generate the signature

        const signature = await GenerateSignature({
            _id: result._id,
            email: result.email,
            verified: result.verified
        });

        // send the result to client

        return res.status(201).json({ signature: signature, verified: result.verified, email: result.email });
    }

    return res.status(401).json({ message: 'Error with signup.' });
}

export const CustomerLogin = async (req: Request, res: Response, next: NextFunction) => {

    const loginInputs = plainToClass(UserLoginInputs, req.body);
    const loginErrors = await validate(loginInputs, { validationError: { target: false } });

    if (loginErrors.length) {
        return res.status(400).json({ result: loginErrors });
    }

    const { email, password } = loginInputs;
    const customer = await Customer.findOne({ email })

    if (customer) {
        const validation = await validatePassword(password, customer.password, customer.salt);

        if (validation) {

            const signature = await GenerateSignature({
                _id: customer._id,
                email: customer.email,
                verified: customer.verified
            });

            return res.status(201).json({ signature: signature, verified: customer.verified, email: customer.email });

        }

    }


    return res.status(404).json({ message: 'Login errors' });
}

export const CustomerVerify = async (req: Request, res: Response, next: NextFunction) => {

    const { otp } = req.body;
    const customer = req.user;
    if (customer) {
        const profile = await Customer.findById(customer._id);

        if (profile) {
            if (profile.otp == otp && profile.otp_expiry >= new Date()) {
                profile.verified = true;

                const updatedCustomerResponse = await profile.save();

                // generate the signature

                const signature = await GenerateSignature({
                    _id: updatedCustomerResponse._id,
                    email: updatedCustomerResponse.email,
                    verified: updatedCustomerResponse.verified
                });
                return res.status(201).json({
                    signature: signature,
                    verified: updatedCustomerResponse.verified,
                    email: updatedCustomerResponse.email
                });
            }
        }
        return res.status(401).json({ message: 'Error with OTP validation.' });

    }

    return res.status(403).json({ message: 'Customer Controller called!' });
}

export const RequestOtp = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;
    if (customer) {
        const profile = await Customer.findById(customer._id);

        if (profile) {
            const { otp, expiry } = await GenerateOtp();
            profile.otp = otp;
            profile.otp_expiry = expiry;
            await profile.save();
            await OnRequestOtp(otp, profile.phone);
            return res.status(200).json({ message: 'OTP sent to register phone number.' });
        }
    }

    return res.status(403).json({ message: 'Error with Request OTP.' });
}

export const GetCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;

    if (customer) {
        const profile = await Customer.findById(customer._id);
        if (profile) {
            return res.status(403).json({ result: profile });
        }
    }

    return res.status(403).json({ message: 'Customer Controller called!' });
}

export const EditCustomerProfile = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    const profileInputs = plainToClass(EditCustomerProfileInputs, req.body);
    const profileErrors = await validate(profileInputs, { validationError: { target: false } });

    if (profileErrors.length) {
        return res.status(400).json({ result: profileErrors });
    }

    const { firstName, lastName, address } = profileInputs;

    if (customer) {
        const profile = await Customer.findById(customer._id);
        if (profile) {
            profile.firstName = firstName;
            profile.lastName = lastName;
            profile.address = address;
            const result = await profile.save();
            return res.status(200).json({ result });
        }

    }

    return res.status(403).json({ message: 'Error with edit customer. ' });
}

// Delivery Transaction

const assignOrderForDelivery = async (orderId: string, vendorId: string) => {

    // Find the vendor
    const vendor = await Vendor.findById(vendorId);
    if (vendor) {
        const areaCode = vendor.pinCode;
        const vendorLat = vendor.lat;
        const vendorLng = vendor.lng;
        // find the available delivery person
        const deliveryPerson = await DeliveryUser.find({ pinCode: areaCode, verified: true, isAvailable: true });

        if (deliveryPerson) {
            console.log({ deliveryPerson });

            const currentOrder = await Order.findById(orderId);
            currentOrder.deliveryId = deliveryPerson[0]._id;
            const result = await currentOrder.save();
            console.log({ result });

        }
    }


    // check the nearest delivery person and assign the order


}

const validateTransaction = async (txnId: string) => {
    const currentTransaction = await Transaction.findById(txnId);
    if (currentTransaction) {
        if (currentTransaction.status.toLowerCase() !== 'failed') {
            return { status: true, currentTransaction }
        }
    }
    return { status: false, currentTransaction };
}

export const CreateOrder = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;
    const { txnId, amount, items } = <OrderInputs>req.body;

    if (customer) {

        const { status, currentTransaction } = await validateTransaction(txnId);

        if (!status) {
            return res.status(404).json({ message: "Error with create order." });
        }

        const orderId = `${Math.floor(Math.random() * 89999) + 1000}`;
        const profile = await Customer.findById(customer._id);

        let cartItems = [];
        let netAmount = 0.0;

        // calculate order amount
        const foods = await Food.find().where('_id').in(items.map(item => item._id)).exec();
        let vendorId;
        foods.map(food => {
            items.map(({ _id, unit }) => {
                if (food._id == _id) {
                    vendorId = food.vendorId;
                    netAmount += (food.price * unit);
                    cartItems.push({ food, unit })
                } else {
                    console.log(`${food._id} / ${_id}`);
                }
            })
        })

        if (cartItems) {
            const currentOrder = await Order.create({
                orderId: orderId,
                vendorId: vendorId,
                items: cartItems,
                totalAmount: netAmount,
                paidAmount: amount,
                orderDate: new Date(),
                orderStatus: 'waiting',
                remarks: '',
                deliveryId: '',
                readyTime: 45,
            })
            profile.cart = [] as any;
            profile.orders.push(currentOrder);

            currentTransaction.vendorId = vendorId;
            currentTransaction.orderId = orderId;
            currentTransaction.status = 'CONFIRMED';

            await currentTransaction.save();

            assignOrderForDelivery(currentOrder._id, vendorId);

            if (currentOrder) {
                profile.orders.push(currentOrder);
                await profile.save();
                return res.status(201).json({ result: currentOrder });
            }
        }

    }
    return res.status(400).json({ message: "Error with create order." });
}

export const GetOrders = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;

    if (customer) {
        const profile = await Customer.findById(customer._id).populate('orders');
        return res.status(200).json({ result: profile.orders })
    }
    return res.status(400).json({ message: "Error with Fetch orders." });
}

export const GetOrderById = async (req: Request, res: Response, next: NextFunction) => {
    const orderId = req.params.id;

    if (orderId) {
        const order = await Order.findById(orderId).populate('items.food');
        return res.status(200).json({ result: order })
    }
    return res.status(400).json({ message: "Error with get order by ID." });
}

export const AddToCart = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;

    if (customer) {
        const profile = await Customer.findById(customer._id).populate('cart.food');
        let cartItems = [];
        const { _id, unit } = <CardItem>req.body;

        const food = await Food.findById(_id);
        if (food && profile) {
            cartItems = profile.cart;
            if (cartItems.length) {
                // check and update unit
                let existFoodItem = cartItems.filter(item => item.food._id == _id);
                if (existFoodItem.length) {
                    const index = cartItems.indexOf(existFoodItem[0]);
                    if (unit > 0) {
                        cartItems[index] = { food, unit };
                    } else {
                        cartItems.splice(index, 1);
                    }
                } else {
                    cartItems.push({ food, unit });
                }
            } else {
                // add new item to cart
                cartItems.push({ food, unit });
            }
        }
        if (cartItems) {
            profile.cart = cartItems as any;
            const cartResult = await profile.save();
            return res.status(200).json(cartResult.cart);
        }
    }
    return res.status(400).json({ message: "Unable to create Cart." });
}

export const GetCart = async (req: Request, res: Response, next: NextFunction) => {

    const customer = req.user;
    if (customer) {
        const profile = await Customer.findById(customer._id).populate('cart.food');
        if (profile) {
            return res.status(200).json(profile.cart);
        }
    }

    return res.status(400).json({ message: "Cart is empty." });
}

export const DeleteCart = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;

    if (customer) {
        const profile = await Customer.findById(customer._id).populate('cart.food');
        if (profile) {
            profile.cart = [] as any;
            const cartResult = await profile.save();
            return res.status(200).json(cartResult);
        }
    }

    return res.status(400).json({ message: "Cart already is empty." });
}

export const VerifyOffer = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;
    const offerId = req.params.id;
    if (customer) {
        const appliedOffer = await Offer.findById(offerId);
        if (appliedOffer) {
            if (appliedOffer.promoType === 'USER') {
                // only can apply once per user
            } else {
                if (appliedOffer.isActive) {
                    return res.status(200).json({ message: "Offer is valid.", result: appliedOffer });
                }
            }
        }
    }

    return res.status(400).json({ message: "Offer is not valid." });
}

export const CreatePayment = async (req: Request, res: Response, next: NextFunction) => {
    const customer = req.user;
    const { amount, paymentMode, offerId } = req.body;
    let payableAmount = Number(amount);

    if (customer && offerId) {
        const appliedOffer = await Offer.findById(offerId);
        if (appliedOffer) {
            if (appliedOffer.isActive) {
                payableAmount = (payableAmount - appliedOffer.offerAmount);
            }
        }
    }

    // Create record on Transaction
    const transaction = await Transaction.create({
        customer: customer._id,
        vendorId: '',
        orderId: '',
        orderValue: payableAmount,
        offerUsed: offerId || 'NA',
        status: 'OPEN',
        paymentMode: paymentMode,
        paymentResponse: 'Payment is Cash On Delivery',
    });


    return res.status(200).json({ result: transaction });

    // return res.status(400).json({ message: "Offer is not valid." });
}