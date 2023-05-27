import { plainToClass } from "class-transformer";
import { Request, Response, NextFunction } from "express";
import { CreateCustomerInputs, UserLoginInputs, EditCustomerProfileInputs } from "../dto/Customer.dto";
import { validate } from "class-validator";
import { GenerateOtp, GeneratePassword, GenerateSalt, GenerateSignature, OnRequestOtp, validatePassword } from "../utilities";
import { Customer } from "../models/Customer";

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
        otp: otp,
        otp_expiry: expiry,
        firstName: '',
        lastName: '',
        address: '',
        verified: false,
        lat: 0,
        lng: 0,
        phone: phone
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

