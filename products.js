// routes/products.js
// CPMK091: CRUD entitas Products (berelasi ke Users via user_id / FK), prepared statement
// CPMK093: Input & validasi
const express = require('express');
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

const productValidationRules = [
  body('name').trim().isLength({ min: 2, max: 100 }).withMessage('Nama produk minimal 2 karakter'),
  body('description').optional().trim().isLength({ max: 500 }),
  body('price').isFloat({ min: 0 }).withMessage('Harga harus angka positif'),
  body('stock').isInt({ min: 0 }).withMessage('Stok harus bilangan bulat >= 0'),
];

// ---------- CREATE ----------
router.post('/', authenticate, productValidationRules, handleValidation, (req, res, next) => {
  try {
    const { name, description, price, stock } = req.body;
    const stmt = db.prepare(
      `INSERT INTO products (user_id, name, description, price, stock)
       VALUES (?, ?, ?, ?, ?)`
    );
    const info = stmt.run(req.user.id, name, description || null, price, stock);

    res.status(201).json({
      success: true,
      message: 'Produk berhasil ditambahkan',
      data: { id: info.lastInsertRowid, name, description, price, stock, user_id: req.user.id }
    });
  } catch (err) {
    next(err);
  }
});

// ---------- READ ALL (with JOIN to users -> membuktikan relasi antar tabel) ----------
router.get('/', authenticate, (req, res, next) => {
  try {
    const products = db
      .prepare(
        `SELECT p.id, p.name, p.description, p.price, p.stock,
                p.created_at, p.updated_at,
                u.id AS owner_id, u.username AS owner_username
         FROM products p
         JOIN users u ON u.id = p.user_id
         ORDER BY p.created_at DESC`
      )
      .all();
    res.json({ success: true, count: products.length, data: products });
  } catch (err) {
    next(err);
  }
});

// ---------- READ ONE ----------
router.get('/:id', authenticate, (req, res, next) => {
  try {
    const product = db
      .prepare(
        `SELECT p.*, u.username AS owner_username
         FROM products p JOIN users u ON u.id = p.user_id
         WHERE p.id = ?`
      )
      .get(req.params.id);

    if (!product) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });
    res.json({ success: true, data: product });
  } catch (err) {
    next(err);
  }
});

// ---------- UPDATE ----------
router.put('/:id', authenticate, productValidationRules, handleValidation, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak mengubah produk ini' });
    }

    const { name, description, price, stock } = req.body;
    db.prepare(
      `UPDATE products
       SET name = ?, description = ?, price = ?, stock = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`
    ).run(name, description || null, price, stock, req.params.id);

    res.json({ success: true, message: 'Produk berhasil diperbarui' });
  } catch (err) {
    next(err);
  }
});

// ---------- DELETE ----------
router.delete('/:id', authenticate, (req, res, next) => {
  try {
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ success: false, message: 'Produk tidak ditemukan' });

    if (existing.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Anda tidak berhak menghapus produk ini' });
    }

    db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
    res.json({ success: true, message: 'Produk berhasil dihapus' });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
