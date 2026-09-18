// routes/users.js
// CPMK091 (CRUD entitas Users, SQLi mitigation via prepared statement, enkripsi password)
// CPMK093 (Input & validasi)
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const db = require('../db/database');
const authenticate = require('../middleware/auth');

const router = express.Router();

function handleValidation(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ success: false, errors: errors.array() });
  }
  next();
}

// ---------- REGISTER (Create) ----------
router.post(
  '/register',
  [
    body('username')
      .trim()
      .isLength({ min: 3, max: 30 }).withMessage('Username minimal 3 karakter')
      .matches(/^[a-zA-Z0-9_]+$/).withMessage('Username hanya boleh huruf, angka, underscore'),
    body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
    body('password')
      .isLength({ min: 6 }).withMessage('Password minimal 6 karakter'),
  ],
  handleValidation,
  (req, res, next) => {
    try {
      const { username, email, password } = req.body;

      // CPMK091: Enkripsi dasar -> hashing password dengan bcrypt (salt round 10)
      const password_hash = bcrypt.hashSync(password, 10);

      // Prepared statement (parameterized query) -> mitigasi SQL Injection
      const stmt = db.prepare(
        'INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)'
      );
      const info = stmt.run(username, email, password_hash);

      res.status(201).json({
        success: true,
        message: 'Registrasi berhasil',
        data: { id: info.lastInsertRowid, username, email }
      });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- LOGIN ----------
router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Format email tidak valid').normalizeEmail(),
    body('password').notEmpty().withMessage('Password wajib diisi'),
  ],
  handleValidation,
  (req, res, next) => {
    try {
      const { email, password } = req.body;
      const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

      if (!user || !bcrypt.compareSync(password, user.password_hash)) {
        return res.status(401).json({ success: false, message: 'Email atau password salah' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '1d' }
      );

      res.json({ success: true, message: 'Login berhasil', token });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- READ ALL (protected) ----------
router.get('/', authenticate, (req, res, next) => {
  try {
    const users = db.prepare('SELECT id, username, email, created_at FROM users').all();
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// ---------- READ ONE ----------
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const user = db
      .prepare('SELECT id, username, email, created_at FROM users WHERE id = ?')
      .get(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// ---------- UPDATE ----------
router.put(
  '/:id',
  authenticate,
  [
    body('username').optional().trim().isLength({ min: 3, max: 30 }),
    body('email').optional().isEmail().normalizeEmail(),
  ],
  handleValidation,
  (req, res, next) => {
    try {
      const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
      if (!existing) return res.status(404).json({ success: false, message: 'User tidak ditemukan' });

      const username = req.body.username || existing.username;
      const email = req.body.email || existing.email;

      db.prepare('UPDATE users SET username = ?, email = ? WHERE id = ?').run(
        username,
        email,
        req.params.id
      );

      res.json({ success: true, message: 'User berhasil diperbarui' });
    } catch (err) {
      next(err);
    }
  }
);

// ---------- DELETE ----------
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const info = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }
    res.json({ success: true, message: 'User berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
