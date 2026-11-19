# Sajian Catering — Fullstack Culinary Showcase, Portal Klien & Sistem Dapur RBAC

Platform web fullstack modular untuk **Sajian Catering** yang menggabungkan frontend **Vite + React 18 + Tailwind CSS** (siap publikasi di **GitHub Pages**) dan backend **Node.js + Express + Zod + JWT/scrypt RBAC** (siap jalan lokal dengan `node:sqlite` dan siap deploy 24/7 gratis ke **Vercel Hobby + Neon PostgreSQL**).

---

## Arsitektur Role & Scope (4 POV)

| Role | Cara Akses | Scope & Fitur Utama | Pembatasan |
| :--- | :--- | :--- | :--- |
| **Klien (`client`)** | Publik langsung + tab **Portal Klien** | Showcase interaktif, filter katalog lengkap, kalender kapasitas, kalkulator booking, pelacak & timeline pesanan, update catatan alergi, cetak invoice | Tidak melihat HPP/margin internal maupun data pelanggan lain |
| **Admin Dapur (`kitchen`)** | Footer → **Portal Internal Tim** (`dapur@sajiancatering.id`) | Kitchen Command Center, agregasi Kitchen Sheet, checklist tahap produksi (`Persiapan Bahan → Sedang Dimasak → QC & Packing → Siap Kirim`), cetak ticket produksi | Tidak dapat melihat nominal margin/HPP atau mengubah pengaturan bisnis/pengembang |
| **Administrator (`admin`)** | Footer → **Portal Internal Tim** (`admin@sajiancatering.id`) | KPI omzet & margin kotor, verifikasi DP, manajemen status pesanan, CRUD katalog & harga, **Pengaturan Bisnis**, dan **Keamanan & Akun** (ganti password + Recovery Key) | Tidak mengakses pengaturan internal pengembang (theme tokens, feature flags, akun tim lain) |
| **Pengembang (`developer`)** | `Ctrl+Shift+D`, `?dev=1`, atau Portal Login → tab *Developer* (`dev@sajiancatering.id`) | **Developer Console**: kustomisasi CSS Design Tokens langsung, Feature Flags, manajemen akun & audit RBAC, koneksi Backend API, ekspor/impor JSON, dan toggle *Mode Demo Quick-Switch* | Akses penuh |

---

## Menjalankan Secara Lokal (Frontend + Backend)

### 1. Jalankan Backend API (`node:sqlite` gratis tanpa setup database eksternal)
```powershell
cd backend
npm install
npm test
npm run dev
```
Server berjalan di `http://localhost:4000` (`/api/health`).

### 2. Jalankan Frontend Modular
```powershell
npm install
npm test
npm run dev
```
Aplikasi berjalan di `http://localhost:5173/sajian-catering/`. Untuk menyambungkan ke API lokal saat mode demo, buka **Developer Console (`Ctrl+Shift+D` → login `dev@sajiancatering.id`)** lalu isi URL `http://localhost:4000`, atau set `VITE_API_URL`.

---

## Deploy Backend Gratis 24/7 (Vercel + Neon PostgreSQL)

1. Buat proyek gratis di **Neon** (`https://neon.tech`) dan salin `DATABASE_URL` PostgreSQL Anda.
2. Deploy folder `backend/` ke **Vercel** (proyek baru dengan *Root Directory*: `backend`).
3. Tambahkan Environment Variables di Vercel:
   - `NODE_ENV=production`
   - `DB_DRIVER=postgres`
   - `DATABASE_URL=<Neon Postgres connection string>`
   - `JWT_SECRET=<random 32+ char string>`
   - `CORS_ORIGINS=https://gasappsss.github.io`
4. Simpan URL Vercel Anda di GitHub Repository **Settings → Secrets and variables → Actions → Variables** dengan nama `VITE_API_URL`, atau pasang langsung melalui **Developer Console → Koneksi Backend API**.
