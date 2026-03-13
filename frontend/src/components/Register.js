// src/components/Register.js
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
  Image,
  InputGroup
} from 'react-bootstrap';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 🔥 State untuk password
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false); // 🔥 State untuk konfirmasi
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Password dan konfirmasi harus sama.');
      return;
    }

    setLoading(true);
    try {
      await api.post('/auth/register', { email, password });
      alert('Registrasi berhasil! Silakan login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Gagal mendaftar.');
    } finally {
      setLoading(false);
    }
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
        <div className="bg-white border-3 " style={{ height: '4px', backgroundColor: '#0058fc' }}></div>

        <Row className="g-0">
          {/* Kiri */}
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

          {/* Kanan */}
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
              <Form.Group className="mb-3">
                <Form.Label className="fw-medium">Email</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="mikasa@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Password</Form.Label>
                <InputGroup>
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
                    disabled={loading}
                    style={{
                      border: 'none',
                      background: 'transparent'
                    }}
                  >
                    {showPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputGroup>
              </Form.Group>

              <Form.Group className="mb-4">
                <Form.Label className="fw-medium">Konfirmasi Password</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <Button
                    variant="outline-secondary"
                    size="sm"
                    className="position-absolute top-50 end-0 translate-middle-y"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    disabled={loading}
                    style={{
                      border: 'none',
                      background: 'transparent'
                    }}
                  >
                    {showConfirmPassword ? 'Hide' : 'Show'}
                  </Button>
                </InputGroup>
              </Form.Group>

              <Button
                variant="primary"
                type="submit"
                className="w-100 py-3 fw-bold"
                disabled={loading}
              >
                {loading ? 'Mendaftar...' : 'DAFTAR'}
              </Button>
            </Form>

            <div className="text-center mt-4">
              <small className="text-muted">
                Sudah punya akun?{' '}
                <a href="/login" className="text-primary fw-bold text-decoration-none">
                  Masuk di sini
                </a>
              </small>
            </div>
          </Col>
        </Row>

        <div className="text-center py-3 border-top">
          <small className="text-muted">
            © 2026 Badan Pengelola Keuangan dan Aset Daerah | Provinsi Papua Barat
          </small>
        </div>
      </Card>
    </div>
  );
};

export default Register;