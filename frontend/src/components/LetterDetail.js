// src/components/LetterDetail.js
import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../services/api';

const LetterDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [letter, setLetter] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLetter = async () => {
      try {
        const res = await api.get(`/letters/${id}`);
        setLetter(res.data);
      } catch (err) {
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
        } else {
          alert('Gagal memuat detail surat');
          navigate('/dashboard');
        }
      } finally {
        setLoading(false);
      }
    };
    fetchLetter();
  }, [id, navigate]);

  const handleDelete = async () => {
    const confirmed = window.confirm('Yakin ingin menghapus surat ini? Tindakan ini tidak bisa dikembalikan.');
    if (!confirmed) return;

    try {
      await api.delete(`/letters/${id}`);
      alert('Surat berhasil dihapus.');
      navigate('/dashboard'); // kembali ke daftar surat
    } catch (err) {
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        navigate('/login');
      } else {
        alert(err.response?.data?.message || 'Gagal menghapus surat. Coba lagi.');
      }
    }
  };

  if (loading) return <div className="text-center mt-5">Loading...</div>;
  if (!letter) return <div className="text-center mt-5">Surat tidak ditemukan.</div>;

  // Fungsi untuk menentukan tipe file
  const getFileType = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['docx', 'doc'].includes(ext)) return 'word';
    if (['xlsx', 'xls'].includes(ext)) return 'excel';
    return 'unknown';
  };

  // Ambil nama file dari path
  const fileName = letter.arsipDigital ? letter.arsipDigital.split('/').pop() : '';

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: 'auto' }}>
      <h2>Detail Surat</h2>
      <button
        onClick={() => navigate('/dashboard')}
        style={{ marginBottom: '20px', marginRight: '10px' }}
        className="btn btn-secondary"
      >
        Kembali ke Dashboard
      </button>

      {/* Preview File */}
      <div style={{ marginBottom: '30px', border: '1px solid #ccc', padding: '15px' }}>
        <h3>Preview Arsip Digital</h3>
        {letter.arsipDigital ? (
          <>
            <p><strong>Nama File:</strong> {fileName}</p>
            {getFileType(fileName) === 'pdf' && (
              <iframe
                src={`http://localhost:5000${letter.arsipDigital}`}
                width="100%"
                height="600px"
                title="PDF Preview"
                style={{ border: 'none' }}
              />
            )}
            {getFileType(fileName) === 'word' && (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                <p>📁 File Word (.docx) tidak bisa dipreview langsung di browser.</p>
                <a href={`http://localhost:5000${letter.arsipDigital}`} download className="btn btn-outline-primary">
                  ⬇️ Unduh File Word
                </a>
              </div>
            )}
            {getFileType(fileName) === 'excel' && (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                <p>📊 File Excel (.xlsx) tidak bisa dipreview langsung di browser.</p>
                <a href={`http://localhost:5000${letter.arsipDigital}`} download className="btn btn-outline-primary">
                  ⬇️ Unduh File Excel
                </a>
              </div>
            )}
            {getFileType(fileName) === 'unknown' && (
              <div style={{ padding: '20px', textAlign: 'center', backgroundColor: '#f9f9f9' }}>
                <p>⚠️ Tipe file tidak didukung untuk preview.</p>
                <a href={`http://localhost:5000${letter.arsipDigital}`} download className="btn btn-outline-secondary">
                  ⬇️ Unduh File
                </a>
              </div>
            )}
          </>
        ) : (
          <p>Tidak ada file arsip digital.</p>
        )}
      </div>

      {/* Informasi Kategori */}
      <div style={{ border: '1px solid #ccc', padding: '15px' }}>
        <h3>Informasi Surat</h3>
        <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <tbody>
            <tr><td><strong>No Urut</strong></td><td>{letter.noUrut}</td></tr>
            <tr><td><strong>No Surat</strong></td><td>{letter.noSurat}</td></tr>
            <tr><td><strong>Tanggal Terima</strong></td><td>{new Date(letter.tanggalTerima).toLocaleDateString()}</td></tr>
            <tr><td><strong>Tanggal Disposisi</strong></td><td>{new Date(letter.tanggalDisposisi).toLocaleDateString()}</td></tr>
            <tr><td><strong>Asal Surat</strong></td><td>{letter.asalSurat}</td></tr>
            <tr><td><strong>Perihal</strong></td><td>{letter.perihal}</td></tr>
            <tr><td><strong>Keterangan</strong></td><td>{letter.keterangan}</td></tr>
            <tr><td><strong>Tanggal Disposisi Bidang</strong></td><td>{new Date(letter.tanggalDisposisiBidang).toLocaleDateString()}</td></tr>
            <tr><td><strong>Jabatan</strong></td><td>{letter.jabatan}</td></tr>
            <tr><td><strong>Nama</strong></td><td>{letter.nama}</td></tr>
            <tr><td><strong>NIP</strong></td><td>{letter.nip}</td></tr>
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: '20px' }}>
        <button
          onClick={() => navigate(`/surat/edit/${id}`)}
          className="btn btn-warning"
        >
          Edit Surat
        </button>
        <button
          onClick={handleDelete}
          style={{ marginLeft: '10px' }}
          className="btn btn-danger"
        >
          Hapus
        </button>
      </div>
    </div>
  );
};

export default LetterDetail;