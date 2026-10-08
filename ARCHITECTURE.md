# Arsitektur Aplikasi Beliyuk Jajan (Production & AI-Friendly Guide)

Dokumen ini adalah **pedoman resmi arsitektur sistem** aplikasi katalog digital dan pemesanan online **Beliyuk Jajan** (Spesialis Roti Bakar Sangatta). Dirancang dengan standar produksi modern dan ramah pemeliharaan (*AI-Friendly & Maintainable*).

---

## 1. Prinsip & Filosofi Arsitektur

1. **Pemisahan Jalur Publik vs Portal Pemilik Toko**:
   - **Rute Pelanggan (`/`)**: Bebas hambatan, tanpa registrasi, fokus konversi pembelian via katalog, keranjang belanja, dan pemesanan WhatsApp.
   - **Rute Admin (`/admin`)**: Terisolasi secara URL, dilindungi **Firebase Authentication (IAM murni)** tanpa form pendaftaran publik atau celah PIN darurat.
2. **Dual-Channel Checkout Pipeline**:
   - Ketika pelanggan menekan "Pesan Sekarang":
     1. Data pesanan diverifikasi dan disimpan langsung ke koleksi **`orders` di Cloud Firestore** sebagai *Order Ledger* permanen.
     2. Salinan nota terformat rapi dikirimkan langsung ke **WhatsApp Kasir** (`0851-2802-4754`) untuk konfirmasi dan proses masak.
     3. Nota disimpan di *localStorage* pelanggan untuk riwayat belanja lokal.
3. **Optimasi Performa & Code-Splitting**:
   - Modul admin (`AdminDashboard`, `AdminLoginPage`) dan SDK Firebase dipisahkan menggunakan **`React.lazy()`** dan **Rollup `manualChunks`**.
   - Bundle pelanggan hanya berukuran **~84 kB** (*gzip: 20 kB*), memastikan pemuatan instan pada jaringan mobile pelanggan Sangatta.
4. **Keamanan Database Granular (Firestore Rules)**:
   - Pelanggan hanya diberikan izin `create` (membuat pesanan) dan `read` (membaca katalog).
   - Hak `update`, `delete`, dan membaca seluruh rekap pesanan/omset diisolasi hanya untuk user yang terotentikasi Firebase (`request.auth != null`).
5. **Penanganan Gambar Terkompresi Otomatis**:
   - Unggah foto menu baru/edit menggunakan HTML5 Canvas ([src/utils/imageCompressor.js](src/utils/imageCompressor.js)) untuk mengompresi gambar ke ukuran maksimal 600px dengan format WebP/JPEG ringan (< 80 kB).

---

## 2. Struktur Direktori Proyek

```
BELIYUK JAJAN/
├── index.html                     # Entry point HTML, PWA meta tags & font Poppins
├── package.json                   # Metadata dependensi & skrip build
├── vite.config.js                 # Konfigurasi Vite & Rollup manualChunks
├── firestore.rules                # Aturan keamanan granular Cloud Firestore
├── public/
│   ├── manifest.json              # Web App Manifest untuk PWA (Add to Home Screen)
│   ├── favicon.svg                # Ikon vektor aplikasi
│   └── icons.svg                  # SVG sprite
├── ARCHITECTURE.md                # (Dokumen ini) Pedoman arsitektur sistem
├── README.md                      # Panduan umum proyek & operasi
└── src/
    ├── main.jsx                   # React DOM bootstrapping
    ├── App.jsx                    # Orkestrator routing, lazy-load & status autentikasi
    ├── index.css                  # Tailwind CSS v4 & custom design tokens
    ├── config/
    │   └── constants.js           # Konstanta global toko, nomor WA, alamat Sangatta
    ├── types/
    │   └── index.js               # Kontrak JSDoc (Category, Product, CartItem, Order)
    ├── data/
    │   ├── categories.js          # Kategori menu resmi (Roti Bakar, Minuman, Spesial)
    │   └── products.js            # 14 data menu otentik sesuai brosur Beliyuk Roti Bakar
    ├── services/
    │   └── firebase.js            # Inisialisasi Firebase Auth, Firestore, & CRUD helpers
    ├── utils/
    │   ├── currency.js            # Formatter mata uang rupiah (formatRupiah)
    │   ├── filter.js              # Utilitas pencarian & filter menu
    │   ├── whatsapp.js            # Generator pesan checkout & link Tanya Ready
    │   └── imageCompressor.js     # Kompresor gambar lokal berbasis Canvas
    ├── hooks/
    │   ├── useCatalog.js          # State produk, mutasi stok, sinkronisasi Cloud
    │   ├── useCart.js             # State keranjang belanja & kalkulasi total
    │   ├── useOrders.js           # State riwayat nota pesanan pembeli
    │   └── useAdminSettings.js    # State pengaturan biaya, jam operasional, no WA
    └── components/
        ├── admin/
        │   ├── AdminLoginPage.jsx # Halaman login Firebase IAM staf/pemilik
        │   └── AdminDashboard.jsx # Dasbor eksekutif omset, pesanan masuk & kelola menu
        ├── layout/
        │   ├── AddressBar.jsx     # Bar alamat Sangatta & jam buka toko
        │   ├── Header.jsx         # Header adaptif (Desktop & Mobile)
        │   ├── HeroSection.jsx    # Banner pencarian menu
        │   ├── PromoBanners.jsx   # Banner horizontal promo
        │   ├── BottomNav.jsx      # Mobile navigation bar (Food delivery style)
        │   └── Footer.jsx         # Footer aplikasi & tautan login staf tersembunyi
        ├── catalog/
        │   ├── CategoryFilter.jsx # Tombol filter kategori
        │   ├── ProductCard.jsx    # Kartu produk, in-card stepper, tombol Tanya Ready
        │   ├── ProductGrid.jsx    # Grid kartu menu & fallback tampilan kosong
        │   └── VariantModal.jsx   # Modal pilihan varian (porsi, topping)
        ├── cart/
        │   ├── FloatingCartBar.jsx # Bar mengambang ringkasan belanja
        │   └── CartDrawerModal.jsx # Drawer pesanan, rincian biaya & trigger WhatsApp
        ├── views/
        │   ├── PromoView.jsx      # Halaman kupon promo
        │   ├── OrdersView.jsx     # Halaman riwayat belanja pelanggan
        │   └── ProfileView.jsx    # Halaman profil toko & informasi kontak
        └── common/
            ├── Toast.jsx          # Notifikasi feedback interaktif
            └── LoadingSpinner.jsx # Loading fallback untuk modul lazy-load
```

---

## 3. Konfigurasi Toko & Database

- **Firebase Project:** `umknportal`
- **Nomor WhatsApp Toko:** `0851-2802-4754` (`6285128024754`)
- **Lokasi Toko:** G house no.151 Swarga Bara, Sangatta Utara, Kutai Timur (75683)
- **Koleksi Firestore:**
  - `products`: Katalog menu makanan & minuman
  - `orders`: Ledger pesanan masuk real-time beserta status penanganan
