import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

// @desc    Get all tickets with filters, search, and pagination
// @route   GET /api/admin/tickets
// @access  Private (Admin only)
export const getAllTickets = async (req, res) => {
  try {
    let query = {};

    // Filters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;
    if (req.query.assignedTechnician) {
      query.assignedTechnician = req.query.assignedTechnician === 'unassigned' ? null : req.query.assignedTechnician;
    }

    // Search by Ticket ID, Title, or Customer Name (if matching User ID)
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      
      // Let's find customers matching the search name
      const matchingUsers = await User.find({ name: searchRegex, role: 'customer' }).select('_id');
      const userIds = matchingUsers.map(u => u._id);

      query.$or = [
        { ticketId: searchRegex },
        { title: searchRegex },
        { customer: { $in: userIds } }
      ];
    }

    // Date Range Filter
    if (req.query.startDate && req.query.endDate) {
      const start = new Date(req.query.startDate);
      const end = new Date(req.query.endDate);
      end.setHours(23, 59, 59, 999); // Include the entire end day
      query.createdAt = { $gte: start, $lte: end };
    }

    const tickets = await Ticket.find(query)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .sort({ createdAt: -1 });

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Assign a technician to a ticket
// @route   PUT /api/admin/assign-technician
// @access  Private (Admin only)
export const assignTechnician = async (req, res) => {
  try {
    const { ticketId, technicianId } = req.body;

    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required.' });
    }

    // Find ticket
    const query = mongoose.Types.ObjectId.isValid(ticketId) ? { _id: ticketId } : { ticketId: ticketId };
    const ticket = await Ticket.findOne(query)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    let technician = null;
    if (technicianId) {
      if (!mongoose.Types.ObjectId.isValid(technicianId)) {
        return res.status(400).json({ message: 'Invalid Technician ID.' });
      }
      technician = await User.findOne({ _id: technicianId, role: 'technician' });
      if (!technician) {
        return res.status(404).json({ message: 'Technician user not found.' });
      }
    }

    const prevTech = ticket.assignedTechnician;
    ticket.assignedTechnician = technician ? technician._id : null;
    
    // Auto-update status if ticket was 'open' and is now assigned
    const oldStatus = ticket.status;
    if (technician && ticket.status === 'open') {
      ticket.status = 'in_progress';
    } else if (!technician && ticket.status === 'in_progress') {
      ticket.status = 'open';
    }

    const actionText = technician 
      ? `Technician ${technician.name} assigned by Admin.` 
      : 'Technician unassigned by Admin.';

    ticket.statusHistory.push({
      status: ticket.status,
      updatedBy: req.user._id,
      comment: actionText
    });

    const updatedTicket = await ticket.save();

    // Populate updated ticket completely
    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .populate('comments.user', 'name role');

    // Notify Customer via Email
    if (technician) {
      const customerEmailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d6efd;">Technician Assigned</h2>
          <p>Dear ${populatedTicket.customer.name},</p>
          <p>A technician has been assigned to resolve your ticket <strong>${populatedTicket.ticketId}</strong>.</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Technician Name</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${technician.name}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Technician Email</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${technician.email}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Current Status</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-transform: uppercase;">${populatedTicket.status}</td>
            </tr>
          </table>
          <p>The technician will contact you or update the progress directly in the application.</p>
        </div>
      `;
      await sendEmail({
        to: populatedTicket.customer.email,
        subject: `[${populatedTicket.ticketId}] Technician Assigned: ${technician.name}`,
        html: customerEmailHtml
      });

      // Notify Technician via Email
      const techEmailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #198754;">New Service Ticket Assigned</h2>
          <p>Dear ${technician.name},</p>
          <p>You have been assigned a new service request. Details are below:</p>
          <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Ticket ID</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${populatedTicket.ticketId}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Customer Name</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${populatedTicket.customer.name}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Category</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-transform: capitalize;">${populatedTicket.category.replace('_', ' ')}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Priority</td>
              <td style="padding: 10px; border: 1px solid #dee2e6; text-transform: capitalize;">${populatedTicket.priority}</td>
            </tr>
            <tr style="background-color: #f8f9fa;">
              <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Description</td>
              <td style="padding: 10px; border: 1px solid #dee2e6;">${populatedTicket.description}</td>
            </tr>
          </table>
          <p style="margin-top: 20px;">Please login to your technician dashboard to update the ticket progress and provide resolution notes.</p>
        </div>
      `;
      await sendEmail({
        to: technician.email,
        subject: `[${populatedTicket.ticketId}] New Assigned Ticket: ${populatedTicket.title}`,
        html: techEmailHtml
      });
    }

    return res.json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get all technicians for selection dropdown
// @route   GET /api/admin/technicians
// @access  Private (Admin only)
export const getTechnicians = async (req, res) => {
  try {
    const technicians = await User.find({ role: 'technician' }).select('name email');
    return res.json(technicians);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get tickets analytical statistics
// @route   GET /api/admin/stats
// @access  Private (Admin only)
export const getDashboardStats = async (req, res) => {
  try {
    const total = await Ticket.countDocuments();
    
    // Status counts
    const open = await Ticket.countDocuments({ status: 'open' });
    const inProgress = await Ticket.countDocuments({ status: 'in_progress' });
    const resolved = await Ticket.countDocuments({ status: 'resolved' });
    const closed = await Ticket.countDocuments({ status: 'closed' });

    // Category breakdown
    const categoryBreakdown = await Ticket.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);

    // Priority breakdown
    const priorityBreakdown = await Ticket.aggregate([
      { $group: { _id: '$priority', count: { $sum: 1 } } }
    ]);

    return res.json({
      total,
      statusCounts: {
        open,
        in_progress: inProgress,
        resolved,
        closed
      },
      categoryCounts: categoryBreakdown.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {}),
      priorityCounts: priorityBreakdown.reduce((acc, curr) => {
        acc[curr._id] = curr.count;
        return acc;
      }, {})
    });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
