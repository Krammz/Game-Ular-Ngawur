# Krammzlua AI Chat

Chat AI dengan tampilan responsif, pilihan model, riwayat di browser, dan animasi mengetik. Backend menggunakan Python 3 bawaan, tanpa paket tambahan.

## Penting sebelum upload

- API key **tidak** ada di kode. Jangan tempel atau upload key ke repository GitHub, termasuk di file `.env`.
- GitHub bisa menyimpan kode, tetapi **GitHub Pages hanya untuk file statis** dan tidak menjalankan `jalankan_krammzlua.py`. Karena API tidak mengizinkan browser mengaksesnya langsung (CORS), chat perlu server Python.
- Di bawah ini adalah cara menggunakan GitHub untuk menyimpan kode dan Render untuk menjalankan Python.

## 1. Upload ke GitHub

1. Buat repository baru di GitHub.
2. Ekstrak ZIP ini. Pada repository, pilih **Add file → Upload files**.
3. Upload semua file di dalam folder ini, termasuk `render.yaml`, `krammzlua.html`, dan `jalankan_krammzlua.py`, lalu pilih **Commit changes**. Jangan upload ZIP versi lama karena file server lamanya berisi API key.

## 2. Jalankan lewat Render

1. Buat akun atau masuk ke https://dashboard.render.com/ dan hubungkan repository GitHub kamu.
2. Pilih **New → Blueprint**, lalu pilih repository tadi. Render membaca `render.yaml` secara otomatis.
3. Saat diminta **JEREXD_API_KEY**, masukkan API key milikmu di dashboard Render. Jangan tulis key di file atau commit GitHub.
4. Buat / deploy service. Setelah statusnya **Live**, buka URL `https://...onrender.com` yang diberikan Render. Itu adalah link aplikasimu.

Konfigurasi jika membuat Web Service secara manual: runtime **Python**, build command `python --version`, start command `python jalankan_krammzlua.py`, dan environment `HOST=0.0.0.0` serta `JEREXD_API_KEY=<API key milikmu>`. Render mengisi `PORT` secara otomatis.

Paket ini memilih paket Render Free untuk pengujian. Layanan Free memiliki batasan dan dapat tertidur setelah tidak dipakai; saat dibuka lagi bisa membutuhkan waktu untuk aktif. Periksa detail dan biaya saat membuat layanan.

## Opsional: batasi akses dengan password

Kalau link dibagikan, orang yang memiliki akses bisa memakai kuota API kamu. Supaya tidak sembarang orang menggunakan chat, pada halaman service di Render tambahkan environment variable:

- `KRAMMZLUA_PASSWORD` = password yang kamu buat sendiri.
- `KRAMMZLUA_USER` = nama login pilihanmu (opsional; default `krammzlua`).

Simpan perubahan dan deploy / restart. Browser akan meminta username dan password sebelum membuka aplikasi. Gunakan HTTPS yang disediakan Render. Jangan taruh password ini di GitHub.

## Menjalankan di komputer sendiri

Pastikan Python 3 terpasang, kemudian isi API key sebagai environment variable.

macOS / Linux:

```bash
export JEREXD_API_KEY='ISI_API_KEY_MILIKMU'
python3 jalankan_krammzlua.py
```

Windows Command Prompt:

```bat
set JEREXD_API_KEY=ISI_API_KEY_MILIKMU
python jalankan_krammzlua.py
```

Buka `http://127.0.0.1:8000` dan biarkan Terminal tetap terbuka.

## Privasi

Riwayat tampilan disimpan di browser. Pesan dikirim ke penyedia API, dan sesi dapat tersimpan di server penyedia. Menghapus riwayat di aplikasi hanya menghapus riwayat dari browser tersebut.
