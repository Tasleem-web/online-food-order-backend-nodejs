import express, { Request, Response, NextFunction } from "express";
import { CreateOrder, CustomerLogin, CustomerSignUp, CustomerVerify, EditCustomerProfile, GetCustomerProfile, GetOrderById, GetOrders, RequestOtp } from "../controllers";
import { Authenticate } from "../middlewares";

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Customer is working!!!!' });
})

router.post('/signup', CustomerSignUp);
router.post('/login', CustomerLogin);

// authentication
router.use(Authenticate);
router.patch('/verify', CustomerVerify);
router.get('/otp', RequestOtp);
router.get('/profile', GetCustomerProfile);
router.patch('/profile', EditCustomerProfile);

// order
router.post('/create-order', CreateOrder);
router.get('/orders', GetOrders);
router.get('/order/:id', GetOrderById);

export { router as CustomerRoute }