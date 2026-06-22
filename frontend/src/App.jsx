import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import LoginRegister from './components/LoginRegister';
import CustomerDashboard from './components/CustomerDashboard';
import TechnicianDashboard from './components/TechnicianDashboard';
import AdminDashboard from './components/AdminDashboard';

const DashboardSelector = () => {
  const { user } = useAuth();
  if (user?.role === 'admin') {
    return <AdminDashboard />;
  } else if (user?.role === 'technician') {
    return <TechnicianDashboard />;
  } else {
    return <CustomerDashboard />;
  }
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <Navbar />
          <main className="flex-grow-1">
            <Routes>
              <Route 
                path="/" 
                element={
                  <ProtectedRoute>
                    <DashboardSelector />
                  </ProtectedRoute>
                } 
              />
              <Route path="/login" element={<LoginRegister />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <footer className="bg-dark text-secondary py-4 text-center mt-5 border-top border-secondary border-opacity-25 small">
            <div className="container">
              <p className="mb-0">© 2026 SupportCore Ticket Management System. All rights reserved.</p>
            </div>
          </footer>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App;
