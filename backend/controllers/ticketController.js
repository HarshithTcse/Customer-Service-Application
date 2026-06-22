import Ticket from '../models/Ticket.js';
import User from '../models/User.js';
import { sendEmail } from '../utils/emailService.js';
import mongoose from 'mongoose';

// Utility helper to find ticket by ID or ticketId
const findTicketByIdOrCustomId = async (id) => {
  if (mongoose.Types.ObjectId.isValid(id)) {
    return await Ticket.findById(id)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .populate('comments.user', 'name role');
  }
  return await Ticket.findOne({ ticketId: id })
    .populate('customer', 'name email')
    .populate('assignedTechnician', 'name email')
    .populate('statusHistory.updatedBy', 'name role')
    .populate('comments.user', 'name role');
};

// @desc    Create new ticket
// @route   POST /api/tickets
// @access  Private (Customer only)
export const createTicket = async (req, res) => {
  try {
    const { title, description, category, priority } = req.body;

    if (!title || !description || !category) {
      return res.status(400).json({ message: 'Title, description, and category are required.' });
    }

    const ticket = new Ticket({
      customer: req.user._id,
      title,
      description,
      category,
      priority: priority || 'medium',
      paymentStatus: 'pending' // Enforce unpaid state initially for payments demonstration
    });

    const createdTicket = await ticket.save();
    const populatedTicket = await findTicketByIdOrCustomId(createdTicket._id);

    // Send email notification to customer
    const emailHtml = `
      <div style="font-family: sans-serif; padding: 20px; color: #333;">
        <h2 style="color: #0d6efd;">Ticket Raised Successfully</h2>
        <p>Dear ${req.user.name},</p>
        <p>We have received your support request. Please complete the ₹${populatedTicket.amount} inspection fee on your dashboard to activate the ticket for our technicians.</p>
        <table style="width: 100%; border-collapse: collapse; margin-top: 15px;">
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Ticket ID</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${populatedTicket.ticketId}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Issue Title</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">${populatedTicket.title}</td>
          </tr>
          <tr style="background-color: #f8f9fa;">
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Category</td>
            <td style="padding: 10px; border: 1px solid #dee2e6; text-transform: capitalize;">${populatedTicket.category.replace('_', ' ')}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border: 1px solid #dee2e6; font-weight: bold;">Fee Amount</td>
            <td style="padding: 10px; border: 1px solid #dee2e6;">₹${populatedTicket.amount}</td>
          </tr>
        </table>
        <p style="margin-top: 20px; font-size: 0.9em; color: #6c757d;">This is an automated message. Please do not reply directly to this email.</p>
      </div>
    `;

    await sendEmail({
      to: req.user.email,
      subject: `[${populatedTicket.ticketId}] Support Ticket Created: ${populatedTicket.title}`,
      html: emailHtml
    });

    return res.status(201).json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get tickets (filtered by user role)
// @route   GET /api/tickets
// @access  Private
export const getTickets = async (req, res) => {
  try {
    let query = {};

    // Filter tickets according to role
    if (req.user.role === 'customer') {
      query.customer = req.user._id;
    } 
    // Technicians see all tickets in the system so they can claim and resolve them

    // Support simple filters (status, category, priority) passed as query parameters
    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.category) query.category = req.query.category;
    
    // Support search by custom ticket ID
    if (req.query.search) {
      query.$or = [
        { ticketId: { $regex: req.query.search, $options: 'i' } },
        { title: { $regex: req.query.search, $options: 'i' } }
      ];
    }

    const tickets = await Ticket.find(query)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .sort({ updatedAt: -1 });

    return res.json(tickets);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Get ticket by ID
// @route   GET /api/tickets/:id
// @access  Private
export const getTicketById = async (req, res) => {
  try {
    const ticket = await findTicketByIdOrCustomId(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Verification check
    if (req.user.role === 'customer' && ticket.customer._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to view this ticket' });
    }
    
    // Technicians are authorized to view ANY ticket

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Update ticket (Role-dependent logic)
// @route   PUT /api/tickets/:id
// @access  Private
export const updateTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Prevent cross-user editing
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to edit this ticket' });
    }

    const originalStatus = ticket.status;

    // Apply edits based on User Role
    if (req.user.role === 'customer') {
      const { title, description, category, priority, status } = req.body;

      if (status && status === 'closed') {
        if (ticket.status !== 'resolved') {
          return res.status(400).json({ message: 'Tickets can only be closed once they are resolved.' });
        }
        ticket.status = 'closed';
        ticket.statusHistory.push({
          status: 'closed',
          updatedBy: req.user._id,
          comment: 'Customer confirmed resolution and closed the ticket.'
        });
      } else {
        // Can edit fields only if ticket is still open
        if (ticket.status !== 'open') {
          return res.status(400).json({ message: 'Cannot edit ticket details once it is in progress.' });
        }
        if (title) ticket.title = title;
        if (description) ticket.description = description;
        if (category) ticket.category = category;
        if (priority) ticket.priority = priority;
      }
    } 
    
    else if (req.user.role === 'technician') {
      const { status, resolutionNotes } = req.body;
      
      // Enforce claiming: set assignedTechnician to this technician
      ticket.assignedTechnician = req.user._id;

      if (status) {
        if (!['in_progress', 'resolved'].includes(status)) {
          return res.status(400).json({ message: 'Technicians can only update status to in_progress or resolved.' });
        }
        
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
      }
    } 
    
    else if (req.user.role === 'admin') {
      // Admins have full access
      const { title, description, category, priority, status, assignedTechnician, resolutionNotes, paymentStatus } = req.body;

      if (title) ticket.title = title;
      if (description) ticket.description = description;
      if (category) ticket.category = category;
      if (priority) ticket.priority = priority;
      if (resolutionNotes !== undefined) ticket.resolutionNotes = resolutionNotes;
      if (paymentStatus) ticket.paymentStatus = paymentStatus;

      if (assignedTechnician !== undefined) {
        ticket.assignedTechnician = assignedTechnician;
        
        if (assignedTechnician) {
          if (ticket.status === 'open') {
            ticket.status = 'in_progress';
          }
          ticket.statusHistory.push({
            status: ticket.status,
            updatedBy: req.user._id,
            comment: `Technician assigned by administrator.`
          });
        } else {
          ticket.assignedTechnician = null;
          ticket.status = 'open';
          ticket.statusHistory.push({
            status: 'open',
            updatedBy: req.user._id,
            comment: 'Technician unassigned. Ticket returned to open queue.'
          });
        }
      }

      if (status && status !== ticket.status) {
        ticket.status = status;
        ticket.statusHistory.push({
          status,
          updatedBy: req.user._id,
          comment: `Status override by administrator.`
        });
      }
    }

    const updatedTicket = await ticket.save();
    const populatedTicket = await findTicketByIdOrCustomId(updatedTicket._id);

    // Send emails on key status transitions
    if (originalStatus !== populatedTicket.status) {
      // Email customer
      const emailHtml = `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2 style="color: #0d6efd;">Ticket Status Updated</h2>
          <p>Dear ${populatedTicket.customer.name},</p>
          <p>Your support ticket status has transitioned from <strong>${originalStatus.toUpperCase()}</strong> to <strong>${populatedTicket.status.toUpperCase()}</strong>.</p>
          ${populatedTicket.status === 'resolved' ? `<p><strong>Technician Resolution Notes:</strong> ${populatedTicket.resolutionNotes}</p><p>Please log in to your dashboard to confirm resolution and close the ticket.</p>` : ''}
          <p>Thank you for using our customer service application.</p>
        </div>
      `;

      await sendEmail({
        to: populatedTicket.customer.email,
        subject: `[${populatedTicket.ticketId}] Ticket Status Update: ${populatedTicket.status.toUpperCase()}`,
        html: emailHtml
      });
    }

    return res.json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Delete ticket
// @route   DELETE /api/tickets/:id
// @access  Private (Admin or Customer if open)
export const deleteTicket = async (req, res) => {
  try {
    const ticket = await Ticket.findById(req.params.id);

    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    if (req.user.role === 'customer') {
      if (ticket.customer.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: 'Not authorized' });
      }
      if (ticket.status !== 'open') {
        return res.status(400).json({ message: 'Cannot delete a ticket once it has been processed.' });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can perform this action' });
    }

    await Ticket.deleteOne({ _id: ticket._id });
    return res.json({ message: 'Ticket deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

// @desc    Add comment/note to a ticket
// @route   POST /api/tickets/:id/comments
// @access  Private
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ message: 'Comment text is required.' });
    }

    const ticket = await Ticket.findById(req.params.id);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found' });
    }

    // Role verification: Customers can comment on their own tickets. Admins and technicians can comment on any ticket.
    if (req.user.role === 'customer' && ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized to comment on this ticket' });
    }

    // Add comment
    ticket.comments.push({
      user: req.user._id,
      text: text.trim()
    });

    await ticket.save();

    const populatedTicket = await findTicketByIdOrCustomId(ticket._id);
    return res.status(201).json(populatedTicket);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};
