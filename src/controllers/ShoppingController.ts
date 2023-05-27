import express, { Request, Response, NextFunction } from "express";
import { Vendor } from "../models";
import { FoodDoc } from "../models/Food";

export const GetFoodAvailability = async (req: Request, res: Response, next: NextFunction) => {
    const pinCode = req.params.pinCode;

    const result = await Vendor.find({ pinCode: pinCode, serviceAvailable: false })
        .sort([['rating', 'descending']])
        .populate('foods')

    if (result.length) {
        return res.status(200).json(result);
    }
    return res.status(401).json({ message: 'Data not found.' })
}

export const GetTopRestaurant = async (req: Request, res: Response, next: NextFunction) => {
    const pinCode = req.params.pinCode;

    const result = await Vendor.find({ pinCode: pinCode, serviceAvailable: false })
        .sort([['rating', 'descending']])
        .limit(1);

    if (result.length) {
        return res.status(200).json(result);
    }
    return res.status(401).json({ message: 'Data not found.' })
}

export const GetFoodsIn30Min = async (req: Request, res: Response, next: NextFunction) => {
    const pinCode = req.params.pinCode;
    const minutes = req.params.minutes;

    const result = await Vendor.find({ pinCode: pinCode, serviceAvailable: false })
        .populate('foods');

    if (result.length) {
        let foodResult: any = [];

        result.map(vendor => {
            const foods = vendor.foods as [FoodDoc];
            foodResult.push(...foods.filter(food => food?.readyTime <= (minutes ? +minutes : 30)));
        })
        return res.status(200).json({ result: foodResult, count: foodResult.length });
    }
    return res.status(401).json({ message: 'Data not found.' })
}

export const SearchFoods = async (req: Request, res: Response, next: NextFunction) => {
    const pinCode = req.params.pinCode;

    const result = await Vendor.find({ pinCode: pinCode, serviceAvailable: false })
        .populate('foods');

    if (result.length) {

        let foodResult: any = [];

        foodResult.push(...result.map(item => item.foods));
        return res.status(200).json({ result: foodResult, count: result.length });
    }
    return res.status(401).json({ message: 'Data not found.' })
}

export const RestaurantById = async (req: Request, res: Response, next: NextFunction) => {
    const id = req.params.id;
    const result = await Vendor.findById(id).populate('foods');

    if (result) return res.status(200).json({ result });

    return res.status(401).json({ message: 'Data not found.' })

}
