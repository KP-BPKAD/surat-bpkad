// src/pages/AdminHistory.js
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Spinner,
  Pagination
} from 'react-bootstrap';

const AdminHistory = () => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [filters, setFilters] = useState({
    page: 1,
    limit: 10,
    user: '',
    action: ''
  });
  const [searchParams, setSearchParams] = useState({
    user: '',
    action: ''
  });
  const navigate = useNavigate();

  // Definisikan action yang ditampilkan
  const displayedActions = {
    login: 'Login',
    logout: 'Logout',
    send_letter: 'Kirim Surat',
    edit_letter: 'Edit Surat',
    delete_letter: 'Hapus Surat',
    view_report: 'Lihatz Laporan',
    manage_classification: 'Kelola Klasifikasi',
    manage_user: 'Kelola User'
  };

  useEffect(() => {
    fetchHistory();
  }, [filters]);

  const fetchHistory = async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({
        page: filters.page,
        limit: filters.limit,
        user: filters.user,
        action: filters.action
      });
      const res = await api.get(`/history?${params.toString()}`);

      let data = [];
      let pag = { page: 1, limit: 10, total: 0, totalPages: 1 };

      // 🔍 Parse respons dalam berbagai format
      if (Array.isArray(res.data)) {
        data = res.data;
      } else if (typeof res.data === 'object' && res.data !== null) {
        if (res.data.populatedHistory && Array.isArray(res.data.populatedHistory)) {
          data = res.data.populatedHistory;
        } else if (res.data.history && Array.isArray(res.data.history)) {
          data = res.data.history;
        } else if (res.data.data && Array.isArray(res.data.data)) {
          data = res.data.data;
        } else {
          for (const key in res.data) {
            if (Array.isArray(res.data[key])) {
              data = res.data[key];
              break;
            }
          }
        }

        if (res.data.pagination) {
          pag = res.data.pagination;
        } else {
          pag = {
            page: filters.page,
            limit: filters.limit,
            total: data.length,
            totalPages: 1
          };
        }
      } else {
        data = [];
      }

      // Filter hanya action yang ditampilkan
      const filteredData = data.filter(item => 
        item.action in displayedActions
      );

      setHistory(filteredData);
      setPagination(pag);

    } catch (err) {
      console.error('Fetch history error:', err);
      if (err.response?.status === 403) {
        alert('Akses ditolak. Hanya admin yang bisa mengakses halaman ini.');
        navigate('/dashboard');
      } else {
        setError(err.response?.data?.message || 'Gagal memuat riwayat.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setSearchParams(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSearch = () => {
    setFilters(prev => ({
      ...prev,
      page: 1,
      user: searchParams.user,
      action: searchParams.action
    }));
  };

  const handleReset = () => {
    setSearchParams({ user: '', action: '' });
    setFilters({ page: 1, limit: 10, user: '', action: '' });
  };

  const handlePageChange = (page) => {
    setFilters(prev => ({
      ...prev,
      page
    }));
  };

  const clearAllHistory = async () => {
    if (!window.confirm('Yakin ingin menghapus semua riwayat?')) return;
    try {
      await api.delete('/history/clear');
      alert('Semua riwayat berhasil dihapus.');
      fetchHistory();
    } catch (err) {
      alert('Gagal menghapus riwayat.');
    }
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" />
        <p className="mt-3">Memuat riwayat...</p>
      </Container>
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

  return (
    <Container className="mt-4">
      <Card>
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-3">
            <Card.Title>Riwayat Aktivitas</Card.Title>
            <Button variant="danger" onClick={clearAllHistory}>
              Hapus Semua Riwayat
            </Button>
          </div>

          {/* Filter */}
          <Card className="mb-4">
            <Card.Body>
              <Form>
                <Form.Group className="mb-3">
                  <Form.Label>User (Email)</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Cari berdasarkan email user..."
                    value={searchParams.user}
                    onChange={(e) => handleFilterChange('user', e.target.value)}
                  />
                </Form.Group>
                <Form.Group className="mb-3">
                  <Form.Label>Aktivitas</Form.Label>
                  <Form.Select
                    value={searchParams.action}
                    onChange={(e) => handleFilterChange('action', e.target.value)}
                  >
                    <option value="">Semua Aktivitas</option>
                    <option value="login">Login</option>
                    <option value="logout">Logout</option>
                    <option value="send_letter">Kirim Surat</option>
                    <option value="edit_letter">Edit Surat</option>
                    <option value="delete_letter">Hapus Surat</option>
                    <option value="view_report">Lihat Laporan</option>
                    <option value="manage_classification">Kelola Klasifikasi</option>
                    <option value="manage_user">Kelola User</option>
                  </Form.Select>
                </Form.Group>
                <div className="d-flex gap-2">
                  <Button variant="primary" onClick={handleSearch}>
                    Cari
                  </Button>
                  <Button variant="secondary" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>

          {/* Tabel */}
          {history.length === 0 ? (
            <Alert variant="info" className="text-center">
              Tidak ada riwayat aktivitas untuk filter ini.
            </Alert>
          ) : (
            <Table striped bordered hover responsive>
              <thead>
                <tr>
                  <th>User</th>
                  <th>Aktivitas</th>
                  <th>Deskripsi</th>
                  <th>Waktu</th>
                </tr>
              </thead>
              <tbody>
                {history.map((item, index) => (
                  <tr key={index}>
                    <td>{item.userId?.email || 'Unknown'}</td>
                    <td>
                      <span className="badge bg-info">
                        {displayedActions[item.action] || item.action}
                      </span>
                    </td>
                    <td>{item.description}</td>
                    <td>{new Date(item.timestamp).toLocaleString('id-ID')}</td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <Pagination className="justify-content-center mt-3">
              <Pagination.Prev
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page === 1}
              />
              {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                const pageNum = Math.max(1, pagination.page - 2) + i;
                if (pageNum > pagination.totalPages) return null;
                return (
                  <Pagination.Item
                    key={pageNum}
                    active={pageNum === pagination.page}
                    onClick={() => handlePageChange(pageNum)}
                  >
                    {pageNum}
                  </Pagination.Item>
                );
              })}
              <Pagination.Next
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page === pagination.totalPages}
              />
            </Pagination>
          )}
        </Card.Body>
      </Card>
    </Container>
  );
};

export default AdminHistory;