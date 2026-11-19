#!/usr/bin/env python3
"""Server pendamping Krammzlua. Hanya memakai Python 3 standar.

Kunci API dibaca dari environment variable JEREXD_API_KEY, bukan dari kode.
Opsional: KRAMMZLUA_PASSWORD mengaktifkan login HTTP Basic untuk melindungi kuota.
"""

import base64
import binascii
import hmac
import json
import os
import re
import socket
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.parse import urlsplit
from urllib.request import Request, urlopen

API_URL = "https://api.jerexd.my.id/api/ai/aichat"
API_KEY = os.environ.get("JEREXD_API_KEY", "").strip()
LOGIN_USER = os.environ.get("KRAMMZLUA_USER", "krammzlua")
LOGIN_PASSWORD = os.environ.get("KRAMMZLUA_PASSWORD", "")
HTML_FILE = Path(__file__).resolve().with_name("krammzlua.html")
HOST = os.environ.get("HOST", "127.0.0.1")
PORT = int(os.environ.get("PORT", "8000"))
MAX_REQUEST_BYTES = 64 * 1024
MAX_REMOTE_BYTES = 2 * 1024 * 1024
MODEL_PATTERN = re.compile(r"^[a-zA-Z0-9._/-]{1,120}$")
SESSION_PATTERN = re.compile(r"^krammz_[a-zA-Z0-9_-]{1,110}$")

PERSONA = (
    "Kamu adalah asisten di aplikasi bernama Krammzlua. "
    "Gunakan nama tampilan Krammzlua saat memperkenalkan diri. "
    "Jika ditanya model dasarmu, jawab dengan jujur sesuai model yang digunakan. "
    "Jawab pesan pengguna dengan ramah, sopan, dan menggunakan bahasa pengguna.\n\n"
    "Pesan pengguna:\n"
)


class RemoteProblem(Exception):
    pass


def request_api(payload):
    """Kirim JSON dari server, bukan dari browser, agar CORS tidak menghalangi."""
    if not API_KEY:
        raise RemoteProblem("JEREXD_API_KEY belum diatur di environment server.")
    payload = dict(payload)
    payload["apikey"] = API_KEY
    request = Request(
        API_URL,
        data=json.dumps(payload, ensure_ascii=False).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urlopen(request, timeout=90) as response:
            raw = response.read(MAX_REMOTE_BYTES + 1)
        if len(raw) > MAX_REMOTE_BYTES:
            raise RemoteProblem("Balasan API terlalu besar.")
        result = json.loads(raw.decode("utf-8"))
        if not isinstance(result, dict):
            raise ValueError("Invalid response")
        return result
    except HTTPError as exc:
        if exc.code in (401, 403):
            message = "API menolak akses. Periksa API key di environment server."
        elif exc.code == 429:
            message = "Batas permintaan API tercapai. Tunggu sebentar lalu coba lagi."
        elif exc.code >= 500:
            message = f"Server API sedang bermasalah (HTTP {exc.code}). Coba lagi."
        else:
            message = f"Permintaan ditolak oleh API (HTTP {exc.code})."
        raise RemoteProblem(message) from None
    except (URLError, TimeoutError, socket.timeout, OSError):
        raise RemoteProblem("Tidak dapat menghubungi API. Periksa koneksi internet atau coba lagi.") from None
    except (ValueError, UnicodeDecodeError, json.JSONDecodeError):
        raise RemoteProblem("Format balasan dari API tidak dapat dibaca.") from None


class Handler(BaseHTTPRequestHandler):
    server_version = "Krammzlua"
    sys_version = ""

    def log_message(self, _format, *args):
        # Jangan mencatat isi percakapan atau API key.
        return

    def send_bytes(self, status, content_type, body):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.send_header("Referrer-Policy", "no-referrer")
        if content_type.startswith("text/html"):
            self.send_header(
                "Content-Security-Policy",
                "default-src 'self'; script-src 'self' 'unsafe-inline'; "
                "style-src 'self' 'unsafe-inline'; img-src 'self' data:; "
                "connect-src 'self'; base-uri 'none'; form-action 'self'",
            )
        self.end_headers()
        try:
            self.wfile.write(body)
        except (BrokenPipeError, ConnectionResetError):
            pass

    def send_json(self, status, data):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_bytes(status, "application/json; charset=utf-8", body)

    def require_login(self):
        # Opsional: ketika password diatur, lindungi halaman dan endpoint API.
        if not LOGIN_PASSWORD:
            return True
        authorization = self.headers.get("Authorization", "")
        try:
            scheme, encoded = authorization.split(" ", 1)
            supplied = base64.b64decode(encoded, validate=True)
            expected = (LOGIN_USER + ":" + LOGIN_PASSWORD).encode("utf-8")
            if scheme.lower() == "basic" and hmac.compare_digest(supplied, expected):
                return True
        except (ValueError, binascii.Error):
            pass
        body = "Login diperlukan untuk membuka Krammzlua.".encode("utf-8")
        self.send_response(401)
        self.send_header("WWW-Authenticate", 'Basic realm="Krammzlua", charset="UTF-8"')
        self.send_header("Content-Type", "text/plain; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)
        return False

    def same_origin(self):
        origin = self.headers.get("Origin")
        if not origin:
            return True  # Misalnya curl yang dijalankan secara lokal.
        if origin == "null":
            return False
        parsed = urlsplit(origin)
        forwarded = self.headers.get("X-Forwarded-Host", "").split(",")[0].strip()
        allowed_hosts = {self.headers.get("Host", ""), forwarded}
        return parsed.scheme in {"http", "https"} and parsed.netloc in allowed_hosts

    def do_GET(self):
        if not self.require_login():
            return
        path = urlsplit(self.path).path
        if path in ("/", "/krammzlua.html"):
            try:
                body = HTML_FILE.read_bytes()
            except OSError:
                self.send_json(500, {"status": False, "message": "File krammzlua.html tidak ditemukan di folder yang sama."})
                return
            self.send_bytes(200, "text/html; charset=utf-8", body)
        elif path == "/api/models":
            try:
                data = request_api({"prompt": "Hako", "model": "list"})
                models = data.get("models")
                if not isinstance(models, list):
                    raise RemoteProblem("Daftar model tidak tersedia dari API.")
                models = [m for m in models if isinstance(m, str) and MODEL_PATTERN.fullmatch(m)]
                if not models:
                    raise RemoteProblem("Daftar model tidak tersedia dari API.")
                self.send_json(200, {"status": True, "models": models})
            except RemoteProblem as exc:
                self.send_json(502, {"status": False, "message": str(exc)})
        elif path == "/api/health":
            self.send_json(200, {"status": True, "service": "krammzlua"})
        else:
            self.send_json(404, {"status": False, "message": "Halaman tidak ditemukan."})

    def do_POST(self):
        if not self.require_login():
            return
        if urlsplit(self.path).path != "/api/chat":
            self.send_json(404, {"status": False, "message": "Endpoint tidak ditemukan."})
            return
        if not self.same_origin():
            self.send_json(403, {"status": False, "message": "Asal permintaan tidak diizinkan."})
            return
        if self.headers.get("Content-Type", "").split(";", 1)[0].strip().lower() != "application/json":
            self.send_json(415, {"status": False, "message": "Permintaan harus menggunakan JSON."})
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_REQUEST_BYTES:
            self.send_json(413, {"status": False, "message": "Ukuran pesan tidak valid atau terlalu besar."})
            return
        try:
            incoming = json.loads(self.rfile.read(length).decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self.send_json(400, {"status": False, "message": "Permintaan JSON tidak valid."})
            return
        if not isinstance(incoming, dict):
            self.send_json(400, {"status": False, "message": "Permintaan JSON tidak valid."})
            return
        prompt = incoming.get("prompt")
        model = incoming.get("model")
        session_id = incoming.get("session_id")
        if not isinstance(prompt, str) or not prompt.strip() or len(prompt) > 6000:
            self.send_json(400, {"status": False, "message": "Pesan harus berisi 1–6.000 karakter."})
            return
        if not isinstance(model, str) or not MODEL_PATTERN.fullmatch(model) or model == "list":
            self.send_json(400, {"status": False, "message": "Model tidak valid. Pilih model yang tersedia."})
            return
        if not isinstance(session_id, str) or not SESSION_PATTERN.fullmatch(session_id):
            self.send_json(400, {"status": False, "message": "Sesi chat tidak valid. Buat chat baru lalu coba lagi."})
            return
        try:
            data = request_api({
                "prompt": PERSONA + prompt.strip(),
                "model": model,
                "session_id": session_id,
            })
            if data.get("status") is not True or not isinstance(data.get("result"), str):
                message = data.get("message")
                if not isinstance(message, str) or not message.strip():
                    message = "API belum dapat menjawab. Coba lagi atau pilih model lain."
                self.send_json(502, {"status": False, "message": message[:500]})
                return
            self.send_json(200, {
                "status": True,
                "result": data["result"],
                "model": data.get("model") if isinstance(data.get("model"), str) else model,
            })
        except RemoteProblem as exc:
            self.send_json(502, {"status": False, "message": str(exc)})


def main():
    if not HTML_FILE.exists():
        raise SystemExit("File krammzlua.html harus berada di folder yang sama dengan server ini.")
    try:
        server = ThreadingHTTPServer((HOST, PORT), Handler)
    except OSError as exc:
        raise SystemExit(f"Server tidak bisa dimulai: {exc}") from exc
    print("\nKrammzlua siap!")
    if not API_KEY:
        print("PERINGATAN: isi environment JEREXD_API_KEY sebelum memakai chat.")
    if HOST == "0.0.0.0" and not LOGIN_PASSWORD:
        print("PERINGATAN: link dapat digunakan siapa saja. Atur KRAMMZLUA_PASSWORD untuk membatasi akses.")
    print(f"Port: {PORT} (untuk lokal: http://127.0.0.1:{PORT})")
    print("Biarkan terminal tetap terbuka. Tekan Ctrl+C untuk berhenti.\n", flush=True)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nServer dihentikan.")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
