# PWA, pengingat harian, dan observabilitas

Type: grilling
Status: resolved
Blocked by: 

## Question

Putuskan: PWA installable dan perilaku offline (quiz cepat offline?), pengingat latihan harian (web push, atau n8n kirim Telegram/email), dan observabilitas (log error, uptime, notifikasi kalau nightly job gagal). Pilih yang berbiaya nol dan memakai stack yang ada (n8n, Cloudflare).

## Answer

Diputuskan 2026-11-20 (usulan worker, dikonfirmasi Learner).

**Kondisi sekarang:** belum ada manifest, service worker, atau ikon PWA. Error hanya `console.error` ke log container. Respons JSON nightly job (dipicu n8n 03:00 WIB) tidak dibaca siapa pun. VPS A1 2 OCPU / 12 GB dipakai bersama Next.js, Postgres, n8n, TTS Listening, dan fallback pronunciation.

- **PWA installable:** manifest + ikon + service worker minimal (aset statis dan shell). Diuji dulu apakah Cloudflare Access memblokir pengambilan manifest; coba `crossorigin="use-credentials"`, dan **hanya kalau install tetap gagal**, bypass Access khusus manifest dan ikon (tanpa data pribadi).
- **Offline:** hanya Quick Quiz ([ticket 06](06-quiz-cepat.md)): service worker menyimpan 1 quiz berikutnya (10 soal + kunci + penjelasan); jawaban disimpan di IndexedDB dan dikirim sekali saat online. Fitur lain butuh koneksi.
- **Pengingat harian:** n8n mengirim pesan Telegram (bot pribadi) pukul 19:00 WIB **hanya kalau** sesi hari itu belum selesai, lewat endpoint status internal dengan secret job. Tanpa web push dan email.
- **Notifikasi job:** workflow nightly n8n memeriksa respons: HTTP gagal, jenis konten masih di bawah target, atau set Section 3 gagal ([ticket 07](07-tipe-soal-gt.md)) → ringkasan ke Telegram; sukses penuh: diam. n8n Error Trigger untuk workflow yang crash.
- **Uptime:** hanya dari n8n: tiap 15 menit memanggil `http://app:3000/api/health` (app + DB) lewat jaringan Docker internal; 2 kali gagal berturut-turut → Telegram. Tanpa pengecek eksternal; ditambah UptimeRobot hanya kalau tunnel pernah mati tanpa ketahuan.
- **Log error:** `docker logs` + tabel kecil `AppError` (waktu, tempat, pesan) dari route/server action yang gagal, dihapus > 30 hari; jumlah error 24 jam ikut ringkasan Telegram bila > 0. Tanpa Sentry atau akun baru.
- **Kapasitas VPS (2 OCPU):** nightly job, TTS Listening, dan fallback pronunciation berjalan berurutan dalam satu antrean, bukan paralel; job mencatat durasi per langkah, dan Telegram memberi peringatan bila total > 60 menit atau masih jalan pukul 06:00 WIB.
