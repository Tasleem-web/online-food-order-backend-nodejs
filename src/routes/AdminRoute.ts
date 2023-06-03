import express, { Request, Response, NextFunction } from "express";
import { CreateVendor, GetDeliveryUser, GetTransaction, GetTransactionById, GetVendorByID, GetVendors, VerifyDeliveryUser } from "../controllers";

const router = express.Router();

router.post('/vendor', CreateVendor);
router.get('/vendors', GetVendors);
router.get('/vendor/:id', GetVendorByID);

router.get('/transactions', GetTransaction);
router.get('/transaction/:id', GetTransactionById);

router.put('/delivery/verify', VerifyDeliveryUser)
router.get('/delivery/users', GetDeliveryUser)

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Admin is working!!!!' });
})

export { router as AdminRoute }