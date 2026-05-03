// script.js - IndexedDB + localStorage Hybrid (PASTI JALAN!)
class S4ModStorage {
    constructor() {
        this.dbName = 'S4SampDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
    }

    initDB() {
        const request = indexedDB.open(this.dbName, this.dbVersion);
        
        request.onerror = () => console.error('IndexedDB error');
        request.onsuccess = () => {
            this.db = request.result;
            this.loadMods();
        };
        
        request.onupgradeneeded = (e) => {
            this.db = e.target.result;
            if (!this.db.objectStoreNames.contains('mods')) {
                this.db.createObjectStore('mods', { keyPath: 'id', autoIncrement: true });
            }
        };
    }

    async saveMod(modData) {
        const tx = this.db.transaction(['mods'], 'readwrite');
        const store = tx.objectStore('mods');
        modData.timestamp = Date.now();
        modData.id = Date.now();
        await store.add(modData);
        this.loadMods();
    }

    async loadMods() {
        const tx = this.db.transaction(['mods'], 'readonly');
        const store = tx.objectStore('mods');
        const allMods = await store.getAll();
        
        // Backup ke localStorage (sync antar tab)
        localStorage.setItem('s4mods_backup', JSON.stringify(allMods));
        
        window.mods = allMods.reverse(); // Terbaru di atas
        renderMods();
    }

    async deleteMod(id) {
        const tx = this.db.transaction(['mods'], 'readwrite');
        const store = tx.objectStore('mods');
        await store.delete(id);
        this.loadMods();
    }

    exportData() {
        const dataStr = JSON.stringify(window.mods, null, 2);
        const dataBlob = new Blob([dataStr], {type: 'application/json'});
        const url = URL.createObjectURL(dataBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 's4samp-mods-backup.json';
        link.click();
    }

    importData(file) {
        const reader = new FileReader();
        reader.onload = async (e) => {
            const importedMods = JSON.parse(e.target.result);
            const tx = this.db.transaction(['mods'], 'readwrite');
            const store = tx.objectStore('mods');
            
            for (let mod of importedMods) {
                await store.add(mod);
            }
            this.loadMods();
            alert('✅ Data berhasil di-import!');
        };
        reader.readAsText(file);
    }
}

// Inisialisasi
const storage = new S4ModStorage();

// Render mods ke UI
function renderMods() {
    const list = document.getElementById('collectionList');
    const totalScriptEl = document.getElementById('totalScript');
    const totalModloaderEl = document.getElementById('totalModloader');

    if (!window.mods) return;

    list.innerHTML = '';

    let countPC = 0, countMobile = 0;

    window.mods.forEach(mod => {
        const item = document.createElement('div');
        item.className = 'collection-item';
        
        if (mod.perangkatMod === 'PC') countPC++;
        else countMobile++;

        item.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <small class="version">v${mod.versiMod}</small>
                <button onclick="storage.deleteMod(${mod.id})" style="background: #dc3545; color: white; border: none; padding: 5px 10px; border-radius: 5px; cursor: pointer;">🗑️</button>
            </div>
            <h3>${mod.namaMod}</h3>
            <p>${mod.deskripsiMod || 'Tidak ada deskripsi'}</p>
            <p><strong>👤 ${mod.authorMod}</strong> | 📱 ${mod.perangkatMod}</p>
            ${mod.gambarPreview ? `<img src="${mod.gambarPreview}" alt="Preview" style="width:100%; border-radius: 8px; margin: 10px 0;">` : ''}
            <a href="${mod.linkDownload}" target="_blank" class="download-btn">⬇️ Download Mod</a>
        `;
        list.appendChild(item);
    });

    totalScriptEl.textContent = countPC;
    totalModloaderEl.textContent = countMobile;
}

// Upload form
document.getElementById('uploadForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const modData = {
        namaMod: document.getElementById('namaMod').value,
        versiMod: document.getElementById('versiMod').value,
        deskripsiMod: document.getElementById('deskripsiMod').value,
        authorMod: document.getElementById('authorMod').value,
        perangkatMod: document.getElementById('perangkatMod').value,
        linkDownload: document.getElementById('linkDownload').value
    };

    const file = document.getElementById('uploadGambar').files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = () => {
            modData.gambarPreview = reader.result;
            storage.saveMod(modData);
            e.target.reset();
            alert('✅ Mod tersimpan!');
            showSection('koleksi');
        };
        reader.readAsDataURL(file);
    } else {
        storage.saveMod(modData);
        e.target.reset();
        alert('✅ Mod tersimpan!');
        showSection('koleksi');
    }
});

// Load backup dari localStorage saat pertama kali
window.addEventListener('load', () => {
    const backup = localStorage.getItem('s4mods_backup');
    if (backup && window.mods?.length === 0) {
        window.mods = JSON.parse(backup);
        renderMods();
    }
});

// Export/Import buttons (tambahkan di HTML)
function exportMods() {
    storage.exportData();
}

function importMods(file) {
    storage.importData(file);
}

// Navigasi (sama seperti sebelumnya)
function showSection(id) {
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
    event?.target?.classList.add('active');
    if (id === 'koleksi') renderMods();
}
