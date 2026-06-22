import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TicketDetailsModal = ({ ticketId, isOpen, onClose, onUpdate }) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [selectedTech, setSelectedTech] = useState('');
  const [technicians, setTechnicians] = useState([]);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  // Dynamically load Razorpay checkout script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if (window.Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // Fetch ticket details
  const fetchTicketDetails = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get(`/api/tickets/${ticketId}`);
      setTicket(response.data);
      setResolutionNotes(response.data.resolutionNotes || '');
      setSelectedTech(response.data.assignedTechnician?._id || '');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load ticket details.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch technicians list (if Admin)
  const fetchTechnicians = async () => {
    if (user?.role !== 'admin') return;
    try {
      const response = await axios.get('/api/admin/technicians');
      setTechnicians(response.data);
    } catch (err) {
      console.error('Failed to load technicians', err);
    }
  };

  useEffect(() => {
    if (isOpen && ticketId) {
      fetchTicketDetails();
      fetchTechnicians();
    }
  }, [isOpen, ticketId]);

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;

    try {
      setActionLoading(true);
      const response = await axios.post(`/api/tickets/${ticket._id}/comments`, {
        text: commentText.trim()
      });
      setTicket(response.data);
      setCommentText('');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit comment.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    try {
      setActionLoading(true);
      setError('');
      
      const payload = { status };
      if (status === 'resolved') {
        if (!resolutionNotes.trim()) {
          setError('Please provide resolution notes before resolving.');
          setActionLoading(false);
          return;
        }
        payload.resolutionNotes = resolutionNotes.trim();
      }

      const response = await axios.put(`/api/tickets/${ticket._id}`, payload);
      setTicket(response.data);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update ticket status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignTechnician = async (e) => {
    const techId = e.target.value;
    setSelectedTech(techId);
    try {
      setActionLoading(true);
      setError('');
      const response = await axios.put(`/api/tickets/${ticket._id}`, {
        assignedTechnician: techId || null
      });
      setTicket(response.data);
      if (onUpdate) onUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign technician.');
    } finally {
      setActionLoading(false);
    }
  };

  // Razorpay Checkout Payment Flow
  const handlePayment = async () => {
    try {
      setActionLoading(true);
      setError('');

      // Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setError('Failed to load Razorpay checkout script. Check internet connectivity.');
        setActionLoading(false);
        return;
      }

      // Create Razorpay Order on backend
      const orderRes = await axios.post('/api/payments/create-order', {
        ticketId: ticket._id
      });

      const { orderId, amount, currency, keyId } = orderRes.data;

      // Configure Razorpay checkout options
      const options = {
        key: keyId,
        amount: amount,
        currency: currency,
        name: 'SupportCore Portal',
        description: `Service Booking Fee for ${ticket.ticketId}`,
        order_id: orderId,
        handler: async function (response) {
          try {
            setActionLoading(true);
            // Verify payment on backend
            const verifyRes = await axios.post('/api/payments/verify-payment', {
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              ticketId: ticket._id
            });

            if (verifyRes.data.success) {
              setTicket(verifyRes.data.ticket);
              if (onUpdate) onUpdate();
            } else {
              setError('Payment verification failed.');
            }
          } catch (err) {
            setError(err.response?.data?.message || 'Payment verification failed.');
          } finally {
            setActionLoading(false);
          }
        },
        prefill: {
          name: user.name,
          email: user.email,
        },
        theme: {
          color: '#4f46e5',
        },
        modal: {
          ondismiss: function () {
            setActionLoading(false);
          }
        }
      };

      const razorpayWidget = new window.Razorpay(options);
      razorpayWidget.open();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to initialize payment.');
      setActionLoading(false);
    }
  };

  if (!isOpen) return null;

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="badge bg-custom bg-info text-dark">Open</span>;
      case 'in_progress':
        return <span className="badge bg-custom bg-warning text-dark">In Progress</span>;
      case 'resolved':
        return <span className="badge bg-custom bg-success text-white">Resolved</span>;
      default:
        return <span className="badge bg-custom bg-secondary text-white">Closed</span>;
    }
  };

  const getPriorityBadge = (priority) => {
    switch (priority) {
      case 'high':
        return <span className="badge bg-custom bg-danger text-white">High</span>;
      case 'low':
        return <span className="badge bg-custom bg-secondary text-white">Low</span>;
      default:
        return <span className="badge bg-custom bg-primary text-white">Medium</span>;
    }
  };

  const getPaymentBadge = (status) => {
    if (status === 'paid') {
      return <span className="badge bg-custom bg-success text-white"><i className="bi bi-wallet2 me-1"></i> Paid</span>;
    }
    return <span className="badge bg-custom bg-danger text-white"><i className="bi bi-wallet2 me-1"></i> Pending Payment</span>;
  };

  return (
    <div className="modal show d-block" tabIndex="-1" role="dialog" style={{ backgroundColor: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(4px)' }}>
      <div className="modal-dialog modal-dialog-centered modal-xl" role="document">
        <div className="modal-content card-premium border-0 shadow-2xl overflow-hidden">
          
          {/* Modal Header */}
          <div className="modal-header bg-light border-bottom px-4 py-3 d-flex justify-content-between align-items-center">
            <div>
              <h5 className="modal-title fw-bold text-dark d-flex align-items-center gap-2">
                {ticket ? ticket.ticketId : 'Loading Ticket...'}
                {ticket && getStatusBadge(ticket.status)}
                {ticket && getPriorityBadge(ticket.priority)}
                {ticket && getPaymentBadge(ticket.paymentStatus)}
              </h5>
              {ticket && (
                <span className="text-secondary small">
                  Category: <strong className="text-dark text-capitalize">{ticket.category.replace('_', ' ')}</strong>
                </span>
              )}
            </div>
            <button type="button" className="btn-close" onClick={onClose} aria-label="Close" disabled={actionLoading}></button>
          </div>

          {/* Modal Body */}
          <div className="modal-body p-4" style={{ maxHeight: '75vh', overflowY: 'auto' }}>
            {loading ? (
              <div className="text-center py-5">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
              </div>
            ) : error ? (
              <div className="alert alert-danger" role="alert">{error}</div>
            ) : (
              <div className="row g-4">
                
                {/* Left Column: Ticket Info & Status Timeline */}
                <div className="col-lg-7">
                  
                  {/* General Info Card */}
                  <div className="bg-light p-3 rounded mb-4 border">
                    <h6 className="fw-bold text-dark mb-2">Issue Title</h6>
                    <h5 className="text-dark fw-semibold mb-3">{ticket.title}</h5>

                    <h6 className="fw-bold text-dark mb-2">Description</h6>
                    <p className="text-secondary mb-3" style={{ whiteSpace: 'pre-wrap' }}>{ticket.description}</p>
                    
                    <div className="row text-xs mt-3 border-top pt-2">
                      <div className="col-sm-6 mb-2">
                        <span className="text-secondary d-block">Raised By:</span>
                        <strong className="text-dark">{ticket.customer?.name} ({ticket.customer?.email})</strong>
                      </div>
                      <div className="col-sm-6 mb-2">
                        <span className="text-secondary d-block font-semibold">Assigned Technician:</span>
                        {user.role === 'admin' ? (
                          <select 
                            className="form-select form-select-sm mt-1" 
                            value={selectedTech} 
                            onChange={handleAssignTechnician}
                            disabled={actionLoading || ticket.status === 'closed'}
                          >
                            <option value="">Unassigned</option>
                            {technicians.map(tech => (
                              <option key={tech._id} value={tech._id}>{tech.name}</option>
                            ))}
                          </select>
                        ) : (
                          <strong className="text-dark d-block mt-1">
                            {ticket.assignedTechnician ? ticket.assignedTechnician.name : 'Not Assigned (Available for Claiming)'}
                          </strong>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Alert Box (When Pending Payment for Customer) */}
                  {ticket.paymentStatus === 'pending' && user.role === 'customer' && (
                    <div className="alert alert-warning border border-warning shadow-sm mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
                      <div>
                        <h6 className="fw-bold mb-1"><i className="bi bi-credit-card-2-front me-1"></i> Inspection Booking Fee Required</h6>
                        <p className="small mb-0 text-dark">A fee of ₹499 is required to activate this ticket so that technicians can start work.</p>
                      </div>
                      <button 
                        type="button" 
                        className="btn btn-primary rounded-pill px-4" 
                        onClick={handlePayment}
                        disabled={actionLoading}
                      >
                        {actionLoading ? 'Processing...' : 'Pay ₹499 via Razorpay'}
                      </button>
                    </div>
                  )}

                  {/* Resolution Notes Block (When Status is In Progress or Resolved) */}
                  {ticket.paymentStatus === 'paid' && (user.role === 'technician' || ticket.resolutionNotes) && (
                    <div className="card p-3 mb-4 border border-success bg-success bg-opacity-5">
                      <h6 className="fw-bold text-success mb-2">
                        <i className="bi bi-patch-check me-1"></i> Resolution Details
                      </h6>
                      {user.role === 'technician' && ticket.status !== 'closed' ? (
                        <div>
                          <textarea 
                            className="form-control mb-2" 
                            rows="3" 
                            placeholder="Add steps taken to resolve this issue..."
                            value={resolutionNotes}
                            onChange={(e) => setResolutionNotes(e.target.value)}
                            disabled={actionLoading}
                          ></textarea>
                          {ticket.status !== 'resolved' && (
                            <button 
                              type="button" 
                              className="btn btn-success btn-sm rounded-pill px-3"
                              onClick={() => handleUpdateStatus('resolved')}
                              disabled={actionLoading}
                            >
                              Mark as Resolved
                            </button>
                          )}
                        </div>
                      ) : (
                        <p className="text-dark mb-0 fst-italic">
                          {ticket.resolutionNotes || 'No resolution notes provided yet.'}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Status Timeline */}
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-clock-history me-1"></i> Status History Timeline</h6>
                  <div className="timeline-vertical p-2">
                    {ticket.statusHistory?.map((history, idx) => (
                      <div key={idx} className="timeline-item">
                        <div className={`timeline-marker ${history.status}`}></div>
                        <div className="ps-2">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold text-capitalize text-dark">
                              Status: {history.status.replace('_', ' ')}
                            </span>
                            <span className="text-secondary small">
                              {new Date(history.updatedAt).toLocaleString()}
                            </span>
                          </div>
                          <p className="text-secondary mb-1 small">{history.comment}</p>
                          <span className="text-xs text-secondary bg-white border px-2 py-0.5 rounded">
                            Updated By: {history.updatedBy?.name} ({history.updatedBy?.role})
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                </div>

                {/* Right Column: Comments & Notes */}
                <div className="col-lg-5 border-start">
                  <h6 className="fw-bold text-dark mb-3"><i className="bi bi-chat-text me-1"></i> Activity Logs & Comments</h6>
                  
                  {/* Comments Feed */}
                  <div className="pe-2 mb-3" style={{ maxHeight: '300px', overflowY: 'auto' }}>
                    {ticket.comments?.length === 0 ? (
                      <div className="text-center py-4 text-secondary small">
                        No comments or notes have been posted on this ticket.
                      </div>
                    ) : (
                      ticket.comments?.map((comment, idx) => (
                        <div key={idx} className="comment-bubble">
                          <div className="comment-bubble-meta">
                            <span className="fw-semibold text-dark">
                              {comment.user?.name}
                              <span className="badge bg-light text-secondary border ms-1 py-0.5 text-xxs font-normal">
                                {comment.user?.role}
                              </span>
                            </span>
                            <span>{new Date(comment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <div className="comment-bubble-text">{comment.text}</div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Comments Input */}
                  {ticket.status !== 'closed' && (
                    <form onSubmit={handleAddComment}>
                      <div className="input-group">
                        <textarea 
                          className="form-control text-sm" 
                          rows="2"
                          placeholder="Type a comment or note..."
                          value={commentText}
                          onChange={(e) => setCommentText(e.target.value)}
                          required
                          disabled={actionLoading}
                        ></textarea>
                        <button 
                          type="submit" 
                          className="btn btn-primary px-3 align-self-end" 
                          style={{ height: '48px' }}
                          disabled={actionLoading}
                        >
                          <i className="bi bi-send-fill"></i>
                        </button>
                      </div>
                    </form>
                  )}
                </div>

              </div>
            )}
          </div>

          {/* Modal Footer */}
          <div className="modal-footer bg-light border-top px-4 py-3 d-flex justify-content-between">
            <div>
              {/* Contextual actions for technicians and customers */}
              {ticket && user.role === 'customer' && ticket.status === 'resolved' && (
                <button 
                  type="button" 
                  className="btn btn-success rounded-pill px-4" 
                  onClick={() => handleUpdateStatus('closed')}
                  disabled={actionLoading}
                >
                  <i className="bi bi-check-lg me-1"></i> Confirm Resolution & Close Ticket
                </button>
              )}

              {/* Technicians can claim any paid ticket */}
              {ticket && user.role === 'technician' && ticket.paymentStatus === 'paid' && ticket.status === 'open' && (
                <button 
                  type="button" 
                  className="btn btn-warning text-dark rounded-pill px-4" 
                  onClick={() => handleUpdateStatus('in_progress')}
                  disabled={actionLoading}
                >
                  Claim & Start Work (In Progress)
                </button>
              )}

              {ticket && user.role === 'technician' && ticket.paymentStatus === 'pending' && (
                <span className="text-danger small fw-medium fst-italic">
                  <i className="bi bi-lock-fill"></i> Locked: Waiting for customer payment.
                </span>
              )}
            </div>
            
            <button type="button" className="btn btn-secondary rounded-pill px-4" onClick={onClose} disabled={actionLoading}>
              Close Window
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};

export default TicketDetailsModal;
