import express, { Request, Response, NextFunction } from "express";
import { GetAvailableOffers, GetFoodAvailability, GetFoodsIn30Min, GetTopRestaurant, RestaurantById, SearchFoods } from "../controllers";

const router = express.Router();

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Shopping Route is working!!!!' });
})

router.get('/:pinCode', GetFoodAvailability);
router.get('/top-restaurant/:pinCode', GetTopRestaurant);
router.get('/foods-in-30-min/:pinCode', GetFoodsIn30Min);
router.get('/foods-in-30-min/:pinCode/:minutes', GetFoodsIn30Min);
router.get('/search/:pinCode', SearchFoods);
router.get('/restaurant/:id', RestaurantById);

// Offers
router.get('/offers/:pinCode', GetAvailableOffers)
export { router as ShoppingRoute }