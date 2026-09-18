// middleware/errorHandler.js
// Menangani error secara terpusat agar tidak membocorkan detail internal (stack trace)
// ke response client -- bagian dari praktik keamanan dasar.
function errorHandler(err, req, res, next) {
  console.error('[ERROR]', err.message);

  if (err.code === 'SQLITE_CONSTRAINT_UNIQUE') {
    return res.status(409).json({ success: false, message: 'Data sudah terdaftar (duplikat).' });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Terjadi kesalahan pada server.'
  });
}

module.exports = errorHandler;
