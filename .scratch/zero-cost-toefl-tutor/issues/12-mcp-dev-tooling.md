# MCP dan tooling untuk pengembangan

Type: grilling
Status: resolved
Blocked by: 08

## Question

Selain Context7 (sudah terpasang), MCP apa yang dipasang untuk mengembangkan sistem ini (mis. Upstash, Postgres/DB, Cloudflare, n8n), di level user atau proyek, dan untuk apa REA dipakai secara konkret?

## Answer

Diputuskan lewat grilling 2026-11-18. Kondisi saat itu: semua MCP terpasang di level user (`rea`, `figcraft`, `moho`, `context7`, `upstash`, `n8n`); proyek tidak punya `.mcp.json`.

- **Level proyek:** tidak ada MCP; `.mcp.json` tidak dibuat.
- **Context7:** tetap, untuk dokumentasi library.
- **n8n MCP:** tetap di level user dengan URL `http://localhost:5678/mcp-server/http`, jadi hanya jalan saat tunnel `ssh -N -L 5678:localhost:5678 oracle-n8n` terbuka. Dipakai untuk membuat/mengubah workflow trigger `POST /api/jobs/generate`. Tanpa tunnel, cukup copas JSON. Lewat `n8n.saepulmalik.my.id` ditolak: perlu service token Access dan membuka jalan masuk baru ke n8n.
- **Database:** tanpa MCP Postgres/Prisma. Pakai `psql` lewat Bash (container lokal) dan `ssh oracle-n8n … psql` (VPS), plus Prisma CLI. MCP yang menyimpan password production di level user = risiko tanpa manfaat berarti.
- **Cloudflare:** tanpa MCP. Route tunnel dan app Access untuk `tutor.saepulmalik.my.id` dibuat dengan memperluas `scripts/setup-domain.sh` di repo `n8n-automation-infra`. Backup ke R2 lewat rclone (ticket arsitektur).
- **Cek UI:** tanpa MCP browser. Pakai built-in browser atau Claude in Chrome lewat skill `run`. Test e2e otomatis ikut strategi test (masih "Not yet specified").
- **REA:** hanya untuk mengamati UI familiarisation test IELTS computer-delivered di ielts.org (timer, navigasi soal, cara menjawab TFNG dan completion berbatas kata, highlight) dan alur Cambridge Speak & Improve, sebagai rujukan prototype alur Practice Session. Hanya mengamati; tidak menyalin aset atau teks, dan tidak masuk bank soal. Dijalankan di awal ticket alur Practice Session.
- **Upstash:** dibiarkan di level user (mungkin dipakai proyek lain); tidak dipakai english-tutor.
