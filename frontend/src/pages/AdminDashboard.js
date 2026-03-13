// src/pages/AdminDashboard.js
import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Table,
  Button,
  Navbar,
  Nav,
  Modal,
  Alert,
  Spinner
} from 'react-bootstrap';

const AdminDashboard = () => {
  const [letters, setLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchAllLetters = async () => {
      try {
        const res = await api.get('/letters/all');
        setLetters(res.data);
      } catch (err) {
        console.error('Error di /letters/all:', err);
        if (err.response?.status === 403) {
          alert('Akses ditolak. Hanya admin yang bisa mengakses halaman ini.');
          navigate('/dashboard', { replace: true });
          return;
        }
        setError(err.response?.data?.message || 'Gagal memuat data surat.');
      } finally {
        setLoading(false);
      }
    };

    fetchAllLetters();
  }, [navigate]);

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Memuat semua surat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => window.location.reload()}>Muat Ulang</Button>
      </Container>
    );
  }

  const handleDelete = async () => {
    if (!letterToDelete) return;
    try {
      await api.delete(`/letters/admin/${letterToDelete._id}`);
      setLetters(letters.filter(l => l._id !== letterToDelete._id));
      setShowDeleteModal(false);
      alert('Surat berhasil dihapus!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus surat.');
    }
  };

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Dashboard Admin</Navbar.Brand>
          <Nav className="ms-auto">
            <Button
              variant="outline-light"
              size="sm"
              onClick={() => navigate('/dashboard')}
            >
              Kembali ke Dashboard User
            </Button>
            <Button
              variant="outline-light"
              size="sm"
              className="ms-2"
              onClick={() => {
                localStorage.removeItem('token');
                localStorage.removeItem('userEmail');
                navigate('/login');
              }}
            >
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <h3>Semua Surat ({letters.length})</h3>
        <Table striped bordered hover responsive>
          <thead>
            <tr>
              <th>No</th>
              <th>No Surat</th>
              <th>Perihal</th>
              <th>Asal Surat</th>
              <th>Pengirim</th>
              <th>Penerima</th>
              <th>Tgl Terima</th>
              <th>Aksi</th>
            </tr>
          </thead>
          <tbody>
            {letters.map((letter, i) => (
              <tr key={letter._id}>
                <td>{i + 1}</td>
                <td>{letter.noSurat}</td>
                <td>{letter.perihal}</td>
                <td>{letter.asalSurat}</td>
                <td>
                  {letter.pengirimId?.email 
                    ? letter.pengirimId.email 
                    : 'Tidak ditemukan'}
                </td>
                <td>
                  {letter.penerimaId?.email 
                    ? letter.penerimaId.email 
                    : 'Tidak ditemukan'}
                </td>
                <td>{new Date(letter.tanggalTerima).toLocaleDateString()}</td>
                <td>
                  {/* Tombol Lihat */}
                  <Button
                    variant="outline-primary"
                    size="sm"
                    className="me-1"
                    onClick={() => navigate(`/surat/${letter._id}`)}
                  >
                    Lihat
                  </Button>
                  
                  {/* Tombol Edit */}
                  <Button
                    variant="outline-warning"
                    size="sm"
                    className="me-1"
                    onClick={() => navigate(`/surat/edit/${letter._id}`)}
                  >
                    Edit
                  </Button>
                  
                  {/* Tombol Hapus */}
                  <Button
                    variant="outline-danger"
                    size="sm"
                    onClick={() => {
                      setLetterToDelete(letter);
                      setShowDeleteModal(true);
                    }}
                  >
                    Hapus
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      </Container>

      {/* Modal Konfirmasi Hapus */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Surat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Yakin hapus surat berikut?
          <br />
          <strong>{letterToDelete?.noSurat}</strong> – {letterToDelete?.perihal}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            Batal
          </Button>
          <Button variant="danger" onClick={handleDelete}>
            Hapus Sekarang
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default AdminDashboard;