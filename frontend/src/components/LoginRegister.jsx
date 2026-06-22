import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const LoginRegister = () => {
  const { login, register, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('customer');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/');
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    if (isLogin) {
      const result = await login(email, password);
      setLoading(false);
      if (result.success) {
        navigate('/');
      } else {
        setError(result.message);
      }
    } else {
      if (!name.trim()) {
        setError('Please enter your full name.');
        setLoading(false);
        return;
      }
      const result = await register(name, email, password, role);
      setLoading(false);
      if (result.success) {
        setSuccess('Registration successful! Logging in...');
        setTimeout(() => {
          navigate('/');
        }, 1200);
      } else {
        setError(result.message);
      }
    }
  };

  const fillAdminCredentials = () => {
    setEmail('admin@service.com');
    setPassword('Admin@123');
    setIsLogin(true);
  };

  return (
    <div className="container py-5">
      <div className="row justify-content-center align-items-center mt-5">
        <div className="col-md-5">
          <div className="card card-premium p-4 shadow-lg border-0">
            {/* Header Tabs */}
            <div className="d-flex mb-4 border-bottom">
              <button 
                type="button"
                className={`btn flex-fill border-0 fw-bold pb-2 rounded-0 ${isLogin ? 'text-primary' : 'text-secondary'}`}
                style={{ borderBottom: isLogin ? '3px solid var(--primary-color)' : 'none' }}
                onClick={() => { setIsLogin(true); setError(''); }}
              >
                Sign In
              </button>
              <button 
                type="button"
                className={`btn flex-fill border-0 fw-bold pb-2 rounded-0 ${!isLogin ? 'text-primary' : 'text-secondary'}`}
                style={{ borderBottom: !isLogin ? '3px solid var(--primary-color)' : 'none' }}
                onClick={() => { setIsLogin(false); setError(''); }}
              >
                Register
              </button>
            </div>

            <h4 className="fw-bold text-center text-dark mb-4">
              {isLogin ? 'Welcome Back!' : 'Create Your Account'}
            </h4>

            {error && <div className="alert alert-danger py-2 small" role="alert">{error}</div>}
            {success && <div className="alert alert-success py-2 small" role="alert">{success}</div>}

            <form onSubmit={handleSubmit}>
              {!isLogin && (
                <div className="mb-3">
                  <label className="form-label small fw-semibold text-secondary">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0"><i className="bi bi-person text-secondary"></i></span>
                    <input 
                      type="text" 
                      className="form-control bg-light border-start-0" 
                      placeholder="e.g. Jane Doe" 
                      value={name} 
                      onChange={(e) => setName(e.target.value)}
                      required 
                    />
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label small fw-semibold text-secondary">Email Address</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-envelope text-secondary"></i></span>
                  <input 
                    type="email" 
                    className="form-control bg-light border-start-0" 
                    placeholder="e.g. name@example.com" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)}
                    required 
                  />
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label small fw-semibold text-secondary">Password</label>
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0"><i className="bi bi-shield-lock text-secondary"></i></span>
                  <input 
                    type="password" 
                    className="form-control bg-light border-start-0" 
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)}
                    required 
                  />
                </div>
              </div>

              {!isLogin && (
                <div className="mb-4">
                  <label className="form-label small fw-semibold text-secondary d-block">Account Role</label>
                  <div className="d-flex gap-3">
                    <div className="form-check flex-fill p-2 border rounded bg-light d-flex align-items-center">
                      <input 
                        className="form-check-input ms-2" 
                        type="radio" 
                        name="role" 
                        id="roleCustomer" 
                        checked={role === 'customer'}
                        onChange={() => setRole('customer')} 
                      />
                      <label className="form-check-label fw-semibold ms-2 cursor-pointer small text-dark mb-0" htmlFor="roleCustomer">
                        Customer
                      </label>
                    </div>
                    <div className="form-check flex-fill p-2 border rounded bg-light d-flex align-items-center">
                      <input 
                        className="form-check-input ms-2" 
                        type="radio" 
                        name="role" 
                        id="roleTechnician" 
                        checked={role === 'technician'}
                        onChange={() => setRole('technician')} 
                      />
                      <label className="form-check-label fw-semibold ms-2 cursor-pointer small text-dark mb-0" htmlFor="roleTechnician">
                        Technician
                      </label>
                    </div>
                  </div>
                </div>
              )}

              <button 
                type="submit" 
                className="btn btn-primary w-100 rounded-pill py-2.5 fw-semibold d-flex align-items-center justify-content-center gap-2"
                disabled={loading}
              >
                {loading && <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>}
                <span>{isLogin ? 'Sign In' : 'Register'}</span>
              </button>
            </form>

            <div className="mt-4 pt-3 border-top bg-light p-3 rounded text-center small">
              <span className="text-secondary d-block fw-semibold mb-2">💡 Quick Credentials for Evaluation</span>
              <button 
                type="button" 
                className="btn btn-outline-dark btn-sm rounded-pill px-3 py-1"
                onClick={fillAdminCredentials}
              >
                Quick Fill Admin Account
              </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginRegister;
