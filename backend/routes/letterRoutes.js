// routes/letterRoutes.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const Letter = require('../models/Letter');
const User = require('../models/User'); // ← tambahkan jika belum ada
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const archiver = require('archiver');
const fs = require('fs');

const router = express.Router();

// Setup multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }
});

// 🔑 1. Route ADMIN: lihat semua surat
router.get('/all', auth, admin, async (req, res) => {
  try {
    const letters = await Letter.find()
      .populate('pengirimId', 'email')
      .populate('penerimaId', 'email');
    res.json(letters);
  } catch (err) {
    console.error('Error di /letters/all:', err);
    res.status(500).json({ message: 'Gagal mengambil data surat.' });
  }
});

// 📤 2. Kirim surat (CREATE)
router.post('/', auth, upload.single('arsipDigital'), async (req, res) => {
  try {
    const { createLetter } = require('../controllers/letterController');
    return createLetter(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengirim surat.' });
  }
});

// 📥 3. Surat MASUK (untuk penerima)
router.get('/masuk', auth, async (req, res) => {
  try {
    const { getIncomingLetters } = require('../controllers/letterController');
    return getIncomingLetters(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil surat masuk.' });
  }
});

// 📤 4. Surat KELUAR (untuk pengirim)
router.get('/keluar', auth, async (req, res) => {
  try {
    const { getOutgoingLetters } = require('../controllers/letterController');
    return getOutgoingLetters(req, res);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil surat keluar.' });
  }
});

// 📥 5. Surat KELUAR (untuk pengirim) - PENCARIAN
router.get('/keluar/search', auth, async (req, res) => {
  try {
    const { q, startDate, endDate, classificationId } = req.query;
    let filter = { pengirimId: req.user.id };

    if (q) {
      filter.$or = [
        { noSurat: { $regex: q, $options: 'i' } },
        { perihal: { $regex: q, $options: 'i' } },
        { asalSurat: { $regex: q, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.tanggalTerima = {};
      if (startDate) filter.tanggalTerima.$gte = new Date(startDate);
      if (endDate) filter.tanggalTerima.$lte = new Date(endDate);
    }

    if (classificationId) {
      filter.klasifikasiId = classificationId;
    }

    const letters = await Letter.find(filter)
      .populate('penerimaId', 'email')
      .populate('klasifikasiId', 'nama warna')
      .sort({ createdAt: -1 });

    res.json(letters);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencari surat keluar.' });
  }
});

// 📥 6. Surat MASUK (untuk penerima) - PENCARIAN
router.get('/masuk/search', auth, async (req, res) => {
  try {
    const { q, startDate, endDate, classificationId } = req.query;
    let filter = { penerimaId: req.user.id };

    if (q) {
      filter.$or = [
        { noSurat: { $regex: q, $options: 'i' } },
        { perihal: { $regex: q, $options: 'i' } },
        { asalSurat: { $regex: q, $options: 'i' } }
      ];
    }

    if (startDate || endDate) {
      filter.tanggalTerima = {};
      if (startDate) filter.tanggalTerima.$gte = new Date(startDate);
      if (endDate) filter.tanggalTerima.$lte = new Date(endDate);
    }

    if (classificationId) {
      filter.klasifikasiId = classificationId;
    }

    const letters = await Letter.find(filter)
      .populate('pengirimId', 'email')
      .populate('klasifikasiId', 'nama warna')
      .sort({ createdAt: -1 });

    res.json(letters);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mencari surat masuk.' });
  }
});

// 🔍 7. Detail surat (bisa diakses oleh pengirim atau penerima)
router.get('/:id', auth, async (req, res) => {
  try {
    // Admin bisa lihat semua
    if (req.user.role === 'admin') {
      const letter = await Letter.findById(req.params.id)
        .populate('pengirimId', 'email')
        .populate('penerimaId', 'email')
        .populate('klasifikasiId', 'nama warna'); // ✅ TAMBAHKAN INI
      if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan.' });
      return res.json(letter);
    }

    // User biasa: hanya boleh lihat jika dia pengirim/penerima
    const letter = await Letter.findOne({
      _id: req.params.id,
      $or: [
        { pengirimId: req.user.id },
        { penerimaId: req.user.id }
      ]
    })
      .populate('pengirimId', 'email')
      .populate('penerimaId', 'email')
      .populate('klasifikasiId', 'nama warna'); // ✅ TAMBAHKAN INI

    if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan.' });
    res.json(letter);
  } catch (err) {
    console.error('Error di /letters/:id:', err);
    res.status(500).json({ message: 'Gagal mengambil detail surat.' });
  }
});

// ✏️ 8. Edit surat (hanya pengirim atau admin)
router.put('/:id', auth, upload.single('arsipDigital'), async (req, res) => {
  try {
    const { updateLetter } = require('../controllers/letterController');
    return updateLetter(req, res);
  } catch (err) {
    console.error('Error update surat via route:', err);
    res.status(500).json({ message: 'Gagal memperbarui surat.' });
  }
});

// 🗑️ 9. Hapus surat (hanya pengirim atau admin)
router.delete('/:id', auth, async (req, res) => {
  try {
    const { deleteLetter } = require('../controllers/letterController');
    return deleteLetter(req, res);
  } catch (err) {
    console.error('Error hapus surat via route:', err);
    res.status(500).json({ message: 'Gagal menghapus surat.' });
  }
});

// ⬇️ 10. Unduh surat + metadata (ZIP) - FIX KLASIFIKASI DI DOWNLOAD
router.get('/:id/download', auth, async (req, res) => {
  try {
    let letter;

    // Cek akses
    if (req.user.role === 'admin') {
      letter = await Letter.findById(req.params.id)
        .populate('pengirimId', 'email')
        .populate('penerimaId', 'email')
        .populate('klasifikasiId', 'nama warna'); // ✅ FIX: Tambahkan populate
    } else {
      letter = await Letter.findOne({
        _id: req.params.id,
        $or: [
          { pengirimId: req.user.id },
          { penerimaId: req.user.id }
        ]
      })
        .populate('pengirimId', 'email')
        .populate('penerimaId', 'email')
        .populate('klasifikasiId', 'nama warna'); // ✅ FIX: Tambahkan populate
    }

    if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan.' });

    const filePath = path.join(__dirname, '..', letter.arsipDigital);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File arsip tidak ditemukan.' });
    }

    const originalFileName = path.basename(letter.arsipDigital);
    const zipName = `surat_${letter.noSurat.replace(/\//g, '_')}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${zipName}"`);

    const archive = archiver('zip', { zlib: { level: 9 } });
    archive.pipe(res);

    // Tambahkan file asli
    archive.file(filePath, { name: originalFileName });

    // Tambahkan data surat - FIX KLASIFIKASI DI SINI
    const dataText = `
DATA SURAT
==========
No Urut            : ${letter.noUrut}
No Surat           : ${letter.noSurat}
Tanggal Terima     : ${new Date(letter.tanggalTerima).toLocaleDateString('id-ID')}
Tanggal Disposisi  : ${letter.tanggalDisposisi ? new Date(letter.tanggalDisposisi).toLocaleDateString('id-ID') : '-'}
Asal Surat         : ${letter.asalSurat}
Perihal            : ${letter.perihal}
Keterangan         : ${letter.keterangan}
Tgl Disposisi Bidang: ${letter.tanggalDisposisiBidang ? new Date(letter.tanggalDisposisiBidang).toLocaleDateString('id-ID') : '-'}
Jabatan            : ${letter.jabatan}
Nama               : ${letter.nama}
NIP                : ${letter.nip}
Pengirim           : ${letter.pengirimId?.email || '–'}
Penerima           : ${letter.penerimaId?.email || '–'}
Klasifikasi        : ${letter.klasifikasiId?.nama || '–'}  
`;
    archive.append(dataText, { name: 'data_surat.txt' });

    await archive.finalize();
  } catch (err) {
    console.error('Error download:', err);
    res.status(500).json({ message: 'Gagal mengunduh surat.' });
  }
});

module.exports = router;