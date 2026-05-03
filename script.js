document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("uploadForm");
  const collectionList = document.getElementById("collectionList");
  const totalScript = document.getElementById("totalScript");
  const totalModloader = document.getElementById("totalModloader");

  // Fungsi untuk ambil data dari localStorage (array mod)
  function getMods() {
    const mods = localStorage.getItem("mods");
    return mods ? JSON.parse(mods) : [];
  }

  // Fungsi untuk simpan data mod ke localStorage
  function saveMods(mods) {
    localStorage.setItem("mods", JSON.stringify(mods));
  }

  // Update tampilan list koleksi
  function renderMods() {
    const mods = getMods();

    collectionList.innerHTML = ""; // Clear dulu

    // Hitung total script dan modloader
    let countScript = 0;
    let countModloader = 0;

    mods.forEach((mod, index) => {
      const item = document.createElement("div");
      item.className = "collection-item";

      // Hitung jumlah script atau modloader berdasarkan kategori (perangkat atau aktivasi)
      if (mod.perangkatMod.toLowerCase() === "pc") countScript++;
      else countModloader++;

      item.innerHTML = `
        <small class="version">v${mod.versiMod}</small>
        <h3>${mod.namaMod}</h3>
        <p>${mod.deskripsiMod}</p>
        <p><strong>Author:</strong> ${mod.authorMod}</p>
        <img src="${mod.gambarPreview || ''}" alt="Preview Gambar" style="max-width:100%;border-radius:8px;margin:10px 0;" />
        <a href="${mod.linkDownload}" target="_blank" style="color:#0056b3;text-decoration: underline;">Link Download</a>
        <button onclick="alert('Detail mod ${mod.namaMod}');" style="margin-top:8px;width: 100%;">Lihat Detail</button>
      `;

      collectionList.appendChild(item);
    });

    totalScript.textContent = countScript;
    totalModloader.textContent = countModloader;
  }

  // Convert file gambar ke base64
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  // Handle submit form upload mod
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const namaMod = form.namaMod.value.trim();
    const versiMod = form.versiMod.value.trim();
    const deskripsiMod = form.deskripsiMod.value.trim();
    const aktivasiMod = form.aktivasiMod.value;
    const authorMod = form.authorMod.value.trim();
    const perangkatMod = form.perangkatMod.value;
    const linkDownload = form.linkDownload.value.trim();
    const fileGambar = form.uploadGambar.files[0];

    let gambarPreview = "";

    if (fileGambar) {
      if (fileGambar.size > 8 * 1024 * 1024) {
        alert("Ukuran gambar maksimal 8MB!");
        return;
      }
      try {
        gambarPreview = await fileToBase64(fileGambar);
      } catch (err) {
        alert("Gagal memuat gambar.");
        return;
      }
    }

    // Buat objek mod baru
    const newMod = {
      namaMod,
      versiMod,
      deskripsiMod,
      aktivasiMod,
      authorMod,
      perangkatMod,
      linkDownload,
      gambarPreview
    };

    // Simpan ke localStorage
    const mods = getMods();
    mods.push(newMod);
    saveMods(mods);

    alert("Mod berhasil dikirim dan disimpan!");

    form.reset();
    renderMods();
    // otomatis ke halaman koleksi
    document.getElementById("navKoleksi").click();
  });

  // Render mod saat halaman dimuat
  renderMods();
});
