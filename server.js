// server.js
// Entry point aplikasi - Inventory Management API
// Menggabungkan seluruh middleware keamanan (CPMK091) & routing CRUD.
require('dotenv').config();
const express = require('express');
const helmet = require('helmet');   // CPMK091: menambahkan HTTP security headers
const cors = require('cors');
const morgan = require('morgan');   // logging request (memudahkan debugging/monitoring)

const sanitizeInput = require('./middleware/sanitize'); // CPMK091: mitigasi XSS
const errorHandler = require('./middleware/errorHandler');

const userRoutes = require('./routes/users');
const productRoutes = require('./routes/products');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- Global Middleware ----------
app.use(helmet());               // set header keamanan (X-Content-Type-Options, dsb)
app.use(cors());
app.use(morgan('dev'));
app.use(express.json({ limit: '10kb' })); // batasi ukuran payload
app.use(sanitizeInput);          // sanitasi semua input body/query/params

// ---------- Routes ----------
app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Inventory Management API is running',
    endpoints: {
      users: '/api/users',
      products: '/api/products'
    }
  });
});

app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Endpoint tidak ditemukan' });
});

// Error handler (harus paling akhir)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`✅ Server berjalan di http://localhost:${PORT}`);
});
