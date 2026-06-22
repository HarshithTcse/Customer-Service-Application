import Ticket from '../models/Ticket.js';
import { sendEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

// @desc    Get all available tickets for technicians
// @route   GET /api/technician/tickets
// @access  Private (Technician only)
export const getAssignedTickets = async (req, res) => {
  try {
    // Return all tickets in the system so technicians can view and claim any ticket
    const tickets = await Ticket.find({})
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .populate('comments.user', 'name role')
      .sort({ updatedAt: -1 });
    
    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update status & notes by any technician
// @route   PUT /api/technician/update-status
// @access  Private (Technician only)
export const updateTicketStatus = async (req, res) => {
  try {
    const { ticketId, status, resolutionNotes } = req.body;

    if (!ticketId || !status) {
      return res.status(400).json({ message: 'Ticket ID and status are required.' });
    }

    if (!['in_progress', 'resolved'].includes(status)) {
      return res.status(400).json({ message: 'Technicians can only update status to in_progress or resolved.' });
    }

    // Find ticket by _id or custom ticketId
    const isObjectId = mongoose.Types.ObjectId.isValid(ticketId);
    const query = isObjectId ? { _id: ticketId } : { ticketId: ticketId };
    
    const ticket = await Ticket.findOne(query).populate('customer', 'name email');

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Claim ownership of the ticket when updating status
    ticket.assignedTechnician = req.user._id;

    const originalStatus = ticket.status;
    ticket.status = status;

    let updateComment = `Technician ${req.user.name} claimed and updated status to ${status.replace('_', ' ')}.`;
    if (status === 'resolved') {
      if (!resolutionNotes || resolutionNotes.trim() === '') {
        return res.status(400).json({ message: 'Please provide resolution notes before marking as resolved.' });
      }
      ticket.resolutionNotes = resolutionNotes;
      updateComment = `Resolved by ${req.user.name}: ${resolutionNotes}`;
    }

    ticket.statusHistory.push({
      status,
      updatedBy: req.user._id,
      comment: updateComment
    });

    const updatedTicket = await ticket.save();

    // Send status change email
    if (originalStatus !== updatedTicket.status) {
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d6efd;">Ticket Status Updated</h2>
          <p>Dear ${ticket.customer.name},</p>
          <p>Technician <strong>${req.user.name}</strong> has updated the status of your ticket <strong>${ticket.ticketId}</strong> to <strong>${status.toUpperCase()}</strong>.</p>
          ${status === 'resolved' ? `<p><strong>Resolution Details:</strong> ${resolutionNotes}</p><p>Please log in to your dashboard to confirm resolution and close the ticket.</p>` : ''}
          <p>Thank you for using our customer service system.</p>
        </div>
      `;

      await sendEmail({
        to: ticket.customer.email,
        subject: `[${ticket.ticketId}] Ticket Status Update: ${status.toUpperCase()}`,
        html: emailHtml
      });
    }

    // Return the updated ticket populated fully
    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .populate('comments.user', 'name role');

    return res.json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
