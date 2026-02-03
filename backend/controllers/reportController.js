// controllers/reportController.js
const Letter = require('../models/Letter');
const Classification = require('../models/Classification');
const { logActivity } = require('../utils/logActivity'); // ← tambahkan ini

const getMonthlyReport = async (req, res) => {
  try {
    const { year } = req.query;
    const targetYear = year ? parseInt(year) : new Date().getFullYear();

    // Ambil semua klasifikasi untuk referensi warna & nama
    const classifications = await Classification.find().lean();
    const classificationMap = {};
    classifications.forEach(cls => {
      classificationMap[cls._id.toString()] = cls;
    });

    // Agregasi surat per bulan + klasifikasi
    const report = await Letter.aggregate([
      {
        $match: {
          createdAt: {
            $gte: new Date(`${targetYear}-01-01`),
            $lt: new Date(`${targetYear + 1}-01-01`)
          }
        }
      },
      {
        $addFields: {
          month: { $month: "$createdAt" },
          year: { $year: "$createdAt" }
        }
      },
      {
        $group: {
          _id: { month: "$month", year: "$year" },
          totalSurat: { $sum: 1 },
          suratMasuk: { $sum: 1 }, // semua surat = masuk dari sisi penerima
          suratKeluar: { $sum: 1 }, // semua surat = keluar dari sisi pengirim
          klasifikasiList: { $push: "$klasifikasiId" } // ✅ TAMBAHKAN INI
        }
      },
      { $sort: { "_id.month": 1 } }
    ]);

    // Hitung jumlah surat per klasifikasi per bulan
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
      'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'
    ];

    const formattedReport = [];
    const globalSummary = {};

    for (let i = 1; i <= 12; i++) {
      const item = report.find(r => r._id.month === i);

      if (item) {
        // Hitung jumlah surat per klasifikasi untuk bulan ini
        const klasifikasiCount = {};
        const list = item.klasifikasiList || []; // ✅ SEKARANG BERISI

        list.forEach(klasifikasiId => {
          if (klasifikasiId) {
            const id = klasifikasiId.toString();
            klasifikasiCount[id] = (klasifikasiCount[id] || 0) + 1;

            // Update summary global
            if (classificationMap[id]) {
              if (!globalSummary[id]) {
                globalSummary[id] = {
                  ...classificationMap[id],
                  jumlah: 0
                };
              }
              globalSummary[id].jumlah += 1;
            }
          }
        });

        // Format klasifikasi untuk tampilan
        const formattedKlasifikasi = {};
        Object.keys(klasifikasiCount).forEach(id => {
          if (classificationMap[id]) {
            formattedKlasifikasi[id] = {
              nama: classificationMap[id].nama,
              warna: classificationMap[id].warna || '#cccccc',
              jumlah: klasifikasiCount[id]
            };
          }
        });

        formattedReport.push({
          bulan: i,
          tahun: targetYear,
          namaBulan: monthNames[i - 1],
          totalSurat: item.totalSurat || 0,
          suratMasuk: item.suratMasuk || 0,
          suratKeluar: item.suratKeluar || 0,
          klasifikasi: formattedKlasifikasi
        });
      } else {
        formattedReport.push({
          bulan: i,
          tahun: targetYear,
          namaBulan: monthNames[i - 1],
          totalSurat: 0,
          suratMasuk: 0,
          suratKeluar: 0,
          klasifikasi: {}
        });
      }
    }

    // ✅ LOG AKTIVITAS: Akses Laporan
    await logActivity(req.user.id, 'view_report', `User mengakses laporan bulanan tahun ${targetYear}`, req);

    res.json({
      year: targetYear,
      data: formattedReport,
      summary: globalSummary
    });

  } catch (err) {
    console.error('Error laporan:', err);
    res.status(500).json({ message: 'Gagal mengambil data laporan.' });
  }
};

module.exports = { getMonthlyReport };