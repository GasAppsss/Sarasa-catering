# Sarasa Catering — Interactive Culinary Showcase

Aplikasi web frontend statis untuk **Sarasa Catering** yang menggabungkan pengalaman katalog interaktif pelanggan dan sistem manajemen dapur terpadu (*client-side*).

## Fitur Utama

- **Showcase & Order (Customer):**
  - Showcase piring interaktif 4 paket unggulan (*Royal Buffet Nusantara*, *Nasi Kotak Executive*, *Tumpeng Agung Keraton*, *Gubukan Kambing Guling*) dengan navigasi klik, indikator, dan keyboard (`←` / `→`).
  - Kalender kapasitas dapur 14 hari ke depan secara real-time.
  - Kalkulator estimasi biaya otomatis (paket utama + tambahan gubukan/live stall + uang muka 50%).
  - Pelacak pesanan (*Cek Pesanan*) & generator pesan konfirmasi WhatsApp.
- **Dashboard Admin (Demo Operasional):**
  - Ringkasan KPI pesanan aktif, pax terjadwal, DP terkumpul, dan antrean tindakan.
  - Manajemen status pesanan, *Kitchen Sheet* (agregasi produksi dapur per tanggal), katalog paket & margin HPP, formulir tambah paket baru, serta modal **Cetak Invoice**.
  - Penyimpanan lokal di browser via `localStorage` (`sarasa_pkgs_v2` & `sarasa_orders_v2`) dengan tombol **Reset Demo**.

## Preview Lokal

Jalankan server HTTP statis dari root folder proyek:

```powershell
python -m http.server 4173
```

Lalu buka `http://localhost:4173` di browser.

## Deployment (GitHub Pages)

Proyek ini menggunakan alur kerja otomatis GitHub Actions di [deploy-pages.yml](.github/workflows/deploy-pages.yml) dan file penanda `.nojekyll`.

1. Pastikan repositori GitHub bersifat **Public** (untuk paket GitHub Free).
2. Buka **Settings → Pages → Build and deployment → Source** lalu pilih **GitHub Actions** (atau *Deploy from a branch* `main` / `/ (root)`).
3. Setiap push ke branch `main` akan memicu publikasi ke `https://<username>.github.io/sarasa-catering/`.
