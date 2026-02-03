// controllers/letterController.js
const Letter = require('../models/Letter');
const User = require('../models/User');
const History = require('../models/History');
const mongoose = require('mongoose');
const path = require('path');
const fs = require('fs').promises;
const { logActivity } = require('../utils/logActivity');

const isValidFileType = (fileName) => {
  const ext = path.extname(fileName).toLowerCase();
  return /\.(pdf|docx|xlsx|jpg|jpeg|png|txt)$/i.test(ext);
};

// Helper: validasi tanggal sederhana (YYYY-MM-DD)
const isValidDate = (dateString) => {
  if (!dateString) return false;
  const date = new Date(dateString); 
  return date.toString() !== 'Invalid Date' && dateString.match(/^\d{4}-\d{2}-\d{2}$/);
};

// CREATE — DIPERBARUI UNTUK MENDUKUNG PENERIMA (buat 2 dokumen)
const createLetter = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'File arsip digital wajib diunggah.' });
    if (!isValidFileType(req.file.originalname)) {
      return res.status(400).json({ message: 'Hanya file .pdf, .docx, atau .xlsx yang diperbolehkan.' });
    }

    const {
      noUrut, noSurat, tanggalTerima, tanggalDisposisi, asalSurat,
      perihal, keterangan, tanggalDisposisiBidang, jabatan, nama, nip,
      penerimaEmail, klasifikasiId
    } = req.body;

    // VALIDASI INPUT
    if (!noUrut || !noSurat || !tanggalTerima || !asalSurat || !perihal || !nama || !nip || !penerimaEmail) {
      return res.status(400).json({ message: 'Semua field wajib diisi, termasuk penerima email.' });
    }

    // Validasi noUrut
    const parsedNoUrut = parseInt(noUrut);
    if (isNaN(parsedNoUrut) || parsedNoUrut <= 0) {
      return res.status(400).json({ message: 'Nomor urut harus berupa angka positif.' });
    }

    // Validasi tanggal
    if (!isValidDate(tanggalTerima)) {
      return res.status(400).json({ message: 'Format tanggal terima tidak valid. Gunakan YYYY-MM-DD.' });
    }
    if (tanggalDisposisi && !isValidDate(tanggalDisposisi)) {
      return res.status(400).json({ message: 'Format tanggal disposisi tidak valid. Gunakan YYYY-MM-DD.' });
    }
    if (tanggalDisposisiBidang && !isValidDate(tanggalDisposisiBidang)) {
      return res.status(400).json({ message: 'Format tanggal disposisi bidang tidak valid. Gunakan YYYY-MM-DD.' });
    }

    // Validasi NIP
    if (!/^\d+$/.test(nip) || nip.length > 20 || nip.length < 9) {
      return res.status(400).json({ message: 'NIP hanya boleh berisi angka (9–20 digit).' });
    }

    if (nama.length > 100) {
      return res.status(400).json({ message: 'Nama terlalu panjang (maks 100 karakter).' });
    }

    // 🔑 VALIDASI & CARI PENERIMA
    const penerima = await User.findOne({ email: penerimaEmail });
    if (!penerima) {
      return res.status(400).json({ message: 'Penerima tidak terdaftar dalam sistem.' });
    }

    // 🔑 KONVERSI klasifikasiId KE ObjectId
    let klasifikasiIdObj = null;
    if (klasifikasiId && mongoose.Types.ObjectId.isValid(klasifikasiId)) {
      klasifikasiIdObj = new mongoose.Types.ObjectId(klasifikasiId);
    }

    // 🔑 GENERATE ID UNIK UNTUK PASANGAN SURAT
    const suratId = `SURAT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // ✅ BUAT 2 DOKUMEN: SALINAN PENGIRIM (outgoing) & PENERIMA (incoming)
    const outgoingLetter = new Letter({
      suratId,
      ownerId: req.user.id,
      type: 'outgoing',
      noSurat,
      noUrut: parsedNoUrut,
      perihal,
      asalSurat,
      keterangan,
      tanggalTerima: new Date(tanggalTerima),
      tanggalDisposisi: tanggalDisposisi ? new Date(tanggalDisposisi) : undefined,
      tanggalDisposisiBidang: tanggalDisposisiBidang ? new Date(tanggalDisposisiBidang) : undefined,
      jabatan,
      nama,
      nip,
      arsipDigital: `/uploads/${req.file.filename}`,
      pengirimId: req.user.id,
      penerimaId: penerima._id,
      klasifikasiId: klasifikasiIdObj
    });

    const incomingLetter = new Letter({
      suratId,
      ownerId: penerima._id,
      type: 'incoming',
      noSurat,
      noUrut: parsedNoUrut,
      perihal,
      asalSurat,
      keterangan,
      tanggalTerima: new Date(tanggalTerima),
      tanggalDisposisi: undefined,
      tanggalDisposisiBidang: undefined,
      jabatan: '',
      nama: '',
      nip: '',
      arsipDigital: `/uploads/${req.file.filename}`,
      pengirimId: req.user.id,
      penerimaId: penerima._id,
      klasifikasiId: klasifikasiIdObj
    });

    // Simpan kedua surat
    await Promise.all([outgoingLetter.save(), incomingLetter.save()]);

    // ✅ LOG AKTIVITAS: Kirim Surat
    await logActivity(req.user.id, 'send_letter', `Surat "${noSurat}" dikirim ke ${penerima.email}`, req);

    res.status(201).json({ 
      message: 'Surat berhasil dikirim.', 
      letter: outgoingLetter // kirim salinan pengirim ke frontend
    });
  } catch (error) {
    console.error('Error createLetter:', error);
    res.status(500).json({ message: 'Gagal mengirim surat.' });
  }
};

// READ: Surat Masuk (baru) — hanya milik penerima
const getIncomingLetters = async (req, res) => {
  try {
    const letters = await Letter.find({
      ownerId: req.user.id,
      type: 'incoming'
    })
      .populate('pengirimId', 'email')
      .populate('klasifikasiId', 'nama warna')
      .sort({ createdAt: -1 });
    
    // Log akses surat masuk (opsional)
    await logActivity(req.user.id, 'view_incoming_letters', 'User mengakses surat masuk', req);
    
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil surat masuk.' });
  }
};

// READ: Surat Keluar (baru) — hanya milik pengirim
const getOutgoingLetters = async (req, res) => {
  try {
    const letters = await Letter.find({
      ownerId: req.user.id,
      type: 'outgoing'
    })
      .populate('penerimaId', 'email')
      .populate('klasifikasiId', 'nama warna')
      .sort({ createdAt: -1 });
    
    // Log akses surat keluar (opsional)
    await logActivity(req.user.id, 'view_outgoing_letters', 'User mengakses surat keluar', req);
    
    res.json(letters);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil surat keluar.' });
  }
};

// READ ONE — hanya milik user (bisa incoming/outgoing)
const getLetterById = async (req, res) => {
  try {
    const letter = await Letter.findOne({
      _id: req.params.id,
      ownerId: req.user.id // hanya milik user yang bisa akses
    })
      .populate('pengirimId penerimaId', 'email')
      .populate('klasifikasiId', 'nama warna');

    if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan.' });
    
    // Log akses detail surat (opsional)
    await logActivity(req.user.id, 'view_letter_detail', `User melihat detail surat "${letter.noSurat}"`, req);
    
    res.json(letter);
  } catch (error) {
    res.status(500).json({ message: 'Gagal mengambil detail surat.' });
  }
};

// UPDATE — hanya surat keluar milik pengirim yang bisa diedit
const updateLetter = async (req, res) => {
  try {
    const {
      noUrut, noSurat, tanggalTerima, tanggalDisposisi, asalSurat,
      perihal, keterangan, tanggalDisposisiBidang, jabatan, nama, nip, klasifikasiId
    } = req.body;

    const letter = await Letter.findOne({
      _id: req.params.id,
      ownerId: req.user.id,
      type: 'outgoing' // hanya surat keluar yang bisa diedit
    });
    if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan atau tidak memiliki izin edit.' });

    // Validasi input
    if (noUrut !== undefined) {
      const parsed = parseInt(noUrut);
      if (isNaN(parsed) || parsed <= 0) {
        return res.status(400).json({ message: 'Nomor urut harus berupa angka positif.' });
      }
    }
    if (tanggalTerima !== undefined && !isValidDate(tanggalTerima)) {
      return res.status(400).json({ message: 'Format tanggal terima tidak valid. Gunakan YYYY-MM-DD.' });
    }
    if (tanggalDisposisi !== undefined && !isValidDate(tanggalDisposisi)) {
      return res.status(400).json({ message: 'Format tanggal disposisi tidak valid. Gunakan YYYY-MM-DD.' });
    }
    if (tanggalDisposisiBidang !== undefined && !isValidDate(tanggalDisposisiBidang)) {
      return res.status(400).json({ message: 'Format tanggal disposisi bidang tidak valid. Gunakan YYYY-MM-DD.' });
    }
    if (nip !== undefined) {
      if (!/^\d+$/.test(nip) || nip.length > 20 || nip.length < 9) {
        return res.status(400).json({ message: 'NIP hanya boleh berisi angka (9–20 digit).' });
      }
    }
    if (nama !== undefined && nama.length > 100) {
      return res.status(400).json({ message: 'Nama terlalu panjang (maks 100 karakter).' });
    }

    // Handle upload file baru
    if (req.file) {
      if (!isValidFileType(req.file.originalname)) {
        return res.status(400).json({ message: 'Tipe file tidak diizinkan.' });
      }
      if (letter.arsipDigital) {
        const oldPath = path.join(__dirname, '..', letter.arsipDigital);
        await fs.unlink(oldPath).catch(() => {});
      }
      letter.arsipDigital = `/uploads/${req.file.filename}`;
    }

    // 🔑 KONVERSI klasifikasiId KE ObjectId
    if (klasifikasiId !== undefined) {
      if (klasifikasiId && mongoose.Types.ObjectId.isValid(klasifikasiId)) {
        letter.klasifikasiId = new mongoose.Types.ObjectId(klasifikasiId);
      } else if (klasifikasiId === '') {
        letter.klasifikasiId = null;
      }
    }

    // Update field
    Object.assign(letter, {
      noUrut: noUrut !== undefined ? parseInt(noUrut) : letter.noUrut,
      noSurat: noSurat || letter.noSurat,
      tanggalTerima: tanggalTerima ? new Date(tanggalTerima) : letter.tanggalTerima,
      tanggalDisposisi: tanggalDisposisi ? new Date(tanggalDisposisi) : letter.tanggalDisposisi,
      asalSurat: asalSurat || letter.asalSurat,
      perihal: perihal || letter.perihal,
      keterangan: keterangan || letter.keterangan,
      tanggalDisposisiBidang: tanggalDisposisiBidang ? new Date(tanggalDisposisiBidang) : letter.tanggalDisposisiBidang,
      jabatan: jabatan || letter.jabatan,
      nama: nama || letter.nama,
      nip: nip || letter.nip
    });

    await letter.save();

    // ✅ LOG AKTIVITAS: Edit Surat
    await logActivity(req.user.id, 'edit_letter', `Surat "${letter.noSurat}" diedit`, req);

    res.json({ message: 'Surat berhasil diperbarui.', letter });
  } catch (error) {
    console.error('Error updateLetter:', error);
    res.status(500).json({ message: 'Gagal memperbarui surat.' });
  }
};

// DELETE — hanya surat milik user yang bisa dihapus (incoming/outgoing)
const deleteLetter = async (req, res) => {
  try {
    const letter = await Letter.findOneAndDelete({
      _id: req.params.id,
      ownerId: req.user.id // ✅ hanya hapus milik user
    });
    if (!letter) return res.status(404).json({ message: 'Surat tidak ditemukan atau tidak memiliki izin hapus.' });

    if (letter.arsipDigital) {
      const filePath = path.join(__dirname, '..', letter.arsipDigital);
      await fs.unlink(filePath).catch(() => {});
    }

    await logActivity(req.user.id, 'delete_letter', `Surat "${letter.noSurat}" dihapus (salinan ${letter.type})`, req);

    res.json({ message: 'Surat berhasil dihapus.' });
  } catch (error) {
    res.status(500).json({ message: 'Gagal menghapus surat.' });
  }
};

module.exports = {
  createLetter,
  getIncomingLetters,
  getOutgoingLetters,
  getLetterById,
  updateLetter,
  deleteLetter
};