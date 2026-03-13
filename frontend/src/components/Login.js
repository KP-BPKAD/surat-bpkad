// src/components/Login.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Row,
  Col,
  Form,
  Button,
  Alert,
  Card,
  Image
} from 'react-bootstrap';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Tambahkan logging
    console.log('Mengirim login:', { email, password });

    try {
      const res = await api.post('/auth/login', { email, password });
      console.log('Login berhasil:', res.data); // ← tambahkan ini

      // Simpan token
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('userEmail', email);
      localStorage.setItem('userProfile', JSON.stringify({
        email: email,
        role: res.data.role
      }));

      navigate('/dashboard');
    } catch (err) {
      console.error('Login gagal:', err.response); // ← tambahkan ini
      setError(err.response?.data?.message || 'Gagal login. Cek koneksi backend.');
    }
    setLoading(false);
  };

  return (
    // 🔥 Ganti background container dengan gambar + gradient
    <div 
      className="d-flex align-items-center justify-content-center min-vh-100"
      style={{
        backgroundImage: 
          'linear-gradient(135deg, rgba(0, 88, 252, 0.7) 0%, rgba(0, 195, 255, 0.5) 50%, rgba(0, 0, 0, 0.6) 100%), ' +
          'url("/Gambar/BPKAD.webp")', // 🔥 Gambar sebagai background bawah
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <Card 
        className="shadow-sm border-3 rounded"
        style={{ width: '700px', maxWidth: '100%', backdropFilter: 'blur(10px)' }} // Optional blur effect
      >
        {/* Header Bar Biru */}
        <div className="bg-white border-bottom" style={{ height: '4px', backgroundColor: '#0058fc' }}></div>

        <Row className="g-0">
          {/* Kolom Kiri: Logo & Branding */}
          <Col md={5} className="d-flex flex-column align-items-center justify-content-center p-5 bg-white">
            <div className="text-center mb-3">
              <Image
                src="/Gambar/images.jpeg"
                alt="BPKAD"
                width={150}
                height={180}
              />
              <h3 className="mt-3 fw-bold text-primary">BPKAD</h3>
              <h6 className="mt-0 fw-bold text-primary">PROVINSI PAPUA BARAT</h6>
            </div>
          </Col>

          {/* Kolom Kanan: Form Login */}
          <Col md={7} className="p-5 bg-white">
            <div className="mb-4">
              <div className="d-flex align-items-center gap-2">
                <div className="bg-primary text-white rounded px-2 py-1" style={{ fontSize: '14px' }}>
                  BPKAD
                </div>
                <h2 className="fw-bold mb-0">ARCHISMART</h2>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mb-4">
                {error}
              </Alert>
            )}

            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3" controlId="formEmail">
                <Form.Label className="fw-medium">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="user@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoFocus
                />
              </Form.Group>

              <Form.Group className="mb-4" controlId="formPassword">
                <Form.Label className="fw-medium">Password</Form.Label>
                <div className="position-relative">
                  <Form.Control
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength="6"
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="position-absolute top-50 end-0 translate-middle-y"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ border: 'none', background: 'transparent' }}
                    disabled={loading}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </div>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-3 fw-bold"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                    Memproses...
                  </>
                ) : (
                  'LOGIN'
                )}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <small className="text-muted">
                Belum punya akun?{' '}
                <a href="/register" className="text-primary fw-bold text-decoration-none">
                  Daftar di sini
                </a>
              </small>
            </div>
          </Col>
        </Row>

        {/* Footer */}
        <div className="text-center py-3 border-top mt-4">
          <small className="text-muted">
            © 2026 Badan Pengelola Keuangan dan Aset Daerah | Provinsi Papua Barat
          </small>
        </div>
      </Card>
    </div>
  );
};

export default Login;