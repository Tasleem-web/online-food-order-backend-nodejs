import express, { Request, Response, NextFunction } from "express";
import {
    DeliveryUserLogin,
    DeliveryUserSignUp,
    EditDeliveryUserProfile,
    GetDeliveryUserProfile,
    UpdateDeliveryUserStatus,

} from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Customer is working!!!!' });
})

router.post('/signup', DeliveryUserSignUp);
router.post('/login', DeliveryUserLogin);

// authentication
router.use(Authenticate);

// change service status
router.put('/change-status', UpdateDeliveryUserStatus);

router.get('/profile', GetDeliveryUserProfile);
router.patch('/profile', EditDeliveryUserProfile);

export { router as DeliveryRoute }