<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>S4-Samp - Sinkron Semua Device</title>
    <style>
        /* CSS sama seperti sebelumnya - copy dari kode sebelumnya */
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: Arial, sans-serif; background: #f8f9fa; }
        header { display: flex; justify-content: space-between; align-items: center; padding: 15px; background: white; border-bottom: 1px solid #ddd; }
        header h1 { color: #0056b3; font-weight: bold; font-size: 1.4rem; }
        nav { background: white; border-bottom: 1px solid #ddd; display: flex; gap: 20px; padding: 12px 20px; overflow-x: auto; }
        nav a { color: #333; text-decoration: none; padding: 8px 12px; border-radius: 5px; white-space: nowrap; }
        nav a.active, nav a:hover { background: #0056b3; color: white; }
        main { padding: 20px; }
        .hero { background: linear-gradient(135deg, #0056b3, #007bff); color: white; border-radius: 12px; padding: 30px; text-align: center; margin-bottom: 20px; }
        .stats { display: flex; justify-content: center; gap: 20px; margin: 20px 0; }
        .stat-box { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); width: 150px; padding: 20px; text-align: center; }
        .upload-section { max-width: 600px; margin: 0 auto; }
        .upload-section h2, .koleksi-section h2 { color: #0056b3; border-bottom: 3px solid #0056b3; padding-bottom: 10px; margin-bottom: 20px; }
        form { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 25px; }
        label { display: block; margin: 15px 0 5px 0; font-weight: bold; color: #0056b3; }
        input, select, textarea { width: 100%; padding: 12px; border: 2px solid #e1e5e9; border-radius: 8px; font-size: 1rem; }
        button[type="submit"] { background: #0056b3; color: white; border: none; padding: 15px 30px; font-size: 1.1rem; border-radius: 8px; cursor: pointer; width: 100%; margin-top: 20px; }
        .collection-list { display: grid; grid-template-columns: repeat(auto-fill, minmax(350px, 1fr)); gap: 20px; max-width: 1200px; margin: 0 auto; }
        .collection-item { background: white; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); padding: 20px; }
        .collection-item h3 { color: #0056b3; margin-bottom: 10px; }
        .collection-item img { width: 100%; height: 200px; object-fit: cover; border-radius: 8px; margin: 15px 0; }
        .download-btn { width: 100%; background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; font-size: 1rem; cursor: pointer; margin-top: 10px; text-decoration: none; display: block; text-align: center; }
        .section { display: none; }
        .section.active { display: block; }
        .status { text-align: center; padding: 10px; background: #d4edda; color: #155724; border-radius: 5px; margin: 10px 0; display: none; }
    </style>
</head>
<body>

    <header>
        <h1>🌐 S4-Samp - Sinkron Real-time</h1>
        <button onclick="location.reload()">🔄 Refresh</button>
    </header>

    <nav>
        <a href="#" onclick="showSection('home')" class="active">🏠 Home</a>
        <a href="#" onclick="showSection('koleksi')">📦 Koleksi</a>
        <a href="#" onclick="showSection('upload')">➕ Upload</a>
    </nav>

    <main>
        <div id="status" class="status">🔄 Menghubungkan ke server...</div>

        <section id="home" class="section active">
            <div class="hero">
                <h2>🎉 Selamat Datang!</h2>
                <p>Data sinkron di semua device secara real-time</p>
                <button onclick="showSection('koleksi')" style="background: rgba(255,255,255,0.2); border: 2px solid white; padding: 12px 25px; border-radius: 25px; font-size: 1.1rem; cursor: pointer; margin-top: 15px;">📦 Lihat Koleksi</button>
            </div>
            <div class="stats">
                <div class="stat-box">
                    <h3 id="totalScript">0</h3>
                    <p>💻 PC Script</p>
                </div>
                <div class="stat-box">
                    <h3 id="totalModloader">0</h3>
                    <p>📱 Mobile</p>
                </div>
            </div>
        </section>

        <section id="koleksi" class="section">
            <h2>📦 Koleksi Mod Terbaru</h2>
            <div class="collection-list" id="collectionList"></div>
        </section>

        <section id="upload" class="section">
            <div class="upload-section">
                <h2>➕ Upload Mod Baru</h2>
                <form id="uploadForm">
                    <label>📝 Nama Mod</label>
                    <input type="text" id="namaMod" required>
                    
                    <label>🔢 Versi</label>
                    <input type="text" id="versiMod" required>
                    
                    <label>📄 Deskripsi</label>
                    <textarea id="deskripsiMod"></textarea>
                    
                    <label>👤 Author</label>
                    <input type="text" id="authorMod" required>
                    
                    <label>📱 Perangkat</label>
                    <select id="perangkatMod">
                        <option value="PC">PC</option>
                        <option value="Mobile">Mobile</option>
                    </select>
                    
                    <label>🔗 Link Download</label>
                    <input type="url" id="linkDownload" required>
                    
                    <label>🖼️ Preview (Opsional)</label>
                    <input type="file" id="uploadGambar" accept="image/*">
                    
                    <button type="submit">🚀 Upload Mod</button>
                </form>
            </div>
        </section>
    </main>

    <!-- FIREBASE SDK -->
    <script type="module">
        import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js';
        import { getDatabase, ref, push, onValue, get } from 'https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js';

        // 🔥 GANTI DENGAN CONFIG FIREBASE ANDA
        const firebaseConfig = {
            // PASTE CONFIG ANDA DI SINI
            apiKey: "YOUR_API_KEY",
            authDomain: "YOUR_PROJECT.firebaseapp.com",
            databaseURL: "https://YOUR_PROJECT-default-rtdb.asia-southeast1.firebasedatabase.app/",
            projectId: "YOUR_PROJECT_ID",
            storageBucket: "YOUR_PROJECT.appspot.com",
            messagingSenderId: "123456789",
            appId: "YOUR_APP_ID"
        };

        // Initialize Firebase
        const app = initializeApp(firebaseConfig);
        const db = getDatabase(app);
        const modsRef = ref(db, 'mods');

        let mods = [];

        // Sinkron real-time
        onValue(modsRef, (snapshot) => {
            const data = snapshot.val();
            mods = data ? Object.values(data) : [];
            renderMods();
            document.getElementById('status').style.display = 'none';
        });

        function renderMods() {
            const list = document.getElementById('collectionList');
            const totalScriptEl = document.getElementById('totalScript');
            const totalModloaderEl = document.getElementById('totalModloader');

            list.innerHTML = '';

            let countPC = 0, countMobile = 0;

            mods.forEach(mod => {
                const item = document.createElement('div');
                item.className = 'collection-item';

                if (mod.perangkatMod === 'PC') countPC++;
                else countMobile++;

                item.innerHTML = `
                    <small class="version">v${mod.versiMod}</small>
                    <h3>${mod.namaMod}</h3>
                    <p>${mod.deskripsiMod || 'Tidak ada deskripsi'}</p>
                    <p><strong>👤 ${mod.authorMod}</strong></p>
                    ${mod.gambarPreview ? `<img src="${mod.gambarPreview}" alt="Preview">` : ''}
                    <a href="${mod.linkDownload}" target="_blank" class="download-btn">⬇️ Download</a>
                `;
                list.appendChild(item);
            });

            totalScriptEl.textContent = countPC;
            totalModloaderEl.textContent = countMobile;
        }

        // Upload mod
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
            e.preventDefault();

            const modData = {
                namaMod: document.getElementById('namaMod').value,
                versiMod: document.getElementById('versiMod').value,
                deskripsiMod: document.getElementById('deskripsiMod').value,
                authorMod: document.getElementById('authorMod').value,
                perangkatMod: document.getElementById('perangkatMod').value,
                linkDownload: document.getElementById('linkDownload').value,
                timestamp: Date.now()
            };

            // Gambar preview
            const file = document.getElementById('uploadGambar').files[0];
            if (file) {
                const reader = new FileReader();
                reader.onload = async () => {
                    modData.gambarPreview = reader.result;
                    await push(modsRef, modData);
                    alert('✅ Mod di-upload dan sinkron ke semua device!');
                    e.target.reset();
                };
                reader.readAsDataURL(file);
            } else {
                await push(modsRef, modData);
                alert('✅ Mod di-upload dan sinkron ke semua device!');
                e.target.reset();
            }
        });

        // Navigasi
        function showSection(id) {
            document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
            document.getElementById(id).classList.add('active');
            document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
            event.target.classList.add('active');
        }
    </script>
</body>
</html>
