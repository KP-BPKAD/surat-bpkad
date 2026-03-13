// src/pages/AdminUsers.js
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

const AdminUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [currentUser, setCurrentUser] = useState({ email: '', role: 'user' });
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await api.get('/users');
      setUsers(res.data);
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Akses ditolak. Hanya admin yang bisa mengakses halaman ini.');
        navigate('/dashboard');
      } else {
        setError('Gagal memuat daftar user.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleShowAdd = () => {
    setIsEdit(false);
    setCurrentUser({ email: '', role: 'user' });
    setShowModal(true);
  };

  const handleShowEdit = (user) => {
    setIsEdit(true);
    setCurrentUser({ id: user._id, email: user.email, role: user.role });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (isEdit) {
        await api.put(`/users/${currentUser.id}`, {
          email: currentUser.email,
          role: currentUser.role
        });
      } else {
        await api.post('/users', {
          email: currentUser.email,
          password: 'rahasia123', // default password
          role: currentUser.role
        });
      }
      setShowModal(false);
      fetchUsers();
      alert(isEdit ? 'User berhasil diperbarui!' : 'User berhasil ditambahkan!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menyimpan data user.');
    }
  };

  const handleDelete = async (id, email) => {
    if (!window.confirm(`Yakin hapus user: ${email}?`)) return;
    try {
      await api.delete(`/users/${id}`);
      setUsers(users.filter(u => u._id !== id));
      alert('User berhasil dihapus!');
    } catch (err) {
      alert(err.response?.data?.message || 'Gagal menghapus user.');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p>Loading daftar user...</p>
      </Container>
    );
  }

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>Manajemen Pengguna</Card.Title>
            <Button variant="success" onClick={handleShowAdd}>
              + Tambah User
            </Button>
          </div>

          {error && <Alert variant="danger">{error}</Alert>}

          <Table striped bordered hover responsive>
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id}>
                  <td>{user.email}</td>
                  <td>
                    <span className={`badge bg-${user.role === 'admin' ? 'danger' : 'secondary'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>
                    <Button
                      size="sm"
                      variant="warning"
                      className="me-2"
                      onClick={() => handleShowEdit(user)}
                    >
                      Edit
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => handleDelete(user._id, user.email)}
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
          <Modal.Title>{isEdit ? 'Edit User' : 'Tambah User Baru'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group className="mb-3">
              <Form.Label>Email</Form.Label>
              <Form.Control
                type="email"
                value={currentUser.email}
                onChange={(e) => setCurrentUser({ ...currentUser, email: e.target.value })}
                required
              />
            </Form.Group>
            
            <Form.Group className="mb-3">
              <Form.Label>Role</Form.Label>
              <Form.Select
                value={currentUser.role}
                onChange={(e) => setCurrentUser({ ...currentUser, role: e.target.value })}
              >
                <option value="pimpinan">Pimpinan</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </Form.Select>
            </Form.Group>
            {!isEdit && (
              <Alert variant="info">
                Password default: <strong>rahasia123</strong> (user disarankan ganti setelah login)
              </Alert>
            )}
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

export default AdminUsers;