import { plainToClass } from "class-transformer";
import { NextFunction, Request, Response } from "express";
import { CreateCustomerInputs, CreateDeliveryUserInputs, UserLoginInputs } from "../dto/Customer.dto";
import { validate } from "class-validator";
import { GenerateOtp, GeneratePassword, GenerateSalt, GenerateSignature, OnRequestOtp, validatePassword } from "../utilities";
import { DeliveryUser } from "../models";

export const DeliveryUserSignUp = async (req: Request, res: Response, next: NextFunction) => {
    const deliveryInputs = plainToClass(CreateDeliveryUserInputs, req.body);
    const inputErrors = await validate(deliveryInputs, { validationError: { target: true } });

    if (inputErrors.length) {
        return res.status(400).json({ result: inputErrors });
    }

    const { email, phone, password, firstName, lastName, address, pinCode } = deliveryInputs;
    const salt = await GenerateSalt();
    const userPassword = await GeneratePassword(password, salt);


    const existingDeliveryUser = await DeliveryUser.findOne({ email });
    if (existingDeliveryUser) {
        return res.status(401).json({ message: `An Delivery User is exist with ${email} ID.` });
    }

    const result = await DeliveryUser.create({
        email: email,
        password: userPassword,
        salt: salt,
        phone: phone,
        pinCode: pinCode,
        firstName,
        lastName,
        address,
        verified: false,
        lat: 0,
        lng: 0,
        isAvailable: false
    })

    if (result) {

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

export const DeliveryUserLogin = async (req: Request, res: Response, next: NextFunction) => {

    const loginInputs = plainToClass(UserLoginInputs, req.body);
    const loginErrors = await validate(loginInputs, { validationError: { target: false } });

    if (loginErrors.length) {
        return res.status(400).json({ result: loginErrors });
    }

    const { email, password } = loginInputs;
    const deliveryUser = await DeliveryUser.findOne({ email })

    if (deliveryUser) {
        const validation = await validatePassword(password, deliveryUser.password, deliveryUser.salt);

        if (validation) {

            const signature = await GenerateSignature({
                _id: deliveryUser._id,
                email: deliveryUser.email,
                verified: deliveryUser.verified
            });

            return res.status(201).json({ signature: signature, verified: deliveryUser.verified, email: deliveryUser.email });

        }

    }


    return res.status(404).json({ message: 'Login errors' });
}

export const GetDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUser = req.user;

    if (deliveryUser) {
        const profile = await DeliveryUser.findById(deliveryUser._id);
        if (profile) return res.status(200).json(profile)
    }

    return res.status(401).json({ message: 'Error with Fetch profile.' });
}

export const EditDeliveryUserProfile = async (req: Request, res: Response, next: NextFunction) => {

    const deliveryUser = req.user;

    const profileInputs = plainToClass(CreateDeliveryUserInputs, req.body);
    const profileErrors = await validate(profileInputs, { validationError: { target: false } });

    if (profileErrors.length) {
        return res.status(400).json({ result: profileErrors });
    }

    const { firstName, lastName, address } = profileInputs;

    if (deliveryUser) {
        const profile = await DeliveryUser.findById(deliveryUser._id);
        if (profile) {
            profile.firstName = firstName;
            profile.lastName = lastName;
            profile.address = address;
            const result = await profile.save();
            return res.status(200).json({ result });
        }

    }

    return res.status(403).json({ message: 'Error with edit Delivery User. ' });
}

export const UpdateDeliveryUserStatus = async (req: Request, res: Response, next: NextFunction) => {
    const deliveryUser = req.user;
    if (deliveryUser) {
        const { lat, lng } = req.body;
        const profile = await DeliveryUser.findById(deliveryUser._id);
        if (profile) {
            profile.lat = lat;
            profile.lng = lng;
        }
        profile.isAvailable = !profile.isAvailable;
        const result = await profile.save();
        return res.status(200).json({ result });
    }
    return res.status(401).json({ message: 'Error with signup.' });
}