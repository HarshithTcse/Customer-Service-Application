import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TicketDetailsModal from './TicketDetailsModal';

const TechnicianDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected ticket for details modal
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filters
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('');

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (search) params.search = search;

      const response = await axios.get('/api/technician/tickets', { params });
      setTickets(response.data);
    } catch (err) {
      setError('Could not load assigned tickets. Please refresh.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [filterStatus, search]);

  const getMetrics = () => {
    const counts = { total: tickets.length, unclaimed: 0, myActive: 0, resolved: 0 };
    tickets.forEach(t => {
      if (!t.assignedTechnician) counts.unclaimed++;
      else if (t.assignedTechnician._id === user._id && (t.status === 'open' || t.status === 'in_progress')) counts.myActive++;
      
      if (t.status === 'resolved' || t.status === 'closed') counts.resolved++;
    });
    return counts;
  };

  const metrics = getMetrics();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'open':
        return <span className="badge bg-custom bg-info text-dark">Open / Unclaimed</span>;
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
      return <span className="badge bg-custom bg-success text-white"><i className="bi bi-wallet2"></i> Paid</span>;
    }
    return <span className="badge bg-custom bg-danger text-white"><i className="bi bi-lock-fill"></i> Unpaid</span>;
  };

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="hero-auth bg-gradient-tech p-4 mb-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Technician Portal: {user.name}</h2>
          <p className="text-light text-opacity-75 mb-0">Review the open tickets queue, claim paid tasks, and resolve issues.</p>
        </div>
        <div className="bg-white bg-opacity-20 px-4 py-2 rounded-pill border border-white border-opacity-25">
          <i className="bi bi-tools me-2"></i>
          <span>Open Queue Enabled</span>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="row g-3 mb-4">
        <div className="col-4">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Unclaimed Tickets</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.unclaimed}</h3>
              </div>
              <div className="bg-primary bg-opacity-10 p-2.5 rounded-circle text-primary">
                <i className="bi bi-envelope-open fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">My Active Jobs</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.myActive}</h3>
              </div>
              <div className="bg-warning bg-opacity-10 p-2.5 rounded-circle text-warning">
                <i className="bi bi-gear-wide fs-4"></i>
              </div>
            </div>
          </div>
        </div>
        <div className="col-4">
          <div className="card card-premium p-3 border-0">
            <div className="d-flex align-items-center justify-content-between">
              <div>
                <span className="text-secondary small fw-medium">Completed (Resolved/Closed)</span>
                <h3 className="fw-bold text-dark mt-1 mb-0">{metrics.resolved}</h3>
              </div>
              <div className="bg-success bg-opacity-10 p-2.5 rounded-circle text-success">
                <i className="bi bi-check2-all fs-4"></i>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="card card-premium p-3 border-0 mb-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-funnel me-1"></i> Filter Service Tickets</h5>
        <div className="row g-3">
          <div className="col-md-6">
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search by Ticket ID or Title..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-md-6">
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open / Unclaimed</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tickets List */}
      <div className="card card-premium border-0 p-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-list-task me-1"></i> Available Service Tickets Queue</h5>
        {error && <div className="alert alert-danger">{error}</div>}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-clipboard display-4 text-muted"></i>
            <p className="mt-3">No service tickets raised in the system.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead className="table-light text-secondary small">
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer</th>
                  <th>Issue Title</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Assigned Tech</th>
                  <th>Last Update</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td><span className="font-monospace fw-bold text-secondary">{ticket.ticketId}</span></td>
                    <td><strong className="text-dark">{ticket.customer?.name}</strong></td>
                    <td>{ticket.title}</td>
                    <td className="text-capitalize">{ticket.category.replace('_', ' ')}</td>
                    <td>{getPriorityBadge(ticket.priority)}</td>
                    <td>{getPaymentBadge(ticket.paymentStatus)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      {ticket.assignedTechnician ? (
                        <span className={`fw-medium ${ticket.assignedTechnician._id === user._id ? 'text-primary' : 'text-dark'}`}>
                          {ticket.assignedTechnician._id === user._id ? 'Assigned to Me' : ticket.assignedTechnician.name}
                        </span>
                      ) : (
                        <span className="text-secondary fst-italic">Unclaimed</span>
                      )}
                    </td>
                    <td>{new Date(ticket.updatedAt).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-primary btn-sm rounded-pill px-3"
                        onClick={() => {
                          setSelectedTicketId(ticket._id);
                          setShowDetailModal(true);
                        }}
                      >
                        <i className="bi bi-search me-1"></i> Inspect Ticket
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

export default TechnicianDashboard;
