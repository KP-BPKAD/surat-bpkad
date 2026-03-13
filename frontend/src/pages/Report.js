// src/pages/Report.js
import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import '../App.css';
import {
  Container,
  Card,
  Table,
  Button,
  Form,
  Alert,
  Spinner
} from 'react-bootstrap';

const Report = () => {
  const [reportData, setReportData] = useState([]);
  const [summary, setSummary] = useState({}); // default: objek kosong
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [userRole, setUserRole] = useState(''); // tambahkan state role
  const navigate = useNavigate();
  const printRef = useRef();

  useEffect(() => {
    fetchReport(selectedYear);
    
    // Ambil role dari localStorage
    const storedProfile = localStorage.getItem('userProfile');
    if (storedProfile) {
      const profile = JSON.parse(storedProfile);
      setUserRole(profile.role);
    }
  }, [selectedYear]);

  const fetchReport = async (year) => {
    try {
      const res = await api.get(`/reports/monthly?year=${year}`);

      // Ambil data dari response
      const { data = [], summary: fetchedSummary = {} } = res.data;

      // Pastikan data adalah array
      setReportData(Array.isArray(data) ? data : []);

      // Pastikan summary adalah objek
      setSummary(typeof fetchedSummary === 'object' ? fetchedSummary : {});

    } catch (err) {
      if (err.response?.status === 403) {
        alert('Akses ditolak. Hanya pimpinan/admin yang bisa mengakses laporan.');
        navigate('/dashboard');
      } else {
        setError('Gagal memuat laporan.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleYearChange = (e) => {
    setSelectedYear(parseInt(e.target.value));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;

    // Buat HTML khusus cetak — hanya isi yang diperlukan
    const printContent = `
      <style>
        @page {
          size: A4;
          margin: 0.5cm;
        }
        body {
          font-family: 'Segoe UI', sans-serif;
          padding: 0;
          margin: 0;
          color: #333;
        }
        h1 {
          text-align: center;
          margin: 10px 0;
          font-size: 24px;
          font-weight: 600;
        }
        .print-date {
          text-align: center;
          margin-bottom: 15px;
          font-style: italic;
          font-size: 13px;
          color: #666;
        }
        hr {
          border: none;
          border-top: 2px solid #007bff;
          margin: 15px 0;
        }
        .summary-container {
          display: flex;
          justify-content: space-around;
          gap: 20px;
          margin: 20px 0;
        }
        .summary-item {
          text-align: center;
          flex: 1;
          padding: 15px;
          background-color: #f8f9fa;
          border-radius: 8px;
          border: 1px solid #dee2e6;
        }
        .summary-value {
          font-size: 2.2rem;
          font-weight: 700;
          color: #007bff;
          margin-bottom: 5px;
        }
        .summary-label {
          font-size: 13px;
          color: #555;
          font-weight: 500;
        }
        .classification-summary {
          margin: 20px 0;
          padding: 12px;
          background-color: #f8f9fa;
          border-left: 4px solid #007bff;
          border-radius: 0 4px 4px 0;
        }
        .classification-badge {
          display: inline-block;
          padding: 5px 10px;
          margin: 2px;
          border-radius: 10px;
          color: white;
          font-size: 12px;
          font-weight: 500;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
          font-size: 12px;
        }
        th {
          background-color: #007bff;
          color: white;
          padding: 10px;
          text-align: center;
          font-weight: 600;
        }
        td {
          border: 1px solid #dee2e6;
          padding: 8px;
          text-align: center;
        }
        tbody tr:nth-child(even) {
          background-color: #f8f9fa;
        }
        /* Pastikan cetak background warna */
        @media print {
          * {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            -webkit-print-color-adjust: exact;
          }
        }
      </style>
      <h1>LAPORAN SURAT TAHUN ${selectedYear}</h1>
      <div class="print-date">Dicetak pada: ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
      <hr />
      ${content.innerHTML}
    `;

    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Laporan Surat</title>
        <style>
          @page { size: A4; margin: 0.5cm; }
          body { margin: 0; padding: 0; }
        </style>
      </head>
      <body>${printContent}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    // Tunggu render selesai, lalu cetak
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 300);
  };

  if (loading) {
    return (
      <Container className="mt-5 text-center">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
        <p className="mt-3">Memuat laporan...</p>
      </Container>
    );
  }

  // Hitung total dari reportData
  const totalSurat = reportData.reduce((sum, item) => sum + item.totalSurat, 0);
  const totalMasuk = reportData.reduce((sum, item) => sum + item.suratMasuk, 0);
  const totalKeluar = reportData.reduce((sum, item) => sum + item.suratKeluar, 0);

  return (
    <Container className="mt-4 mb-5">
      <Card className="shadow-sm">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <Card.Title className="mb-0" style={{ fontSize: '24px', fontWeight: '600' }}>
                Laporan Surat Tahun {selectedYear}
              </Card.Title>
            </div>
            {/*  Hanya admin yang bisa cetak */}
            {userRole === 'admin' && (
              <Button variant="success" onClick={handlePrint} size="lg">
                Cetak Laporan
              </Button>
            )}
          </div>

          {error && <Alert variant="danger" className="mb-4">{error}</Alert>}

          <Form.Group className="mb-5">
            <Form.Label className="fw-500">Pilih Tahun</Form.Label>
            <Form.Select value={selectedYear} onChange={handleYearChange} style={{ maxWidth: '200px' }}>
              {[2026, 2027, 2028, 2029, 2030].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </Form.Select>
          </Form.Group>

          <div ref={printRef}>
            {/* Summary Section */}
            <div className="summary-container">
              <div className="summary-item">
                <div className="summary-value">{totalSurat}</div>
                <div className="summary-label">Total Surat</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{totalMasuk}</div>
                <div className="summary-label">Surat yang Diterima</div>
              </div>
              <div className="summary-item">
                <div className="summary-value">{totalKeluar}</div>
                <div className="summary-label">Surat yang Dikirim</div>
              </div>
            </div>

            {/* Classification Summary */}
            <div className="classification-summary">
              <h5 className="mb-3">Ringkasan Per Klasifikasi:</h5>
              <div>
                {Object.entries(summary).map(([id, cls]) => (
                  <span
                    key={id}
                    className="classification-badge"
                    style={{ backgroundColor: cls.warna }}
                  >
                    {cls.nama}: {cls.jumlah}
                  </span>
                ))}
              </div>
            </div>

            {/* Report Table */}
            <Table striped bordered hover responsive className="mt-4">
              <thead className="table-light">
                <tr>
                  <th>Bulan</th>
                  <th>Total Surat</th>
                  <th>Klasifikasi</th>
                  <th>Surat yang Diterima</th>
                  <th>Surat yang Dikirim</th>
                </tr>
              </thead>
              <tbody>
                {reportData && reportData.length > 0 ? (
                  reportData.map((item, index) => (
                    <tr key={index}>
                      <td className="fw-500">{item.namaBulan}</td>
                      <td>{item.totalSurat || 0}</td>
                      <td>
                        {item.klasifikasi && typeof item.klasifikasi === 'object' ? (
                          Object.entries(item.klasifikasi).length > 0 ? (
                            Object.entries(item.klasifikasi).map(([id, cls]) => (
                              <span
                                key={id}
                                className="classification-badge"
                                style={{ backgroundColor: cls.warna || '#000000' }}
                              >
                                {cls.nama || 'Tanpa Nama'}: {cls.jumlah || 0}
                              </span>
                            ))
                          ) : (
                            <span className="text-muted">-</span>
                          )
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>{item.suratMasuk || 0}</td>
                      <td>{item.suratKeluar || 0}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="text-center text-muted py-4">
                      Tidak ada data laporan untuk tahun ini
                    </td>
                  </tr>
                )}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </Container>
  );
};

export default Report;