# Panduan Deploy Cloud 24/7 — Sajian Catering (Supabase + Vercel + Resend)

Arsitektur produksi **Sajian Catering** terdiri dari:
- **Frontend:** GitHub Pages (`https://gasappsss.github.io/sajian-catering/`)
- **Backend API:** Vercel Serverless (`backend/` — Express + Zod + JWT + scrypt)
- **Database Cloud:** Supabase PostgreSQL (Transaction Pooler + Row Level Security aktif)
- **Email OTP Lupa Password:** Resend (`resend.com`, gratis 3.000 email/bulan)

---

## Langkah 1 — Siapkan Database Supabase PostgreSQL

1. Buka dashboard proyek Supabase Anda (`https://supabase.com/dashboard`).
2. Klik **Connect** (atau **Project Settings → Database → Connection string**), pilih mode **Transaction pooler** (Port `6543`).
3. Salin URI PostgreSQL dengan format:
   ```text
   postgresql://postgres.<project-ref>:<DB_PASSWORD>@aws-0-<region>.pooler.supabase.com:6543/postgres
   ```
4. Uji koneksi & migrasi otomatis dari terminal lokal (tabel + RLS + katalog + akun awal otomatis terbentuk, **0 pesanan demo fiktif** karena `NODE_ENV=production`):
   ```powershell
   cd backend
   $env:NODE_ENV="production"
   $env:DB_DRIVER="postgres"
   $env:JWT_SECRET="<ganti-dengan-64-karakter-hex-acak>"
   $env:DATABASE_URL="<tempel-connection-string-supabase-anda>"
   npm run check:db
   ```

---

## Langkah 2 — Deploy Backend API ke Vercel (Gratis)

1. Login Vercel dari folder `backend/`:
   ```powershell
   cd backend
   npx vercel login
   npx vercel link
   ```
2. Pasang Environment Variables **Production** di Vercel (contoh dummy — isi nilai asli saat di-prompt CLI / Dashboard Vercel):
   - `NODE_ENV` = `production`
   - `DB_DRIVER` = `postgres`
   - `DATABASE_URL` = `<Supabase Transaction Pooler URI>`
   - `JWT_SECRET` = `<random 64-char hex secret>`
   - `CORS_ORIGINS` = `https://gasappsss.github.io`
   - `RESEND_API_KEY` = `<RESEND_API_KEY_ANDA dari resend.com>`
   - `MAIL_FROM` = `Sajian Catering <noreply@domain-terverifikasi-anda.com>` *(atau `onboarding@resend.dev` saat pengujian)*
3. Deploy ke Production:
   ```powershell
   npx vercel --prod
   ```
4. Verifikasi health check live:
   ```text
   GET https://<nama-proyek-anda>.vercel.app/api/health
   ```
   Pastikan respons JSON menunjukkan `"ok": true`, `"driver": "postgres"`, `"db": "ok"`, dan `"emailOtpConfigured": true`.

---

## Langkah 3 — Sambungkan Frontend GitHub Pages ke Backend Cloud

1. Simpan URL Backend Vercel ke GitHub Repository Variable:
   ```powershell
   gh variable set VITE_API_URL --body "https://<nama-proyek-anda>.vercel.app"
   ```
2. Trigger build ulang Production (`main` & `dev`) via GitHub Actions (atau merge `dev` → `main` lalu `git push origin main`).
3. Setelah selesai, buka `https://gasappsss.github.io/sajian-catering/?login=admin`, login, lalu **wajib** buka tab **Keamanan & Akun** untuk:
   - Mengganti password default Admin & Developer.
   - Membuat ulang & mengunduh file `.TXT` *Master Recovery Key* baru.
