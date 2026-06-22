import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import TicketDetailsModal from './TicketDetailsModal';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Selected ticket for details modal
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Search & Filters
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterTech, setFilterTech] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Action states
  const [actionLoading, setActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Build filters
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterCategory) params.category = filterCategory;
      if (filterPriority) params.priority = filterPriority;
      if (filterTech) params.assignedTechnician = filterTech;
      if (search) params.search = search;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      // Make parallel API requests
      const [ticketsRes, techsRes, statsRes] = await Promise.all([
        axios.get('/api/admin/tickets', { params }),
        axios.get('/api/admin/technicians'),
        axios.get('/api/admin/stats')
      ]);

      setTickets(ticketsRes.data);
      setTechnicians(techsRes.data);
      setStats(statsRes.data);
    } catch (err) {
      setError('Failed to retrieve dashboard records. Please check database connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [filterStatus, filterCategory, filterPriority, filterTech, search, startDate, endDate]);

  const handleQuickAssign = async (ticketId, techId) => {
    try {
      setActionLoading(true);
      setError('');
      
      await axios.put('/api/admin/assign-technician', {
        ticketId,
        technicianId: techId || null
      });
      
      // Refresh database records
      await fetchDashboardData();
    } catch (err) {
      setError(err.response?.data?.message || 'Assignment failed.');
    } finally {
      setActionLoading(false);
    }
  };

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

  // Convert categories names to human readable
  const formatCategoryName = (name) => {
    return name ? name.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase()) : '';
  };

  return (
    <div className="container py-4">
      {/* Welcome Banner */}
      <div className="hero-auth bg-gradient-admin p-4 mb-4 text-white d-flex justify-content-between align-items-center flex-wrap gap-3">
        <div>
          <h2 className="fw-bold mb-1">Administrative Dashboard</h2>
          <p className="text-light text-opacity-75 mb-0">System-wide monitoring, ticket assignments, activity logs, and technician management.</p>
        </div>
        <div className="bg-white bg-opacity-10 px-4 py-2 rounded-pill border border-white border-opacity-10 text-info font-bold small">
          <i className="bi bi-shield-lock-fill me-2"></i>
          <span>Super Admin Access</span>
        </div>
      </div>

      {error && <div className="alert alert-danger shadow-sm">{error}</div>}

      {/* Metrics Cards */}
      {stats && (
        <div className="row g-3 mb-4">
          <div className="col-6 col-lg-3">
            <div className="card card-premium p-3 border-0 border-start border-4 border-info">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium">Open Tickets</span>
                  <h3 className="fw-bold text-dark mt-1 mb-0">{stats.statusCounts.open}</h3>
                </div>
                <div className="bg-info bg-opacity-10 p-2.5 rounded-circle text-info">
                  <i className="bi bi-envelope-open fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card card-premium p-3 border-0 border-start border-4 border-warning">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium">In Progress</span>
                  <h3 className="fw-bold text-dark mt-1 mb-0">{stats.statusCounts.in_progress}</h3>
                </div>
                <div className="bg-warning bg-opacity-10 p-2.5 rounded-circle text-warning">
                  <i className="bi bi-gear-wide-connected fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card card-premium p-3 border-0 border-start border-4 border-success">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium">Resolved Issues</span>
                  <h3 className="fw-bold text-dark mt-1 mb-0">{stats.statusCounts.resolved}</h3>
                </div>
                <div className="bg-success bg-opacity-10 p-2.5 rounded-circle text-success">
                  <i className="bi bi-check2-circle fs-4"></i>
                </div>
              </div>
            </div>
          </div>
          <div className="col-6 col-lg-3">
            <div className="card card-premium p-3 border-0 border-start border-4 border-secondary">
              <div className="d-flex align-items-center justify-content-between">
                <div>
                  <span className="text-secondary small fw-medium">Closed Tickets</span>
                  <h3 className="fw-bold text-dark mt-1 mb-0">{stats.statusCounts.closed}</h3>
                </div>
                <div className="bg-secondary bg-opacity-10 p-2.5 rounded-circle text-secondary">
                  <i className="bi bi-archive fs-4"></i>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Charts Panel */}
      {stats && (
        <div className="row g-4 mb-4">
          
          {/* Category Breakdown (Vertical Progress Meters) */}
          <div className="col-lg-6">
            <div className="card card-premium border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">
                <i className="bi bi-grid-3x3-gap me-1 text-primary"></i> Issues Category Distribution
              </h5>
              <div className="d-flex flex-column gap-3 mt-2">
                {['fan_repair', 'ac_repair', 'electrical', 'plumbing', 'appliance_repair', 'other'].map(cat => {
                  const count = stats.categoryCounts[cat] || 0;
                  const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                  return (
                    <div key={cat}>
                      <div className="d-flex justify-content-between align-items-center text-sm mb-1">
                        <span className="text-dark fw-medium">{formatCategoryName(cat)}</span>
                        <span className="text-secondary fw-semibold">{count} ({percent}%)</span>
                      </div>
                      <div className="progress" style={{ height: '8px' }}>
                        <div 
                          className="progress-bar bg-primary rounded-pill" 
                          role="progressbar" 
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Priority breakdown and Status summary charts */}
          <div className="col-lg-6">
            <div className="card card-premium border-0 p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">
                <i className="bi bi-pie-chart me-1 text-success"></i> Priority & Total Load Analytics
              </h5>
              
              <div className="row h-100 align-items-center">
                {/* SVG Visual Meter */}
                <div className="col-sm-5 text-center mb-3 mb-sm-0">
                  <div className="position-relative d-inline-block">
                    <svg width="150" height="150" viewBox="0 0 36 36" className="circular-chart">
                      <path className="circle-bg"
                        style={{ fill: 'none', stroke: '#e2e8f0', strokeWidth: '3' }}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                      <path className="circle"
                        style={{ fill: 'none', stroke: '#4f46e5', strokeWidth: '3', strokeDasharray: `${stats.total > 0 ? 100 : 0}, 100`, strokeLinecap: 'round' }}
                        d="M18 2.0845
                          a 15.9155 15.9155 0 0 1 0 31.831
                          a 15.9155 15.9155 0 0 1 0 -31.831"
                      />
                    </svg>
                    <div className="position-absolute top-50 start-50 translate-middle text-center">
                      <span className="text-secondary text-xxs d-block uppercase tracking-wider">Total</span>
                      <strong className="fs-3 text-dark d-block leading-none">{stats.total}</strong>
                    </div>
                  </div>
                </div>

                {/* Priority Meters */}
                <div className="col-sm-7">
                  <div className="d-flex flex-column gap-3">
                    {['high', 'medium', 'low'].map(prio => {
                      const count = stats.priorityCounts[prio] || 0;
                      const percent = stats.total > 0 ? Math.round((count / stats.total) * 100) : 0;
                      const colorMap = { high: 'bg-danger', medium: 'bg-primary', low: 'bg-secondary' };
                      return (
                        <div key={prio}>
                          <div className="d-flex justify-content-between align-items-center text-sm mb-1">
                            <span className="text-dark fw-medium text-capitalize">{prio} Priority</span>
                            <span className="text-secondary fw-semibold">{count} ({percent}%)</span>
                          </div>
                          <div className="progress" style={{ height: '8px' }}>
                            <div 
                              className={`progress-bar ${colorMap[prio]} rounded-pill`} 
                              role="progressbar" 
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

            </div>
          </div>

        </div>
      )}

      {/* Advanced Filter Panel */}
      <div className="card card-premium p-3 border-0 mb-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-sliders me-1"></i> Filter & Search System Tickets</h5>
        <div className="row g-3">
          
          {/* Row 1: Search and Status/Category/Priority */}
          <div className="col-lg-3 col-md-6">
            <label className="form-label small text-secondary fw-semibold">Search Query</label>
            <input 
              type="text" 
              className="form-control" 
              placeholder="Search ID, Title, Customer..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="col-lg-2 col-md-6">
            <label className="form-label small text-secondary fw-semibold">Status</label>
            <select className="form-select" value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-4">
            <label className="form-label small text-secondary fw-semibold">Category</label>
            <select className="form-select" value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option value="fan_repair">Fan Repair</option>
              <option value="ac_repair">AC Repair</option>
              <option value="electrical">Electrical</option>
              <option value="plumbing">Plumbing</option>
              <option value="appliance_repair">Appliance Repair</option>
              <option value="other">Other Issues</option>
            </select>
          </div>
          <div className="col-lg-2 col-md-4">
            <label className="form-label small text-secondary fw-semibold">Priority</label>
            <select className="form-select" value={filterPriority} onChange={(e) => setFilterPriority(e.target.value)}>
              <option value="">All Priorities</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="col-lg-3 col-md-4">
            <label className="form-label small text-secondary fw-semibold">Assigned Technician</label>
            <select className="form-select" value={filterTech} onChange={(e) => setFilterTech(e.target.value)}>
              <option value="">All Technicians</option>
              <option value="unassigned">Unassigned Tickets</option>
              {technicians.map(t => (
                <option key={t._id} value={t._id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Row 2: Date Range Filter */}
          <div className="col-md-6 col-lg-3">
            <label className="form-label small text-secondary fw-semibold">Start Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>
          <div className="col-md-6 col-lg-3">
            <label className="form-label small text-secondary fw-semibold">End Date</label>
            <input 
              type="date" 
              className="form-control" 
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
          <div className="col-md-12 col-lg-6 d-flex align-items-end justify-content-end gap-2">
            <button 
              className="btn btn-outline-secondary rounded-pill px-3 py-2"
              onClick={() => {
                setSearch('');
                setFilterCategory('');
                setFilterPriority('');
                setFilterStatus('');
                setFilterTech('');
                setStartDate('');
                setEndDate('');
              }}
            >
              Clear Filters
            </button>
          </div>

        </div>
      </div>

      {/* Ticket List Table */}
      <div className="card card-premium border-0 p-4">
        <h5 className="fw-bold text-dark mb-3"><i className="bi bi-grid-fill me-1"></i> System-Wide Service Tickets</h5>
        
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : tickets.length === 0 ? (
          <div className="text-center py-5 text-secondary">
            <i className="bi bi-inbox display-4 text-muted"></i>
            <p className="mt-3">No system tickets found.</p>
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
                  <th>Status</th>
                  <th>Assigned Technician</th>
                  <th>Raised Date</th>
                  <th className="text-end">Actions</th>
                </tr>
              </thead>
              <tbody className="small">
                {tickets.map(ticket => (
                  <tr key={ticket._id}>
                    <td><span className="font-monospace fw-bold text-secondary">{ticket.ticketId}</span></td>
                    <td>
                      <div className="d-flex flex-column">
                        <strong className="text-dark">{ticket.customer?.name}</strong>
                        <span className="text-secondary text-xs">{ticket.customer?.email}</span>
                      </div>
                    </td>
                    <td><span className="fw-medium text-dark">{ticket.title}</span></td>
                    <td className="text-capitalize">{ticket.category.replace('_', ' ')}</td>
                    <td>{getPriorityBadge(ticket.priority)}</td>
                    <td>{getStatusBadge(ticket.status)}</td>
                    <td>
                      <select 
                        className="form-select form-select-sm" 
                        value={ticket.assignedTechnician?._id || ''} 
                        onChange={(e) => handleQuickAssign(ticket._id, e.target.value)}
                        disabled={actionLoading || ticket.status === 'closed'}
                      >
                        <option value="">Unassigned</option>
                        {technicians.map(tech => (
                          <option key={tech._id} value={tech._id}>{tech.name}</option>
                        ))}
                      </select>
                    </td>
                    <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                    <td className="text-end">
                      <button 
                        className="btn btn-outline-dark btn-sm rounded-pill px-3"
                        onClick={() => {
                          setSelectedTicketId(ticket._id);
                          setShowDetailModal(true);
                        }}
                      >
                        <i className="bi bi-pencil-square me-1"></i> Edit/Audit
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
          onUpdate={fetchDashboardData}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
