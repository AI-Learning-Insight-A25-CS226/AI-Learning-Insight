import pandas as pd
import numpy as np
import joblib
import warnings
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

# Mengabaikan peringatan (opsional)
warnings.filterwarnings('ignore')

# --- Variabel Global & Model ---
# DIPERBARUI: Path dan nama file model disesuaikan
try:
    # Path diubah ke folder 'model/' dan nama file ke '_final'
    model = joblib.load('model/model_kmeans_final.joblib')
    scaler = joblib.load('model/scaler_data_final.joblib')
except FileNotFoundError:
    print("FATAL ERROR: File model ('model/model_kmeans_final.joblib') tidak ditemukan.")
    print("Pastikan file model sudah ada di dalam folder 'model'.")
    exit()

# Hard-code mapping cluster dan urutan fitur
# (Harus SAMA PERSIS dengan output script training v2)
CLUSTER_MAP = {
    2: "Fast Learner",
    0: "Reflective Learner",
    1: "Consistent Learner" 
}

# Daftar 18 fitur dari Model v2 Anda
FEATURE_COLUMNS_TOTAL = [
    'total_materi_selesai', 'avg_durasi_materi_detik', 'total_review',
    'total_hari_aktif', 'std_dev_materi_harian', 'avg_skor_kuis',
    'pass_rate_kuis', 'total_kuis_diambil', 'avg_rating_submission',
    'total_submissions', 'avg_durasi_article', 'avg_durasi_exam',
    'avg_durasi_interactivecode', 'avg_durasi_quiz', 'count_article',
    'count_exam', 'count_interactivecode', 'count_quiz'
]

# --- Fungsi untuk Memuat Data (Startup) ---
data_storage = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Server startup: Memuat semua dataset Excel ke memori...")
    try:
        # DIPERBARUI: Semua path file diubah ke folder 'data/'
        data_storage['users'] = pd.read_excel("data/users.xlsx")
        data_storage['trackings'] = pd.read_excel("data/developer_journey_trackings.xlsx")
        data_storage['registrations'] = pd.read_excel("data/exam_registrations.xlsx")
        data_storage['results'] = pd.read_excel("data/exam_results.xlsx")
        data_storage['submissions'] = pd.read_excel("data/developer_journey_submissions.xlsx")
        data_storage['tutorials'] = pd.read_excel("data/developer_journey_tutorials.xlsx", usecols=['id', 'type'])
        
        # Pre-process 'trackings' sekali saja untuk efisiensi
        data_storage['trackings']['first_opened_at'] = pd.to_datetime(data_storage['trackings']['first_opened_at'], errors='coerce')
        data_storage['trackings']['completed_at'] = pd.to_datetime(data_storage['trackings']['completed_at'], errors='coerce')
        data_storage['trackings']['last_viewed'] = pd.to_datetime(data_storage['trackings']['last_viewed'], errors='coerce')

        print("Dataset berhasil dimuat ke memori.")
    except FileNotFoundError as e:
        print(f"FATAL ERROR: File data tidak ditemukan: {e.filename}")
        print("Pastikan semua 6 file .xlsx ada di dalam folder 'data'.")
        exit()
    except Exception as e:
        print(f"FATAL ERROR saat memuat data: {e}")
        exit()
    
    yield
    
    print("Server shutdown.")
    data_storage.clear()


# Inisialisasi Aplikasi FastAPI
app = FastAPI(lifespan=lifespan)

# --- Model Input & Output (Validasi Data) ---
class PredictionOut(BaseModel):
    user_id: int
    name: str
    learning_style: str
    cluster_id: int
    status: str

# --- Fungsi Feature Engineering (untuk 1 user) ---
# (Tidak ada perubahan di fungsi ini, karena fungsi ini
# mengambil data dari 'data_storage' yang sudah dimuat)
def hitung_fitur_user(user_id: int):
    """
    Menghitung 18 fitur untuk SATU user.
    """
    
    # Ambil data dari 'state'
    users_df = data_storage['users']
    trackings_df = data_storage['trackings']
    registrations_df = data_storage['registrations']
    results_df = data_storage['results']
    submissions_df = data_storage['submissions']
    tutorials_df = data_storage['tutorials']

    # Cek apakah user ada
    user_data = users_df[users_df['id'] == user_id]
    if user_data.empty:
        raise HTTPException(status_code=404, detail=f"User ID {user_id} tidak ditemukan.")
    
    user_name = user_data.iloc[0]['name']

    features_df = pd.DataFrame({'user_id': [user_id]})

    # === 1. Fitur Tracking (untuk user ini) ===
    user_trackings = trackings_df[trackings_df['developer_id'] == user_id]
    if user_trackings.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name

    trackings_with_type = user_trackings.merge(
        tutorials_df, left_on='tutorial_id', right_on='id', how='left'
    )

    completed_trackings = trackings_with_type.dropna(subset=['completed_at', 'first_opened_at'])
    if completed_trackings.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name
        
    completed_trackings['durasi_belajar_detik'] = (completed_trackings['completed_at'] - completed_trackings['first_opened_at']).dt.total_seconds()
    
    valid_duration_trackings = completed_trackings[
        (completed_trackings['durasi_belajar_detik'] > 5) &
        (completed_trackings['durasi_belajar_detik'] < (3 * 24 * 60 * 60))
    ]
    
    if valid_duration_trackings.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name

    # Agregasi Fitur Lama
    features_df['total_materi_selesai'] = valid_duration_trackings.shape[0]
    features_df['avg_durasi_materi_detik'] = valid_duration_trackings['durasi_belajar_detik'].mean()
    
    review_trackings = completed_trackings[completed_trackings['last_viewed'] > completed_trackings['completed_at']]
    features_df['total_review'] = review_trackings.shape[0]
    
    daily_completions = completed_trackings.groupby(completed_trackings['completed_at'].dt.date).size().reset_index(name='materi_harian')
    features_df['total_hari_aktif'] = daily_completions.shape[0]
    features_df['std_dev_materi_harian'] = daily_completions['materi_harian'].std()

    # Agregasi Fitur Baru (per Tipe)
    duration_by_type_agg = valid_duration_trackings.groupby('type')['durasi_belajar_detik'].mean().add_prefix('avg_durasi_')
    count_by_type_agg = valid_duration_trackings.groupby('type')['id_x'].count().add_prefix('count_')
    
    features_df = pd.concat([features_df, 
                             duration_by_type_agg.to_frame().T, 
                             count_by_type_agg.to_frame().T], axis=1)

    # === 2. Fitur Exam ===
    user_registrations = registrations_df[registrations_df['examinees_id'] == user_id]
    if not user_registrations.empty:
        user_exam_data = results_df.merge(user_registrations, left_on='exam_registration_id', right_on='id')
        if not user_exam_data.empty:
            features_df['avg_skor_kuis'] = user_exam_data['score'].mean()
            features_df['pass_rate_kuis'] = user_exam_data['is_passed'].mean()
            features_df['total_kuis_diambil'] = user_exam_data.shape[0]

    # === 3. Fitur Submission ===
    user_submissions = submissions_df[submissions_df['submitter_id'] == user_id].dropna(subset=['rating'])
    if not user_submissions.empty:
        features_df['avg_rating_submission'] = user_submissions['rating'].mean()
        features_df['total_submissions'] = user_submissions.shape[0]
        
    # --- Finalisasi ---
    final_features_df = features_df.reindex(columns=FEATURE_COLUMNS_TOTAL, fill_value=0)
    
    return final_features_df, user_name

# --- Endpoint API ---

@app.get("/")
def read_root():
    return {"message": "Selamat datang di API AI Learning Insight!"}


@app.get("/predict/{user_id}", response_model=PredictionOut)
async def predict_style(user_id: int):
    """
    Mendeteksi gaya belajar untuk satu user ID.
    """
    print(f"Menerima request untuk user_id: {user_id}")
    
    # 1. Hitung Fitur
    try:
        fitur_user_df, user_name = hitung_fitur_user(user_id)
    except HTTPException as e:
        raise e # Memunculkan error 404 jika user tidak ditemukan
    except Exception as e:
        print(f"Error saat feature engineering: {e}")
        raise HTTPException(status_code=500, detail=f"Gagal memproses fitur untuk user {user_id}: {e}")

    # Cek jika user aktif (sesuai filter di training)
    if fitur_user_df['total_materi_selesai'].iloc[0] == 0:
        return PredictionOut(
            user_id=user_id,
            name=user_name,
            learning_style="Not Active",
            cluster_id=-1,
            status="Siswa belum menyelesaikan materi apapun."
        )

    # 2. Scale Fitur
    fitur_scaled = scaler.transform(fitur_user_df.values)
    
    # 3. Prediksi Cluster
    prediksi_cluster = model.predict(fitur_scaled)
    cluster_label = prediksi_cluster[0]

    # 4. Map ke Nama Style
    learning_style = CLUSTER_MAP.get(cluster_label, "Cluster Tidak Dikenal")
    
    print(f"Prediksi sukses: {learning_style} (Cluster {cluster_label})")
    
    return PredictionOut(
        user_id=user_id,
        name=user_name,
        learning_style=learning_style,
        cluster_id=int(cluster_label),
        status="Prediksi berhasil."
    )

if __name__ == "__main__":
    import uvicorn
    print("Untuk menjalankan server, gunakan perintah:")
    print("uvicorn main:app --reload")