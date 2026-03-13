// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './pages/Dashboard';
import AdminDashboard from './pages/AdminDashboard';
import LetterForm from './components/LetterForm'; // ← ini untuk edit & buat baru
import AdminUsers from './pages/AdminUsers';
import Report from './pages/Report';
import AdminClassifications from './pages/AdminClassifications';
import AdminHistory from './pages/AdminHistory';
import UserHistory from './pages/UserHistory';

// Komponen khusus untuk halaman LIHAT (detail)
const LetterDetail = () => {
  // Anda bisa buat komponen terpisah, atau gunakan LetterForm dalam mode "view"
  // Tapi untuk tugas, cukup arahkan ke form edit (karena sudah ada semua field)
  return <LetterForm isView={true} />;
};

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        
        {/* Dashboard User */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        
        {/* Halaman Detail Surat → HARUS DILINDUNGI! */}
        <Route
          path="/surat/:id"
          element={
            <ProtectedRoute>
              <LetterForm isView={true} />
            </ProtectedRoute>
          }
        />
        
        {/* Edit Surat */}
        <Route
          path="/surat/edit/:id"
          element={
            <ProtectedRoute>
              <LetterForm isEdit={true} />
            </ProtectedRoute>
          }
        />
        
        {/* Kirim Surat Baru */}
        <Route
          path="/surat/baru"
          element={
            <ProtectedRoute>
              <LetterForm />
            </ProtectedRoute>
          }
        />
        
        {/* Dashboard Admin */}
        <Route
          path="/admin/surat"
          element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <ProtectedRoute>
              <AdminUsers />
            </ProtectedRoute>
          }
        />
        
        <Route
        path="/laporan"
        element={
          <ProtectedRoute>
            <Report />
          </ProtectedRoute>
        }
        />
        <Route
        path="/admin/classifications"
        element={
          <ProtectedRoute>
            <AdminClassifications />
          </ProtectedRoute>
        }
        />
        <Route
          path="/admin/history"
          element={
            <ProtectedRoute>
              <AdminHistory />
            </ProtectedRoute>
          }
        />
        <Route
        path="/history"
        element={
          <ProtectedRoute>
            <UserHistory />
          </ProtectedRoute>
        }
        />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}

export default App;