import Razorpay from 'razorpay';
import crypto from 'crypto';
import Ticket from '../models/Ticket.js';

let razorpayInstance = null;

const getRazorpayInstance = () => {
  if (razorpayInstance) return razorpayInstance;
  
  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey1234';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummysignaturesecret1234';

  razorpayInstance = new Razorpay({
    key_id: keyId,
    key_secret: keySecret
  });

  return razorpayInstance;
};

// @desc    Create Razorpay Order
// @route   POST /api/payments/create-order
// @access  Private
export const createOrder = async (req, res) => {
  try {
    const { ticketId } = req.body;
    if (!ticketId) {
      return res.status(400).json({ message: 'Ticket ID is required.' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    // Authorization: only the ticket owner can pay
    if (ticket.customer.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized: You do not own this ticket.' });
    }

    if (ticket.paymentStatus === 'paid') {
      return res.status(400).json({ message: 'This ticket booking fee has already been paid.' });
    }

    const razorpay = getRazorpayInstance();
    const options = {
      amount: ticket.amount * 100, // Amount in paise (₹499 = 49900 paise)
      currency: 'INR',
      receipt: ticket._id.toString(),
    };

    const order = await razorpay.orders.create(options);
    
    return res.status(201).json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_dummykey1234'
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    return res.status(500).json({ message: error.message || 'Razorpay order creation failed.' });
  }
};

// @desc    Verify Razorpay Payment Signature
// @route   POST /api/payments/verify-payment
// @access  Private
export const verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, ticketId } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !ticketId) {
      return res.status(400).json({ message: 'Incomplete verification parameters.' });
    }

    // Verify signature
    const keySecret = process.env.RAZORPAY_KEY_SECRET || 'dummysignaturesecret1234';
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(body.toString())
      .digest('hex');

    const isSignatureValid = expectedSignature === razorpay_signature;

    if (!isSignatureValid) {
      return res.status(400).json({ message: 'Invalid payment signature verification failed.' });
    }

    // Update ticket in database
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ message: 'Ticket not found.' });
    }

    ticket.paymentStatus = 'paid';
    ticket.statusHistory.push({
      status: ticket.status,
      updatedBy: req.user._id,
      comment: `Inspection fee of ₹${ticket.amount} paid successfully. Payment ID: ${razorpay_payment_id}`
    });

    const updatedTicket = await ticket.save();

    // Populate and return updated ticket
    const populatedTicket = await Ticket.findById(updatedTicket._id)
      .populate('customer', 'name email')
      .populate('assignedTechnician', 'name email')
      .populate('statusHistory.updatedBy', 'name role')
      .populate('comments.user', 'name role');

    return res.json({
      success: true,
      message: 'Payment verified and ticket activated.',
      ticket: populatedTicket
    });
  } catch (error) {
    console.error('Error verifying payment signature:', error);
    return res.status(500).json({ message: error.message || 'Payment verification failed.' });
  }
};
