# Beliyuk Jajan - Roti Bakar Sangatta Online & Food Delivery 🍞

Aplikasi web katalog digital & pemesanan online resmi untuk **Beliyuk Jajan** (Spesialis Roti Bakar & Minuman Segar), berlokasi di **G house no.151 Swarga Bara, Sangatta Utara, Kutai Timur (75683)**.

Dibangun dengan standar produksi modern menggunakan **React 19 + Vite + Tailwind CSS v4 + Firebase Cloud (Authentication & Firestore)** serta terintegrasi langsung dengan **Pemesanan WhatsApp Kasir**.

---

## 🚀 Fitur Utama Sistem

### 1. Portal Pelanggan Publik (`/` atau `/#/`)
- **Katalog Menu Resmi**: 14 menu otentik sesuai brosur toko (Seri Nutella Spesial, Seri Coklat & Keju, Seri Selai Buah & Kacang, serta Minuman Es Segar).
- **Dual-Channel Checkout**:
  - Menyusun rincian pesanan baku untuk dikirimkan langsung ke **WhatsApp Kasir** (`0851-2802-4754`).
  - Secara bersamaan mencatat transaksi ke **Cloud Firestore Ledger** (`orders` collection) sehingga tidak ada pesanan yang terlewat.
- **Tanya Ketersediaan (1-Klik "Tanya Ready?")**: Tombol cepat untuk menanyakan stok varian menu langsung ke WhatsApp toko.
- **Kustomisasi Varian & Topping**: Pilihan jenis porsi/potongan dan ekstra topping dengan perhitungan harga instan.
- **PWA & Mobile-First (Add to Home Screen)**: Dilengkapi `manifest.json` dan tema warna `#FF7A00` sehingga dapat di-install di ponsel pelanggan layaknya aplikasi GoFood/ShopeeFood.
- **Performa Ultra Ringan (Code-Splitting)**: Bundle pelanggan hanya berukuran **~84 kB** (*gzip: 20 kB*) berkat Rollup manual chunking dan lazy loading, sangat cepat dibuka di jaringan mobile.

### 2. Portal Admin & Dasbor Pemilik Toko (`/admin` atau `/#admin`)
- **Pemisahan URL Ketat**: Rute admin dipisahkan dari pelanggan publik dan diamankan dengan **Firebase Authentication (IAM murni)**.
- **Zero-Backdoor Security**: Tidak menyediakan tombol registrasi publik maupun PIN darurat demi mencegah akses tidak sah.
- **Tab Rekap Pesanan & Omset (Executive Dashboard)**:
  - Kartu KPI: Total Omset (Rp), Total Pesanan Masuk, Pesanan Baru, Sedang Disiapkan, dan Selesai.
  - Filter status pesanan & pencarian nama pemesan / ID nota.
  - Quick Status Changer (🔔 Baru &rarr; 🍳 Disiapkan &rarr; 🛵 Diantar &rarr; ✅ Selesai &rarr; ❌ Batal).
  - Tombol 1-klik hubungi balik pemesan via WhatsApp.
- **Tab Manajemen Menu & Stok**:
  - Sakelar status `Ready` atau `Habis` sekali klik.
  - Edit harga cepat di tempat (*Inline Price Editing*).
  - Modal Tambah & Edit Menu lengkap dengan fitur **Unggah Foto dari HP / Komputer (Auto-Compress Canvas ke WebP/JPEG ringan)**.

---

## 🛠️ Cara Menjalankan Proyek di Lokal

Pastikan Anda telah menginstal **Node.js** (v18 ke atas disarankan).

### 1. Masuk ke direktori proyek
```bash
cd "BELIYUK JAJAN"
```

### 2. Jalankan Development Server
```bash
npm run dev
```
Buka browser pada tautan:
- **Katalog Pelanggan:** `http://localhost:5173/`
- **Portal Login Admin:** `http://localhost:5173/admin`

### 3. Build & Uji Bundle Produksi
```bash
npm run build
```
Hasil build tersimpan di direktori `dist/` dengan pemisahan chunk vendor (`vendor-firebase`, `vendor-react`, `AdminDashboard`, `index`).

---

## 🔐 Konfigurasi Akun Admin (Firebase Console)

Karena aplikasi menggunakan prinsip keamanan IAM murni, pembuatan akun staf/pemilik toko dilakukan melalui Firebase Console:

1. Buka [Firebase Console](https://console.firebase.google.com/) dan pilih project **`umknportal`**.
2. Masuk ke menu **Build** &rarr; **Authentication** &rarr; tab **Users**.
3. Klik tombol **Add user**.
4. Masukkan **Email** (contoh: `admin@beliyuk.com` atau email pemilik) dan buat **Password** yang kuat.
5. Gunakan email & password tersebut untuk masuk di `http://localhost:5173/admin`.

---

## 🛡️ Keamanan Database & Penyimpanan Foto (Security Rules)

Aturan keamanan telah disiapkan pada:
1. **Firestore ([firestore.rules](firestore.rules)):**
   - Koleksi `products`: Publik dapat membaca (`get`, `list`), namun hanya admin terotentikasi yang dapat menambah, mengubah, atau menghapus.
   - Koleksi `orders`: Publik dapat membuat pesanan baru (`create`), sedangkan hanya admin terotentikasi yang dapat melihat seluruh rekap dan memperbarui status pesanan.
2. **Cloud Storage ([storage.rules](storage.rules)):**
   - Direktori `products/`: Publik dapat melihat foto menu, sedangkan hanya admin terotentikasi yang dapat mengunggah atau menghapus foto menu.

Untuk men-deploy rules sekaligus ke project Firebase `umknportal`:
```bash
firebase deploy --only firestore:rules,storage:rules
```

---

## ☁️ Aktivasi Firebase Storage (Gratis 5 GB Spark Plan)
1. Buka [Firebase Console](https://console.firebase.google.com/) &rarr; pilih project **`umknportal`**.
2. Masuk ke menu **Build** &rarr; **Storage** &rarr; klik **Get started**.
3. Pilih lokasi bucket default (misal: `asia-southeast2` Jakarta atau `us-central1`), lalu klik **Done**.
4. Foto menu yang diunggah dari Dasbor Admin akan otomatis tersimpan di bucket `umknportal.firebasestorage.app` dan menghasilkan URL gambar berkecepatan tinggi!

---

## 🚀 Panduan Deployment ke Vercel

1. **Hubungkan Repository GitHub:**
   - Masuk ke [Vercel Dashboard](https://vercel.com/) &rarr; klik **Add New Project** &rarr; impor repositori `protontekno-bit/jajan`.
2. **Framework Preset:**
   - Vercel akan otomatis mendeteksi preset **Vite**.
   - Build Command: `npm run build`
   - Output Directory: `dist`
3. **Konfigurasi Environment Variables (PENTING):**
   - Di Vercel Settings &rarr; **Environment Variables**, masukkan variabel dari file `.env.example`:
     - `VITE_FIREBASE_API_KEY`
     - `VITE_FIREBASE_AUTH_DOMAIN`
     - `VITE_FIREBASE_PROJECT_ID`
     - `VITE_FIREBASE_STORAGE_BUCKET`
     - `VITE_FIREBASE_MESSAGING_SENDER_ID`
     - `VITE_FIREBASE_APP_ID`
4. **Deploy:**
   - Klik **Deploy**. Routing SPA telah dikonfigurasi melalui `vercel.json` sehingga rute langsung seperti `/admin` tidak akan menghasilkan 404 saat di-refresh.

---

## 📖 Pedoman Arsitektur
Pelajari struktur arsitektur sistem, alur state, dan pedoman pengembangan di [ARCHITECTURE.md](ARCHITECTURE.md).
