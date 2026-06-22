import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TicketDetailsModal from './TicketDetailsModal';

const CustomerDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Ticket creation form states
  const [showRaiseModal, setShowRaiseModal] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('fan_repair');
  const [priority, setPriority] = useState('medium');
  const [formLoading, setFormLoading] = useState(false);
  const [formError, setFormError] = useState('');

  // Selected ticket for details modal
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (search) params.search = search;

      const response = await axios.get('/api/tickets', { params });
      setTickets(response.data);
    } catch (err) {
      setError('Could not load tickets. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, filterCategory, filterPriority, search]);

  const handleRaiseTicket = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);

    try {
      await axios.post('/api/tickets', {
        title,
        description,
        category,
        priority
      });
      setTitle('');
      setDescription('');
      setCategory('fan_repair');
      setPriority('medium');
      setShowRaiseModal(false);
      fetchTickets();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to submit service ticket.');
    } finally {
      setFormLoading(false);
    }
  };

  const getMetrics = () => {
    const counts = { total: tickets.length, open: 0, in_progress: 0, resolved: 0, closed: 0 };
    tickets.forEach(t => {
      if (counts[t.status] !== undefined) counts[t.status]++;
    });
    return counts;
  };

  const metrics = getMetrics();

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
      return <span className="badge bg-custom bg-success text-white"><i className="bi bi-check-circle me-1"></i> Paid</span>;
    }
    return <span className="badge bg-custom bg-danger text-white"><i className="bi bi-exclamation-circle me-1"></i> Unpaid</span>;
  };

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="hero-auth p-4 mb-4 d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 className="fw-bold text-dark mb-1">Hello, {user.name}!</h2>
          <p className="text-secondary mb-0">Need a repair or have a technical issue? Raise a support request below.</p>
        </div>
        <button 
          className="btn btn-primary rounded-pill px-4 py-2 fw-semibold shadow-sm d-flex align-items-center gap-2"
          onClick={() => setShowRaiseModal(true)}
        >
          <i className="bi bi-plus-circle-fill"></i>
          <span>Raise New Ticket</span>
        </button>
      </div>

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-6 col-lg-3">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Total Tickets</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.total}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 p-2.5 rounded-circle text-primary">
                <i className="bi bi-ticket-perforated fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Active Requests</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.open + metrics.in_progress}</h3>
              </div>
              <div className="bg-warning bg-opacity-10 p-2.5 rounded-circle text-warning">
                <i className="bi bi-clock-history fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Resolved</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.resolved}</h3>
              </div>
              <div className="bg-success bg-opacity-10 p-2.5 rounded-circle text-success">
                <i className="bi bi-check2-circle fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-6 col-lg-3">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Closed</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.closed}</h3>
              </div>
              <div className="bg-secondary bg-opacity-10 p-2.5 rounded-circle text-secondary">
                <i className="bi bi-archive fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="card card-premium p-3 border-0 mb-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-funnel me-1"></i> Filter & Search Tickets</h5>
        <div className="row g-3">
          <div className="col-md-4">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Ticket ID or Title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-8">
            <div className="row g-2">
              <div className="col-4">
                <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
                  <option value="">All Categories</option>
                  <option value="fan_repair">Fan Repair</option>
                  <option value="ac_repair">AC Repair</option>
                  <option value="electrical">Electrical Issues</option>
                  <option value="plumbing">Plumbing</option>
                  <option value="appliance_repair">Appliance Repair</option>
                  <option value="other">Other Issues</option>
                </select>
              </div>
              <div className="col-4">
                <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
                  <option value="">All Priorities</option>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <div className="col-4">
                <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
                  <option value="">All Statuses</option>
                  <option value="open">Open</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ticket List Table */}
      <div className="card card-premium border-0 p-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-list-task me-1"></i> My Service Tickets</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-clipboard-x display-4 text-muted"></i>
            <p className="mt-3">No tickets found matching your filter criteria.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light text-secondary small">
                <tr>
                  <th>Ticket ID</th>
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Assigned Tech</th>
                  <th>Created Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td><span className="font-monospace fw-bold text-secondary">{ticket.ticketId}</span></td>
                    <td><strong className="text-dark">{ticket.title}</strong></td>
                    <td className="text-capitalize">{ticket.category.replace('_', ' ')}</td>
                    <td>{getPriorityBadge(ticket.priority)}</td>
                    <td>{getPaymentBadge(ticket.paymentStatus)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      {ticket.assignedTechnician ? (
                        <span className="text-dark fw-medium">{ticket.assignedTechnician.name}</span>
                      ) : (
                        <span className="text-secondary fst-italic">Pending Assignment</span>
                      )}
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-outline-primary btn-sm rounded-pill px-3"
                        onClick={() => {
                          setSelectedTicketId(ticket._id);
                          setShowDetailModal(true);
                        }}
                      >
                        <i className="bi bi-eye me-1"></i> View Details
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Raise Ticket Modal */}
      {showRaiseModal && (
        <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(15, 23, 42, 0.5)' }}>
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content card-premium border-0 shadow-lg">
              <div className="modal-header bg-light border-bottom px-4 py-3">
                <h5 className="modal-title fw-bold text-dark">Raise New Service Ticket</h5>
                <button type="button" className="btn-close" onClick={() => setShowRaiseModal(false)}></button>
              </div>
              <form onSubmit={handleRaiseTicket}>
                <div className="modal-body p-4">
                  {formError && <div className="alert alert-danger py-2 small">{formError}</div>}
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Issue Title</label>
                    <input 
                      type="text" 
                      className="form-control" 
                      placeholder="Brief title of the issue"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Issue Category</label>
                    <select className="form-select" value={category} onChange={(e) => setCategory(e.target.value)}>
                      <option value="fan_repair">Fan Repair</option>
                      <option value="ac_repair">AC Repair</option>
                      <option value="electrical">Electrical Issue</option>
                      <option value="plumbing">Plumbing</option>
                      <option value="appliance_repair">Appliance Repair</option>
                      <option value="other">Other Issues</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Issue Priority</label>
                    <select className="form-select" value={priority} onChange={(e) => setPriority(e.target.value)}>
                      <option value="low">Low (Standard repair)</option>
                      <option value="medium">Medium (Requires attention soon)</option>
                      <option value="high">High (Urgent / Breakdown)</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold text-secondary">Issue Description</label>
                    <textarea 
                      className="form-control" 
                      rows="4" 
                      placeholder="Please detail the problem (e.g. AC is not cooling, fan is making noise)"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                  </div>
                </div>
                <div className="modal-footer bg-light border-top px-4 py-3">
                  <button type="button" className="btn btn-secondary rounded-pill px-3" onClick={() => setShowRaiseModal(false)}>Cancel</button>
                  <button type="submit" className="btn btn-primary rounded-pill px-4" disabled={formLoading}>
                    {formLoading && <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>}
                    Submit Ticket
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Ticket Details Modal */}
      {selectedTicketId && (
        <TicketDetailsModal 
          ticketId={selectedTicketId}
          isOpen={showDetailModal}
          onClose={() => {
            setShowDetailModal(false);
            setSelectedTicketId(null);
          }}
          onUpdate={fetchTickets}
        />
      )}
    </div>
  );
};

export default CustomerDashboard;
