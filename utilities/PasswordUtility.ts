import bcrypt from 'bcrypt';
import { AuthPayload, VendorPayload } from '../dto';
import jwt from 'jsonwebtoken';
import { APP_SECRET } from '../config';
import { Request } from 'express';


export const GenerateSalt = async () => {
    return bcrypt.genSalt();
}

export const GeneratePassword = async (password: string, salt: string) => {
    return await bcrypt.hash(password, salt);
}

export const validatePassword = async (enteredPassword: string, savePassword: string, salt: string) => {
    return await GeneratePassword(enteredPassword, salt) === savePassword;
}

export const GenerateSignature = async (payload: VendorPayload) => {
    return jwt.sign(payload, APP_SECRET, { expiresIn: '1d' });
}

export const ValidateSignature = async (req: Request) => {
    try {
        const token = req.get('Authorization');
        if (!token) {
            throw new Error('Authentication failed!');
        }
        const payload = jwt.verify(token.split(' ')[1], APP_SECRET) as AuthPayload;
        req.user = payload;
        return true;
    } catch (err) {
        return false;
    }
}