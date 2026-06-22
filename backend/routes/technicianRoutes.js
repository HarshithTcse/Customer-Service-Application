import express from 'express';
import { getAssignedTickets, updateTicketStatus } from '../controllers/technicianController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('technician'));

router.get('/tickets', getAssignedTickets);
router.put('/update-status', updateTicketStatus);

export default router;
