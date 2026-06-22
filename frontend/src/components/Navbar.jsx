import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Navbar = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return <span className="badge bg-dark border border-secondary text-info ms-2">Admin</span>;
      case 'technician':
        return <span className="badge bg-success text-white ms-2">Technician</span>;
      default:
        return <span className="badge bg-primary text-white ms-2">Customer</span>;
    }
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark shadow-sm py-3 sticky-top">
      <div className="container">
        <Link className="navbar-brand d-flex align-items-center gap-2" to="/">
          <i className="bi bi-tools text-info fs-3"></i>
          <span className="fw-bold tracking-tight">SupportCore</span>
        </Link>
        
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
          aria-controls="navbarNav"
          aria-expanded="false"
          aria-label="Toggle navigation"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            {isAuthenticated && (
              <li className="nav-item">
                <Link className="nav-link" to="/">
                  <i className="bi bi-speedometer2 me-1"></i> Dashboard
                </Link>
              </li>
            )}
          </ul>

          <div className="navbar-nav align-items-center gap-3">
            {isAuthenticated ? (
              <>
                <div className="d-flex align-items-center bg-secondary bg-opacity-25 px-3 py-2 rounded-pill border border-secondary border-opacity-25">
                  <i className="bi bi-person-circle text-info"></i>
                  <span className="text-light fw-medium small ms-2">{user.name}</span>
                  {getRoleBadge(user.role)}
                </div>
                <button 
                  className="btn btn-outline-danger btn-sm rounded-pill px-3 py-2 d-flex align-items-center gap-1" 
                  onClick={handleLogout}
                >
                  <i className="bi bi-box-arrow-right"></i>
                  <span>Logout</span>
                </button>
              </>
            ) : (
              <Link className="btn btn-info btn-sm rounded-pill px-4 py-2 text-dark fw-semibold" to="/login">
                Login / Register
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
