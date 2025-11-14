**AI Learning Insight**
adalah platform analisis pembelajaran berbasis AI yang membantu mendeteksi gaya belajar siswa berdasarkan data perilaku mereka dalam belajar.  
Proyek ini terdiri dari tiga komponen utama:

- **Machine Learning Service (FastAPI + Python)**
- **Backend API (Express + PostgreSQL)**
- **Frontend Dashboard (React + Vite)**
--------------------------------------------------------------------------------------
## Struktur Proyek

AI-Learning-Insight/
```
|
├── ml-service/       # FastAPI model inference service
├── backend/          # Node.js RESTful API service
├── frontend/         # React dashboard app
```
--------------------------------------------------------------------------------------
## Running Program

1. Jalankan Machine Learning Service (FastAPI)
```
cd ml-service
python main.py
```
2. Jalankan Backend API (Node.js + Express)
```
cd backend
npm install
node scripts/run-sql.js
npm run dev
```
3. Jalankan Frontend (React + Vite)
```
cd frontend
npm install
npm run dev
```
--------------------------------------------------------------------------------------
## Dokumentasi API

1. openAPI.yaml

File ini merupakan **API Contract** dalam format OpenAPI (YAML).  
Berisi definisi lengkap endpoint backend, termasuk:
- `/auth/register`, `/auth/login`, `/auth/me`
- `/users/{userId}/metrics` (GET & PUT)
- `/users/{userId}/insights` (GET & POST)
Dokumen ini mencakup:
- Struktur request & response  
- Parameter path  
- Status code  
- Header Authorization (Bearer Token)  
- Contoh payload

Tujuan file:
- Menjadi acuan untuk Frontend  
- Menjaga konsistensi API Backend  
- Bisa digunakan untuk Swagger UI  

2. AI Learning Insight API (with ML).postman_collection.json

File ini adalah koleksi Postman siap pakai untuk mengetes API:
- Endpoint Auth, Metrics, Insights  
- Contoh request body  
- Contoh response  
- Header otomatis  
- Script penyimpanan token JWT setelah login  
--------------------------------------------------------------------------------------
# 📌 Catatan Penting
- Jika API berubah, **openAPI.yaml** dan **Postman Collection** harus diperbarui.  
- Dokumentasi ini sangat penting untuk integrasi FE–BE–ML.


