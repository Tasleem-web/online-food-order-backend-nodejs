import express, { Request, Response, NextFunction } from "express";
import { AddFood, GetFoods, GetVenderProfile, UpdateVenderProfile, UpdateVenderService, VendorLogin, updateVenderCoverImage } from "../controllers";
import { Authenticate } from "../middlewares";
import multer from "multer";

const router = express.Router();

// Multer configuration
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage }).array('files', 10);

router.post('/login', VendorLogin);

router.use(Authenticate);
router.get('/profile', GetVenderProfile);
router.patch('/profile', UpdateVenderProfile);
router.patch('/service', UpdateVenderService); // doing toggle for serviceAvailable flag
router.patch('/coverImage', upload, updateVenderCoverImage);

router.post('/food', upload, AddFood);
router.get('/foods', GetFoods);

router.get('/', (req: Request, res: Response, next: NextFunction) => {
    res.json({ message: 'Vendor is working!' });
})

export { router as VendorRoute }