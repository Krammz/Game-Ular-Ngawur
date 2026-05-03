class ModLoader {
    constructor() {
        this.mods = JSON.parse(localStorage.getItem('mods')) || [];
        this.init();
    }

    init() {
        this.bindEvents();
        this.updateStats();
        this.loadMods();
        this.showPage('home');
    }

    bindEvents() {
        // Menu toggle
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('mobileMenu').classList.toggle('active');
        });

        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const page = link.dataset.page;
                this.showPage(page);
                document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
                link.classList.add('active');
                document.getElementById('mobileMenu').classList.remove('active');
            });
        });

        // Explore button
        document.getElementById('exploreBtn').addEventListener('click', () => {
            this.showPage('collection');
        });

        // Upload
        const uploadArea = document.getElementById('uploadArea');
        const fileInput = document.getElementById('fileInput');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', this.handleDragOver);
        uploadArea.addEventListener('drop', (e) => this.handleDrop(e, fileInput));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        document.getElementById('uploadBtn').addEventListener('click', () => {
            fileInput.click();
        });

        // Modal
        document.querySelector('.close').addEventListener('click', () => {
            document.getElementById('downloadModal').style.display = 'none';
        });

        window.addEventListener('click', (e) => {
            const modal = document.getElementById('downloadModal');
            if (e.target === modal) {
                modal.style.display = 'none';
            }
        });
    }

    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.style.background = '#e8f4f8';
    }

    handleDrop(e, fileInput) {
        e.preventDefault();
        e.currentTarget.style.background = '#f8f8f8';
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            fileInput.files = files;
            this.handleFileSelect({ target: { files } });
        }
    }

    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file && file.name.endsWith('.lua')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.addMod(file.name, e.target.result);
            };
            reader.readAsText(file);
        } else {
            document.getElementById('uploadStatus').textContent = 'Hanya file .lua yang diperbolehkan!';
            document.getElementById('uploadStatus').style.color = '#ff4444';
        }
    }

    addMod(name, content) {
        const mod = {
            id: Date.now(),
            name: name,
            content: content,
            date: new Date().toLocaleDateString('id-ID')
        };

        this.mods.unshift(mod);
        localStorage.setItem('mods', JSON.stringify(this.mods));
        this.updateStats();
        this.loadMods();
        document.getElementById('uploadStatus').textContent = 'Mod berhasil diupload!';
        document.getElementById('uploadStatus').style.color = '#00aa00';
        
        // Reset input
        document.getElementById('fileInput').value = '';
        setTimeout(() => {
            document.getElementById('uploadStatus').textContent = '';
        }, 3000);
    }

    updateStats() {
        document.getElementById('totalScripts').textContent = this.mods.length;
        document.getElementById('totalModloader').textContent = this.mods.length;
    }

    loadMods() {
        const container = document.getElementById('modsList');
        container.innerHTML = '';

        this.mods.forEach(mod => {
            const card = document.createElement('div');
            card.className = 'mod-card';
            card.innerHTML = `
                <div class="mod-name">${mod.name}</div>
                <div class="mod-date">Diunggah: ${mod.date}</div>
                <div class="mod-preview">${this.getPreview(mod.content)}</div>
            `;
            card.addEventListener('click', () => this.showDownloadModal(mod));
            container.appendChild(card);
        });
    }

    getPreview(content) {
        const lines = content.split('\n').slice(0, 8);
        return lines.join('\n').substring(0, 200) + (content.length > 200 ? '...' : '');
    }

    showDownloadModal(mod) {
        document.getElementById('modalContent').innerHTML = `
            <h4>${mod.name}</h4>
            <pre>${mod.content}</pre>
        `;
        const downloadLink = document.getElementById('downloadLink');
        const blob = new Blob([mod.content], { type: 'text/plain' });
        downloadLink.href = URL.createObjectURL(blob);
        downloadLink.download = mod.name;
        document.getElementById('downloadModal').style.display = 'block';
    }

    showPage(pageName) {
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });
        document.getElementById(pageName).classList.add('active');
    }
}

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    new ModLoader();
});
