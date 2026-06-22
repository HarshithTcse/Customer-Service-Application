import express from 'express';
import { 
  getAllTickets, 
  assignTechnician, 
  getTechnicians, 
  getDashboardStats 
} from '../controllers/adminController.js';
import { protect, authorize } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);
router.use(authorize('admin'));

router.get('/tickets', getAllTickets);
router.put('/assign-technician', assignTechnician);
router.get('/technicians', getTechnicians);
router.get('/stats', getDashboardStats);

export default router;
