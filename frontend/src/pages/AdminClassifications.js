// src/pages/AdminClassifications.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Table,
  Button,
  Modal,
  Form,
  Alert,
  Spinner,
  Card
} from 'react-bootstrap';

const AdminClassifications = () => {
  const [classifications, setClassifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentClassification, setCurrentClassification] = useState({
    nama: '',
    deskripsi: '',
    warna: '#007bff'
  });
  const navigate = useNavigate();

  useEffect(() => {
    fetchClassifications();
  }, []);

  const fetchClassifications = async () => {
    try {
      const res = await api.get('/classifications');
      setClassifications(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Akses ditolak. Hanya admin yang bisa mengakses halaman ini.');
        navigate('/dashboard');
      } else {
        setError('Gagal memuat daftar klasifikasi.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowAdd = () => {
    setIsEdit(false);
    setCurrentClassification({ nama: '', deskripsi: '', warna: '#007bff' });
    setShowModal(true);
  };

  const handleShowEdit = (item) => {
    setIsEdit(true);
    setCurrentClassification({
      id: item._id,
      nama: item.nama,
      deskripsi: item.deskripsi,
      warna: item.warna
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await api.put(`/classifications/${currentClassification.id}`, currentClassification);
      } else {
        await api.post('/classifications', currentClassification);
      }
      setShowModal(false);
      fetchClassifications();
      alert(isEdit ? 'Klasifikasi berhasil diperbarui!' : 'Klasifikasi berhasil ditambahkan!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan klasifikasi.');
    }
  };

  const handleDelete = async (id, nama) => {
    if (!window.confirm(`Yakin hapus klasifikasi: ${nama}?`)) return;
    try {
      await api.delete(`/classifications/${id}`);
      setClassifications(classifications.filter(c => c._id !== id));
      alert('Klasifikasi berhasil dihapus!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus klasifikasi.');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Loading klasifikasi...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>Manajemen Klasifikasi Arsip</Card.Title>
            <Button variant="success" onClick={handleShowAdd}>
              + Tambah Klasifikasi
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Nama</th>
                <th>Deskripsi</th>
                <th>Warna</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {classifications.map(item => (
                <tr key={item._id}>
                  <td>
                    <span className="badge" style={{ backgroundColor: item.warna }}>
                      {item.nama}
                    </span>
                  </td>
                  <td>{item.deskripsi || '-'}</td>
                  <td>
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        backgroundColor: item.warna,
                        border: '1px solid #ccc',
                        display: 'inline-block'
                      }}
                    ></div>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => handleShowEdit(item)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(item._id, item.nama)}
                    >
                      Hapus
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Card.Body>
      </Card>

      {/* Modal Tambah/Edit */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>{isEdit ? 'Edit Klasifikasi' : 'Tambah Klasifikasi Baru'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Nama Klasifikasi</Form.Label>
              <Form.Control
                type="text"
                value={currentClassification.nama}
                onChange={(e) => setCurrentClassification({ ...currentClassification, nama: e.target.value })}
                required
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Deskripsi</Form.Label>
              <Form.Control
                as="textarea"
                rows={2}
                value={currentClassification.deskripsi}
                onChange={(e) => setCurrentClassification({ ...currentClassification, deskripsi: e.target.value })}
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>Warna</Form.Label>
              <Form.Control
                type="color"
                value={currentClassification.warna}
                onChange={(e) => setCurrentClassification({ ...currentClassification, warna: e.target.value })}
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Batal
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Simpan
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
};

export default AdminClassifications;