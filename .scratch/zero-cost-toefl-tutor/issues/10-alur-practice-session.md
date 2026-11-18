# Alur Practice Session dan Speaking Task

Type: prototype
Status: resolved
Blocked by: 09, 14

## Question

Seperti apa alur satu Practice Session 30 menit di HP: urutan Speaking Task, kuis, dan review; layar rekam-jawab-Feedback untuk Speaking Task; dan bagaimana Feedback berbahasa Indonesia ditampilkan?

## Answer

Diputuskan lewat prototype UI 2026-11-18. Learner memilih **variant A "Langkah demi langkah"** dari tiga variant (A langkah demi langkah, B mode ujian, C hub harian).

Prototype: `app/prototype/practice-session/` + `components/PrototypeSwitcher.tsx` (data palsu, tanpa DB; rekaman mikrofon sungguhan, Feedback tiruan). Belum di-commit; tempatnya di branch throwaway, bukan `main`.

Yang dipilih (variant A):
- **Urutan tetap:** pembuka singkat (section terendah + alasan sesi hari ini) → Speaking → Reading → Review → ringkasan. Progress bar tiga segmen (Speaking 15', Reading 9', Review 6') di atas.
- **Satu item per layar** dengan **Feedback langsung** setelah setiap jawaban, bukan dikumpulkan di akhir.
- **Speaking:** layar persiapan (cue card + catatan opsional) → layar rekam (timer besar, tombol Rekam/Stop, putar ulang rekaman) → Feedback.
- **Feedback Speaking (bahasa Indonesia):** kartu perkiraan band berupa rentang (±1, dengan alasan singkat); satu kartu per kriteria (FC, LR, GRA, P "belum dinilai") berisi skor dan catatan; transkrip dengan bagian salah disorot merah, diketuk untuk melihat nama Error Pattern, koreksi, dan penjelasan.
- **Reading:** teks bisa dilipat di atas soal; TFNG lewat tiga tombol; completion lewat input + Cek; benar/salah + penjelasan Error Pattern langsung.
- **Review:** drill satu per satu dengan label pattern dan nomor (1/3), Feedback langsung.
- **Ringkasan akhir:** hasil per blok, streak +1, dan fokus besok.

Tidak dipilih (Learner tidak menyebut alasan):
- **B (mode ujian):** timer per blok, navigator soal bernomor, Feedback dikumpulkan di laporan akhir. Rujukan UI-nya juga belum terverifikasi (REA gagal memuat halaman familiarisation test British Council). Bisa dipertimbangkan nanti sebagai mode simulasi terpisah.
- **C (hub harian):** kartu blok dengan urutan bebas, Feedback hanya 2 pattern teratas + ucapkan ulang.

Catatan untuk implementasi:
- Passage Section 3 (±900 kata) di HP dengan pola "teks dilipat di atas soal" belum diuji; prototype hanya memakai teks pendek Section 1.
- Mikrofon di HP butuh HTTPS (Cloudflare Tunnel sudah memberi ini di production).
