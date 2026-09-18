# Inventory Management API
**Ujian Remedial — TI253305 Pengembangan Web Sisi Server**
Program Studi Teknologi Informasi — ITB STIKOM Bali

Back-end web application (REST API) untuk manajemen inventaris toko sederhana,
dibangun dengan **Node.js + Express + SQLite**. Aplikasi ini dibuat untuk
memenuhi seluruh ketentuan pada Soal Pemenuhan CPMK03-06.

---

## 1. Daftar Isi
- [Arsitektur & Teknologi](#2-arsitektur--teknologi)
- [Struktur Folder](#3-struktur-folder)
- [Cara Menjalankan](#4-cara-menjalankan)
- [Dokumentasi Endpoint API](#5-dokumentasi-endpoint-api)
- [Pemenuhan Kriteria Soal (poin a–e)](#6-pemenuhan-kriteria-soal-poin-a–e)
- [Bukti Pengujian Keamanan](#7-bukti-pengujian-keamanan)
- [Kolaborasi & Git Workflow (CPMK104)](#8-kolaborasi--git-workflow-cpmk104)

---

## 2. Arsitektur & Teknologi

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

## 4. Cara Menjalankan

```bash
# 1. Install dependencies
npm install

# 2. Salin file environment
cp .env.example .env
# (opsional) ubah JWT_SECRET di .env

# 3. Jalankan server
npm start
# Server berjalan di http://localhost:3000
```

Database SQLite (`inventory.sqlite`) beserta tabel-tabelnya akan otomatis
dibuat saat server pertama kali dijalankan (lihat `db/database.js`).

## 5. Dokumentasi Endpoint API

### Users
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/users/register` | - | Registrasi user baru (password di-hash) |
| POST | `/api/users/login` | - | Login, mengembalikan JWT token |
| GET | `/api/users` | ✅ | Lihat semua user |
| GET | `/api/users/:id` | ✅ | Lihat detail user |
| PUT | `/api/users/:id` | ✅ | Update data user |
| DELETE | `/api/users/:id` | ✅ | Hapus user |

### Products (berelasi ke Users via `user_id`)
| Method | Endpoint | Auth | Keterangan |
|---|---|---|---|
| POST | `/api/products` | ✅ | Tambah produk baru |
| GET | `/api/products` | ✅ | Lihat semua produk (JOIN ke pemilik) |
| GET | `/api/products/:id` | ✅ | Lihat detail produk |
| PUT | `/api/products/:id` | ✅ | Update produk (hanya pemilik) |
| DELETE | `/api/products/:id` | ✅ | Hapus produk (hanya pemilik) |

**Cara autentikasi:** setelah login, sertakan header
`Authorization: Bearer <token>` pada setiap request ke endpoint yang bertanda ✅.

Contoh request lengkap ada di bagian [7. Bukti Pengujian Keamanan](#7-bukti-pengujian-keamanan).

## 6. Pemenuhan Kriteria Soal (poin a–e)

### a. Skema basis data relasional, minimal 2 tabel, CRUD di setiap entitas (CPMK091)
- Dua tabel relasional: **`users`** dan **`products`**, dihubungkan lewat
  `products.user_id` sebagai *foreign key* ke `users.id`
  (`ON DELETE CASCADE`) — lihat `db/database.js`.
- CRUD lengkap (Create, Read, Read-All, Update, Delete) tersedia untuk
  **kedua entitas**: `routes/users.js` dan `routes/products.js`.
- Endpoint `GET /api/products` menggunakan `JOIN` antar tabel untuk
  membuktikan relasinya benar-benar dipakai, bukan sekadar kolom kosong.

### b. Input dan validasi (CPMK093)
- Menggunakan `express-validator` di setiap endpoint create/update:
  - Username: panjang 3–30 karakter, hanya huruf/angka/underscore.
  - Email: harus format email valid (`isEmail`), dinormalisasi.
  - Password: minimal 6 karakter.
  - Produk: nama 2–100 karakter, harga harus angka ≥ 0, stok harus bilangan bulat ≥ 0.
- Jika validasi gagal, API mengembalikan status `400` beserta daftar pesan error per field (lihat `handleValidation`).

### c. Sanitasi data, mitigasi SQLi & XSS, enkripsi dasar (CPMK091)
- **Mitigasi SQL Injection:** seluruh query menggunakan *prepared statement* /
  parameterized query dari `better-sqlite3` (`db.prepare(...).run(...)`),
  **tidak ada** string SQL yang digabung manual dari input user.
- **Mitigasi XSS:** middleware global `middleware/sanitize.js` membersihkan
  seluruh `req.body`, `req.query`, `req.params` dari tag/script berbahaya
  menggunakan library `xss` sebelum data diproses atau disimpan.
- **Header keamanan tambahan:** `helmet()` mengatur HTTP security headers
  (mis. `X-Content-Type-Options`, mencegah MIME sniffing, dll).
- **Enkripsi dasar:** password user di-hash satu arah dengan `bcryptjs`
  (`bcrypt.hashSync(password, 10)`) sebelum disimpan — password asli
  **tidak pernah** tersimpan dalam bentuk plaintext di database.

### d. Minimal 1 library eksternal (CPMK103)
Project ini memakai **7 library eksternal** dari npm registry:
`express`, `better-sqlite3`, `express-validator`, `bcryptjs`, `jsonwebtoken`,
`helmet`, `xss` (ditambah `cors`, `morgan`, `dotenv` sebagai pendukung) —
seluruhnya tercatat pada `package.json`.

### e. Kolaborasi dibuktikan dengan penggunaan repository Git (CPMK104)
Lihat bagian [8. Kolaborasi & Git Workflow](#8-kolaborasi--git-workflow-cpmk104) di bawah.

## 7. Bukti Pengujian Keamanan

Berikut hasil pengujian nyata yang telah dilakukan terhadap aplikasi ini (dijalankan di `localhost:3000`):

**a) Registrasi & Login (password ter-enkripsi):**
```bash
curl -X POST http://localhost:3000/api/users/register -H "Content-Type: application/json" \
  -d '{"username":"budi123","email":"budi@mail.com","password":"rahasia123"}'
# -> {"success":true,"message":"Registrasi berhasil", ...}

curl -X POST http://localhost:3000/api/users/login -H "Content-Type: application/json" \
  -d '{"email":"budi@mail.com","password":"rahasia123"}'
# -> {"success":true,"message":"Login berhasil","token":"eyJhbGciOi..."}
```
Isi mentah database membuktikan password **tidak plaintext**:
```
password_hash: '$2b$10$DLrSo/2.EnfCPLD5U9MeXOUaXDjkLRsCVLMXTocvh2NiE3dUStrQK'
```

**b) Percobaan SQL Injection pada login (`' OR '1'='1`)** → ditolak oleh validasi format email sebelum sempat menyentuh query database:
```json
{"success":false,"errors":[{"msg":"Format email tidak valid","path":"email", ...}]}
```

**c) Percobaan XSS pada input produk** (`<script>alert(1)</script>` dan `<img src=x onerror=alert(1)>`) → otomatis disanitasi menjadi teks aman sebelum disimpan:
```json
{"name":"&lt;script&gt;alert(1)&lt;/script&gt;Produk Jahat","description":"test <img src>"}
```

**d) Validasi input ditolak untuk data tidak valid** (nama 1 huruf, harga negatif, stok negatif):
```json
{"success":false,"errors":[
  {"msg":"Nama produk minimal 2 karakter"},
  {"msg":"Harga harus angka positif"},
  {"msg":"Stok harus bilangan bulat >= 0"}
]}
```

**e) Akses tanpa token ditolak (401):**
```json
{"success":false,"message":"Token tidak ditemukan. Silakan login."}
```

**f) CRUD Products berjalan penuh** (Create → Read All (dengan JOIN ke owner) → Update → Read One → Delete) — seluruh alur telah diuji dan berhasil.

## 8. Kolaborasi & Git Workflow (CPMK104)

Repository ini sudah diinisialisasi dengan Git (`git init`) dan memiliki
riwayat commit bertahap (lihat `git log`) untuk menunjukkan proses
pengembangan. Untuk membuktikan **kolaborasi** secara nyata pada saat
pengumpulan tugas, lakukan langkah berikut:

1. Buat repository baru di GitHub, contoh: `inventory-api`.
2. Hubungkan repo lokal ke GitHub:
   ```bash
   git remote add origin https://github.com/<username>/inventory-api.git
   git branch -M main
   git push -u origin main
   ```
3. Tambahkan rekan satu kelompok sebagai **Collaborator**
   (Settings → Collaborators) jika dikerjakan berkelompok.
4. Setiap anggota bekerja di branch terpisah, lalu membuat Pull Request:
   ```bash
   git checkout -b fitur/nama-fitur
   git add .
   git commit -m "feat: menambahkan fitur X"
   git push origin fitur/nama-fitur
   # buka Pull Request di GitHub, lalu merge ke main
   ```
5. Riwayat commit dari lebih dari satu kontributor (atau minimal riwayat
   commit bertahap yang jelas) pada tab **Insights → Contributors**/
   **Commits** di GitHub menjadi bukti pemenuhan poin (e).

> Link repository GitHub dan screenshot riwayat commit dilampirkan
> terpisah pada saat pengumpulan (sesuaikan dengan ketentuan dosen).
