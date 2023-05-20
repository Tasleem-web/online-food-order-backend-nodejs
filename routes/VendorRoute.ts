import express, { Request, Response, NextFunction } from "express";
import { GetVenderProfile, UpdateVenderProfile, UpdateVenderService, VendorLogin } from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

router.post('/login', VendorLogin);

router.use(Authenticate);
router.get('/profile', GetVenderProfile);
router.patch('/profile', UpdateVenderProfile);
router.patch('/service', UpdateVenderService); // doing toggle for serviceAvailable flag

router.post('/food');
router.get('/food');

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Vendor is working!' });
})

export { router as VendorRoute }