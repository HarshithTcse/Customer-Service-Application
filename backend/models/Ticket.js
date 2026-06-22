import mongoose from 'mongoose';
import Counter from './Counter.js';

const ticketSchema = new mongoose.Schema(
  {
    ticketId: {
      type: String,
      unique: true
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: {
      type: String,
      required: [true, 'Please add a title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please add a description']
    },
    category: {
      type: String,
      required: [true, 'Please specify a category'],
      enum: ['fan_repair', 'ac_repair', 'electrical', 'plumbing', 'appliance_repair', 'other']
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    status: {
      type: String,
      enum: ['open', 'in_progress', 'resolved', 'closed'],
      default: 'open'
    },
    assignedTechnician: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    resolutionNotes: {
      type: String,
      default: ''
    },
    amount: {
      type: Number,
      default: 499 // Inspection fee in INR
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending'
    },
    statusHistory: [
      {
        status: {
          type: String,
          required: true
        },
        updatedBy: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        updatedAt: {
          type: Date,
          default: Date.now
        },
        comment: {
          type: String,
          default: ''
        }
      }
    ],
    comments: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'User',
          required: true
        },
        text: {
          type: String,
          required: true
        },
        createdAt: {
          type: Date,
          default: Date.now
        }
      }
    ]
  },
  {
    timestamps: true
  }
);

// Pre-save hook to generate Ticket ID
ticketSchema.pre('save', async function (next) {
  if (!this.isNew) {
    return next();
  }
  
  try {
    const counter = await Counter.findByIdAndUpdate(
      { _id: 'ticketId' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );
    
    this.ticketId = `TCK-${counter.seq}`;
    
    // Add initial status history entry
    if (this.statusHistory.length === 0) {
      this.statusHistory.push({
        status: 'open',
        updatedBy: this.customer,
        comment: 'Ticket raised by customer'
      });
    }
    
    next();
  } catch (error) {
    next(error);
  }
});

const Ticket = mongoose.model('Ticket', ticketSchema);
export default Ticket;
