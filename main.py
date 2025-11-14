import warnings
import pandas as pd
import joblib
from typing import Optional, Dict, Any, List, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

warnings.filterwarnings('ignore')

try:
    model = joblib.load('model/model_kmeans_final.joblib')
    scaler = joblib.load('model/scaler_data_final.joblib')
except FileNotFoundError as e:
    print(f"Error: File model/scaler tidak ditemukan. {e}")
    raise SystemExit("Gagal memuat model atau scaler. Pastikan file ada di folder 'model/'.")

CLUSTER_MAP = {
    2: "Fast Learner",
    0: "Reflective Learner",
    1: "Consistent Learner" 
}

FEATURE_COLUMNS_TOTAL = [
    'total_materi_selesai',
    'avg_durasi_materi_detik',
    'total_review',
    'total_hari_aktif',
    'std_dev_materi_harian',
    'avg_skor_kuis',
    'pass_rate_kuis',
    'total_kuis_diambil',
    'avg_rating_submission',
    'total_submissions'
]

data_storage: Dict[str, pd.DataFrame] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: Memuat data fitur yang sudah diproses (data_clean_all_users.csv)...")
    try:
        features_df = pd.read_csv("data/data_clean_all_users.csv")
        
        if 'user_id' not in features_df.columns or 'name' not in features_df.columns:
            raise ValueError("CSV harus memiliki kolom 'user_id' dan 'name'.")
        
        missing_cols = [col for col in FEATURE_COLUMNS_TOTAL if col not in features_df.columns]
        if missing_cols:
            raise ValueError(f"Kolom fitur berikut tidak ada di CSV: {missing_cols}")
                
        features_df = features_df.set_index('user_id')
        
        data_storage['features'] = features_df
        
        print(f"Startup: Data {len(features_df)} user (dengan 10 fitur) berhasil dimuat.")

    except FileNotFoundError:
        print("Error Startup: File 'data/data_clean_all_users.csv' tidak ditemukan.")
        raise SystemExit("Gagal memuat data fitur.")
    except Exception as e:
        print(f"Error Startup: Gagal memproses data_clean_all_users.csv. {e}")
        raise SystemExit(f"Gagal memproses data: {e}")

    yield
    
    print("Shutdown: Membersihkan data storage...")
    data_storage.clear()

app = FastAPI(lifespan=lifespan)

class PredictionOut(BaseModel):
    user_id: int
    name: str
    learning_style: str
    cluster_id: int
    status: str

class PredictIn(BaseModel):
    student_id: int
    features: Optional[Dict[str, Any]] = None

class PredictOutData(BaseModel):
    label: str
    confidence: float
    reasons: List[Dict[str, Any]]
    user_id: int
    name: str
    cluster_id: int
    features: Dict[str, Any]

class PredictOutStatus(BaseModel):
    status: str
    data: PredictOutData

def _predict_core(user_id: int) -> Tuple[str, int, str, Dict[str, Any]]:
    try:
        user_data_series = data_storage['features'].loc[user_id]
        
    except KeyError:
        empty_features = {col: 0 for col in FEATURE_COLUMNS_TOTAL}
        return ("Not Active", -1, f"User {user_id} (Not Found)", empty_features)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Internal error saat lookup user: {e}")

    user_name = str(user_data_series['name'])
    
    fitur_user_df = user_data_series[FEATURE_COLUMNS_TOTAL].to_frame().T
    
    raw_features_dict = fitur_user_df.iloc[0].to_dict()

    if fitur_user_df['total_materi_selesai'].iloc[0] == 0:
        return ("Not Active", -1, user_name, raw_features_dict)

    try:
        fitur_scaled = scaler.transform(fitur_user_df.values)
        cluster_id = int(model.predict(fitur_scaled)[0])
        learning_style = CLUSTER_MAP.get(cluster_id, "Cluster Tidak Dikenal")
    except Exception as e:
        print(f"CRITICAL ERROR: Gagal scaling/predict. Apa model/scaler Anda dilatih pada 10 fitur?")
        print(e)
        raise HTTPException(status_code=500, detail=f"Error saat prediksi model: {e}")
        
    return (learning_style, cluster_id, user_name, raw_features_dict)

@app.get("/")
def read_root():
    return {"message": "Selamat datang di API AI Learning Insight (Versi 10 Fitur CSV)!"}

@app.post("/predict", response_model=PredictOutStatus)
async def predict_post(payload: PredictIn):
    (
        learning_style,
        cluster_id,
        user_name,
        raw_features_dict,
    ) = _predict_core(payload.student_id)

    if learning_style == "Not Active":
        data = PredictOutData(
            label="Not Active",
            confidence=0.0,
            reasons=[],
            user_id=payload.student_id,
            name=user_name,
            cluster_id=-1,
            features=raw_features_dict
        )
    else:
        reasons: List[Dict[str, Any]] = [
            {"key": "total_materi_selesai", "op": ">=", "value": 1},
        ]
        data = PredictOutData(
            label=learning_style,
            confidence=1.0, 
            reasons=reasons,
            user_id=payload.student_id,
            name=user_name,
            cluster_id=cluster_id,
            features=raw_features_dict
        )
        
    return PredictOutStatus(status="success", data=data)

@app.post("/predict/", response_model=PredictOutStatus)
async def predict_post_trailing(payload: PredictIn):
    return await predict_post(payload)

@app.get("/predict/{user_id}", response_model=PredictionOut)
async def predict_style(user_id: int):
    (
        learning_style,
        cluster_id,
        user_name,
        raw_features_dict,
    ) = _predict_core(user_id)

    if learning_style == "Not Active":
        status_msg = "Siswa belum menyelesaikan materi apapun."
        if "(Not Found)" in user_name:
             status_msg = "User ID tidak ditemukan di data."
             
        return PredictionOut(
            user_id=user_id, name=user_name,
            learning_style="Not Active", cluster_id=-1,
            status=status_msg
        )

    return PredictionOut(
        user_id=user_id, name=user_name,
        learning_style=learning_style, cluster_id=cluster_id,
        status="Prediksi berhasil."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)