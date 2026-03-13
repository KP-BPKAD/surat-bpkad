// src/pages/Dashboard.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import {
  Container,
  Table,
  Button,
  Navbar,
  Nav,
  Modal,
  Alert,
  Spinner,
  Tabs,
  Tab,
  Form,
  Card,
  Row,
  Col
} from 'react-bootstrap';

const Dashboard = () => {
  const [incomingLetters, setIncomingLetters] = useState([]);
  const [outgoingLetters, setOutgoingLetters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState('petugas');
  const [error, setError] = useState('');
  const [showDeleteModal, setShowModal] = useState(false);
  const [letterToDelete, setLetterToDelete] = useState(null);
  const [letterToDeleteAsAdmin, setLetterToDeleteAsAdmin] = useState(null);
  const [letterToDeletePermanent, setLetterToDeletePermanent] = useState(null);
  const [activeTab, setActiveTab] = useState('keluar');

  // 🔍 State untuk pencarian
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedClassification, setSelectedClassification] = useState('');
  const [classifications, setClassifications] = useState([]);

  const navigate = useNavigate();

  useEffect(() => {
    const loadData = async () => {
      try {
        // Ambil profil untuk dapatkan role lengkap
        const profileRes = await api.get('/auth/profile');
        setUserRole(profileRes.data.role);

        // Muat klasifikasi
        const classRes = await api.get('/classifications');
        setClassifications(classRes.data);

        // Muat surat
        const [incomingRes, outgoingRes] = await Promise.all([
          api.get('/letters/masuk'),
          api.get('/letters/keluar')
        ]);

        setIncomingLetters(incomingRes.data);
        setOutgoingLetters(outgoingRes.data);
      } catch (err) {
        console.error('Error di Dashboard:', err);
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.removeItem('token');
          localStorage.removeItem('userEmail');
          navigate('/login', { replace: true });
          return;
        }
        setError(err.response?.data?.message || 'Gagal memuat data. Coba lagi nanti.');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

  // 🔍 Fungsi pencarian
  const performSearch = async (type) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.append('q', searchQuery);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (selectedClassification) params.append('classificationId', selectedClassification);

      const res = await api.get(`/letters/${type}/search?${params.toString()}`);
      if (type === 'masuk') {
        setIncomingLetters(res.data);
      } else {
        setOutgoingLetters(res.data);
      }
    } catch (err) {
      setError('Gagal mencari surat.');
    } finally {
      setLoading(false);
    }
  };

  // 🔁 Reset pencarian
  const resetSearch = async () => {
    setSearchQuery('');
    setStartDate('');
    setEndDate('');
    setSelectedClassification('');

    // Muat ulang semua surat
    setLoading(true);
    try {
      const [incomingRes, outgoingRes] = await Promise.all([
        api.get('/letters/masuk'),
        api.get('/letters/keluar')
      ]);
      setIncomingLetters(incomingRes.data);
      setOutgoingLetters(outgoingRes.data);
    } catch (err) {
      setError('Gagal memuat ulang data.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      // Kirim request ke backend untuk log logout
      await api.post('/auth/logout');
    } catch (err) {
      console.warn('Logout API gagal, tetap logout...', err);
    } finally {
      localStorage.removeItem('token');
      localStorage.removeItem('userEmail');
      navigate('/login');
    }
  };

  const openDeleteModal = (letter) => {
    setLetterToDelete(letter);
    setLetterToDeleteAsAdmin(null);
    setLetterToDeletePermanent(null);
    setShowModal(true);
  };

  const openAdminDeleteModal = (letter) => {
    setLetterToDeleteAsAdmin(letter);
    setLetterToDelete(null);
    setLetterToDeletePermanent(null);
    setShowModal(true);
  };

  const openDeletePermanentModal = (letter) => {
    setLetterToDeletePermanent(letter);
    setLetterToDelete(null);
    setLetterToDeleteAsAdmin(null);
    setShowModal(true);
  };

  const confirmDelete = async () => {
    if (letterToDeletePermanent) {
      // Hapus permanen
      try {
        await api.delete(`/letters/permanent/${letterToDeletePermanent._id}`);
        
        // Refresh data
        const [incomingRes, outgoingRes] = await Promise.all([
          api.get('/letters/masuk'),
          api.get('/letters/keluar')
        ]);
        setIncomingLetters(incomingRes.data);
        setOutgoingLetters(outgoingRes.data);
        
        setShowModal(false);
        alert('Surat berhasil dihapus secara permanen!');
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus surat secara permanen.');
      }
    } else if (letterToDeleteAsAdmin) {
      // Hapus sebagai admin
      try {
        await api.delete(`/letters/admin/${letterToDeleteAsAdmin._id}`);
        
        // Refresh data
        const [incomingRes, outgoingRes] = await Promise.all([
          api.get('/letters/masuk'),
          api.get('/letters/keluar')
        ]);
        setIncomingLetters(incomingRes.data);
        setOutgoingLetters(outgoingRes.data);
        
        setShowModal(false);
        alert('Surat berhasil dihapus oleh admin!');
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus surat.');
      }
    } else {
      // Hapus sebagai user
      if (!letterToDelete) return;
      try {
        await api.delete(`/letters/${letterToDelete._id}`);
        
        if (activeTab === 'keluar') {
          setOutgoingLetters(outgoingLetters.filter(l => l._id !== letterToDelete._id));
        } else {
          setIncomingLetters(incomingLetters.filter(l => l._id !== letterToDelete._id));
        }
        
        setShowModal(false);
        alert('Surat berhasil dihapus!');
      } catch (err) {
        alert(err.response?.data?.message || 'Gagal menghapus surat.');
      }
    }
  };

  const renderLetterRow = (letter, index, type) => (
    <tr key={letter._id}>
      <td>{index + 1}</td>
      <td>{letter.noSurat}</td>
      <td>{letter.perihal}</td>
      <td>
        {type === 'masuk' 
          ? letter.pengirimId?.email || '–' 
          : letter.penerimaId?.email || '–'}
      </td>
      <td>{new Date(letter.tanggalTerima).toLocaleDateString()}</td>
      {/* Kolom Klasifikasi */}
      <td>
        {letter.klasifikasiId ? (
          <span
            className="badge"
            style={{ backgroundColor: letter.klasifikasiId.warna || '#007bff' }}
          >
            {letter.klasifikasiId.nama || '-'}
          </span>
        ) : (
          <span className="text-muted">-</span>
        )}
      </td>
      <td>
        <Link to={`/surat/${letter._id}`} className="btn btn-sm btn-outline-primary me-1">
          Lihat
        </Link>

        {/* 🟢 ADMIN: Edit & Hapus & Hapus Permanen untuk semua surat */}
        {userRole === 'admin' && (
          <>
            <Link to={`/surat/edit/${letter._id}`} className="btn btn-sm btn-outline-warning me-1">
              Edit
            </Link>
            <Button
              variant="outline-danger"
              size="sm"
              onClick={() => openDeleteModal(letter)}
              className="me-1"
            >
              Hapus
            </Button>
            {/* 🔥 HAPUS PERMANEN hanya untuk surat yang dikirim (keluar) */}
            {type === 'keluar' && (
              <Button
                variant="outline-dark"
                size="sm"
                onClick={() => openDeletePermanentModal(letter)}
                className="ms-1"
              >
                Hapus Permanen
              </Button>
            )}
          </>
        )}

        {/* 🟡 PETUGAS / PIMPINAN: hanya bisa edit/hapus surat yang dikirim (keluar), dan Hapus Permanen hanya untuk surat keluar */}
        {(userRole === 'user' || userRole === 'pimpinan') && (
          <>
            {/* Edit & Hapus hanya untuk surat yang dikirim (keluar) */}
            {type === 'keluar' && (
              <>
                <Link to={`/surat/edit/${letter._id}`} className="btn btn-sm btn-outline-warning me-1">
                  Edit
                </Link>
                <Button
                  variant="outline-danger"
                  size="sm"
                  onClick={() => openDeleteModal(letter)}
                  className="me-1"
                >
                  Hapus
                </Button>
                {/* Hapus Permanen hanya untuk surat yang dikirim */}
                <Button
                  variant="outline-dark"
                  size="sm"
                  onClick={() => openDeletePermanentModal(letter)}
                  className="ms-1"
                >
                  Hapus Permanen
                </Button>
              </>
            )}

            {/* Untuk surat yang diterima (masuk): hanya tombol Hapus (tidak ada Edit & Hapus Permanen) */}
            {type === 'masuk' && (
              <Button
                variant="outline-danger"
                size="sm"
                onClick={() => openDeleteModal(letter)}
              >
                Hapus
              </Button>
            )}
          </>
        )}

        {/* 🔴 PENERIMA (bukan admin/petugas/pimpinan) — hanya bisa hapus surat masuk */}
        {userRole !== 'admin' && userRole !== 'user' && userRole !== 'pimpinan' && type === 'masuk' && (
          <Button
            variant="outline-danger"
            size="sm"
            onClick={() => openDeleteModal(letter)}
          >
            Hapus
          </Button>
        )}
      </td>
    </tr>
  );

  const renderTable = (letters, type) => (
    <Table striped bordered hover responsive>
      <thead>
        <tr>
          <th>No</th>
          <th>No Surat</th>
          <th>Perihal</th>
          <th>{type === 'masuk' ? 'Dari' : 'Kepada'}</th>
          <th>Tanggal Terima</th>
          {/* Header Kolom Klasifikasi */}
          <th>Klasifikasi</th>
          <th>Aksi</th>
        </tr>
      </thead>
      <tbody>
        {letters.length > 0 ? (
          letters.map((letter, i) => renderLetterRow(letter, i, type))
        ) : (
          <tr>
            <td colSpan="7" className="text-center">
              Tidak ada surat {type === 'masuk' ? 'masuk' : 'keluar'}.
            </td>
          </tr>
        )}
      </tbody>
    </Table>
  );

  // 🔍 Form pencarian
  const renderSearchForm = () => (
    <Card className="mb-4">
      <Card.Body>
        <h5>Cari Arsip Surat</h5>
        <Form>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Kata Kunci</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Cari nomor surat, perihal, asal surat..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Klasifikasi</Form.Label>
                <Form.Select
                  value={selectedClassification}
                  onChange={(e) => setSelectedClassification(e.target.value)}
                >
                  <option value="">Semua Klasifikasi</option>
                  {classifications.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.nama}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Awal</Form.Label>
                <Form.Control
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tanggal Akhir</Form.Label>
                <Form.Control
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-flex gap-2">
            <Button
              variant="primary"
              onClick={() => performSearch(activeTab)}
            >
              Cari
            </Button>
            <Button
              variant="secondary"
              onClick={resetSearch}
            >
              Reset
            </Button>
          </div>
        </Form>
      </Card.Body>
    </Card>
  );

  if (loading) {
    return (
      <div className="text-center mt-5">
        <Spinner animation="border" variant="primary" />
        <p className="mt-3">Loading data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Container className="mt-5">
        <Alert variant="danger">{error}</Alert>
        <Button onClick={() => window.location.reload()}>Coba Lagi</Button>
      </Container>
    );
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Dashboard Surat</Navbar.Brand>
          
          <Nav className="ms-auto">
            {/* NAVBAR ADMIN */}
            {userRole === 'admin' && (
              <>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate('/admin/surat')}
                  className="me-2"
                >
                  Dashboard Admin
                </Button>
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate('/admin/users')}
                  className="me-2"
                >
                  Kelola User
                </Button>
                {/* Tombol Klasifikasi Arsip */}
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate('/admin/classifications')}
                  className="me-2"
                >
                  Klasifikasi
                </Button>
                {/* Tombol Riwayat Aktivitas */}
                <Button
                  variant="outline-info"
                  size="sm"
                  onClick={() => navigate('/admin/history')}
                  className="me-2"
                >
                  Riwayat
                </Button>
                {/* Tombol Laporan (Admin: bisa cetak) */}
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => navigate('/laporan')}
                  className="me-2"
                >
                  Laporan 
                </Button>
              </>
            )}

            {/* NAVBAR PEMIMPIN */}
            {userRole === 'pimpinan' && (
              <>
                {/* Hanya lihat laporan, tidak bisa cetak */}
                <Button
                  variant="outline-success"
                  size="sm"
                  onClick={() => navigate('/laporan')}
                  className="me-2"
                >
                  Laporan
                </Button>
                
                {/* Riwayat Saya */}
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="me-2"
                >
                  Riwayat Saya
                </Button>
              </>
            )}

            {/* NAVBAR PETUGAS */}
            {userRole === 'user' && (
              <>
                {/* Riwayat Saya */}
                <Button
                  variant="outline-light"
                  size="sm"
                  onClick={() => navigate('/history')}
                  className="me-2"
                >
                  Riwayat Saya
                </Button>
              </>
            )}

            {/* Tombol Kirim Surat (untuk semua role) */}
            {(userRole === 'user' || userRole === 'pimpinan' || userRole === 'admin') && (
              <Button 
                variant="outline-light" 
                size="sm" 
                onClick={() => navigate('/surat/baru')}
                className="me-2"
              >
                Kirim Surat Baru
              </Button>
            )}

            {/* LOGOUT (SEMUA ROLE) */}
            <Button 
              variant="outline-light" 
              size="sm" 
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Nav>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {renderSearchForm()} {/* Tambahkan form pencarian */}
        
        <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k)}>
          <Tab eventKey="keluar" title="Surat yang Dikirim">
            {renderTable(outgoingLetters, 'keluar')}
          </Tab>
          <Tab eventKey="masuk" title="Surat yang Diterima">
            {renderTable(incomingLetters, 'masuk')}
          </Tab>
        </Tabs>
      </Container>

      {/* Modal Hapus */}
      <Modal show={showDeleteModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Hapus Surat</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {letterToDeletePermanent ? (
            <>
              Yakin hapus surat: <strong>{letterToDeletePermanent.noSurat}</strong>?<br />
              <small className="text-danger">(Operasi ini akan menghapus semua salinan surat dari sistem secara permanen)</small>
            </>
          ) : letterToDeleteAsAdmin ? (
            <>
              Yakin hapus surat: <strong>{letterToDeleteAsAdmin.noSurat}</strong>?<br />
              <small className="text-warning">(Operasi ini akan menghapus semua salinan surat dari sistem)</small>
            </>
          ) : (
            <>
              Yakin hapus surat: <strong>{letterToDelete?.noSurat}</strong>?
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>Batal</Button>
          <Button variant="danger" onClick={confirmDelete}>Hapus</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default Dashboard;