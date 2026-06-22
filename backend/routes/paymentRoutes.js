import express from 'express';
import { createOrder, verifyPayment } from '../controllers/paymentController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect); // Require JWT authentication for payments

router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPayment);

export default router;
