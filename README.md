# AI Learning Insight (ML)

Repositori ini berisi API Machine Learning untuk proyek AI Learning Insight.

Tugas API ini adalah menerima **User ID** dan memprediksi **Learning Style** siswa (Fast Learner, Reflective Learner, Consistent Learner) menggunakan arsitektur **CSV**.

### 🚀 Instalasi
```bash
# Buat virtual environment
python -m venv venv

# Aktifkan (Windows PowerShell)
.\venv\Scripts\Activate

# Instal dependensi
pip install "fastapi[all]" pandas scikit-learn
```
### ⚡ Menjalankan Server
```
uvicorn main:app --reload --port 8001
