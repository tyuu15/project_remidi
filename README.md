## 1. Arsitektur & Teknologi

| Komponen | Teknologi | Fungsi |
|---|---|---|
| Runtime | Node.js | Server JavaScript |
| Framework | Express.js | Routing & middleware HTTP |
| Database | SQLite (better-sqlite3) | Basis data relasional |
| Validasi | express-validator | Validasi & normalisasi input |
| Enkripsi | bcryptjs | Hashing password (one-way encryption) |
| Autentikasi | jsonwebtoken (JWT) | Sesi login stateless |
| Keamanan header | helmet | HTTP security headers |
| Anti-XSS | xss | Sanitasi input dari tag/script berbahaya |
| Logging | morgan | Log akses request |

## 3. Struktur Folder

```
inventory-api/
├── db/
│   └── database.js        # Koneksi & skema database relasional
├── middleware/
│   ├── auth.js             # Verifikasi JWT
│   ├── sanitize.js         # Sanitasi anti-XSS untuk semua input
│   └── errorHandler.js     # Penanganan error terpusat
├── routes/
│   ├── users.js            # CRUD Users + register/login (bcrypt)
│   └── products.js         # CRUD Products (relasi ke Users)
├── server.js                # Entry point aplikasi
├── package.json
├── .env.example             # Contoh konfigurasi environment
└── .gitignore
```


## 2. Dokumentasi Endpoint API

### Users
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/users/register` | - | Registrasi user baru (password di-hash) |
| POST | `/api/users/login` | - | Login, mengembalikan JWT token |
| GET | `/api/users` | centang | Lihat semua user |
| GET | `/api/users/:id` | centang | Lihat detail user |
| PUT | `/api/users/:id` | centang | Update data user |
| DELETE | `/api/users/:id` | centang | Hapus user |

### Products (berelasi ke Users via `user_id`)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/products` | centang | Tambah produk baru |
| GET | `/api/products` | centang | Lihat semua produk (JOIN ke pemilik) |
| GET | `/api/products/:id` | centang | Lihat detail produk |
| PUT | `/api/products/:id` | centang | Update produk (hanya pemilik) |
| DELETE | `/api/products/:id` | centang | Hapus produk (hanya pemilik) |



> Link repository GitHub dan screenshot riwayat commit dilampirkan
> terpisah pada saat pengumpulan (sesuaikan dengan ketentuan dosen).
