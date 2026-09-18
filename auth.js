// middleware/auth.js
// Autentikasi berbasis JWT untuk melindungi endpoint CRUD produk.
const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // format: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ success: false, message: 'Token tidak ditemukan. Silakan login.' });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ success: false, message: 'Token tidak valid atau sudah kedaluwarsa.' });
    }
    req.user = decoded; // { id, username }
    next();
  });
}

module.exports = authenticate;
