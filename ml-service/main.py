import warnings
warnings.filterwarnings('ignore')

import pandas as pd
import joblib
from typing import Optional, Dict, Any, List, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

try:
    model = joblib.load('model/model_kmeans_final.joblib')
    scaler = joblib.load('model/scaler_data_final.joblib')
except FileNotFoundError:
    raise SystemExit("Model/scaler tidak ditemukan di folder 'model'.")

CLUSTER_MAP = {
    2: "Fast Learner",
    0: "Reflective Learner",
    1: "Consistent Learner"
}

FEATURE_COLUMNS_TOTAL = [
    'total_materi_selesai', 'avg_durasi_materi_detik', 'total_review',
    'total_hari_aktif', 'std_dev_materi_harian', 'avg_skor_kuis',
    'pass_rate_kuis', 'total_kuis_diambil', 'avg_rating_submission',
    'total_submissions', 'avg_durasi_article', 'avg_durasi_exam',
    'avg_durasi_interactivecode', 'avg_durasi_quiz', 'count_article',
    'count_exam', 'count_interactivecode', 'count_quiz'
]

data_storage: Dict[str, pd.DataFrame] = {}

@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        data_storage['users']         = pd.read_excel("data/users.xlsx")
        data_storage['trackings']     = pd.read_excel("data/developer_journey_trackings.xlsx")
        data_storage['registrations'] = pd.read_excel("data/exam_registrations.xlsx")
        data_storage['results']       = pd.read_excel("data/exam_results.xlsx")
        data_storage['submissions']   = pd.read_excel("data/developer_journey_submissions.xlsx")
        data_storage['tutorials']     = pd.read_excel("data/developer_journey_tutorials.xlsx", usecols=['id', 'type'])

        for col in ['first_opened_at', 'completed_at', 'last_viewed']:
            data_storage['trackings'][col] = pd.to_datetime(data_storage['trackings'][col], errors='coerce')

        data_storage['users']['id'] = pd.to_numeric(data_storage['users']['id'], errors='coerce').astype('Int64')
        data_storage['trackings']['developer_id'] = pd.to_numeric(data_storage['trackings']['developer_id'], errors='coerce').astype('Int64')
        data_storage['registrations']['examinees_id'] = pd.to_numeric(data_storage['registrations']['examinees_id'], errors='coerce').astype('Int64')
        data_storage['results']['exam_registration_id'] = pd.to_numeric(data_storage['results']['exam_registration_id'], errors='coerce').astype('Int64')
        data_storage['submissions']['submitter_id'] = pd.to_numeric(data_storage['submissions']['submitter_id'], errors='coerce').astype('Int64')
    except Exception as e:
        raise SystemExit(f"Gagal load data: {e}")

    yield
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

def hitung_fitur_user(user_id: int) -> Tuple[pd.DataFrame, str]:
    users_df         = data_storage['users']
    trackings_df     = data_storage['trackings']
    registrations_df = data_storage['registrations']
    results_df       = data_storage['results']
    submissions_df   = data_storage['submissions']
    tutorials_df     = data_storage['tutorials']

    user_data = users_df[users_df['id'] == user_id]
    if user_data.empty:
        raise HTTPException(status_code=404, detail=f"User ID {user_id} tidak ditemukan.")
    user_name = str(user_data.iloc[0]['name'])

    features_df = pd.DataFrame({'user_id': [user_id]})

    user_trackings = trackings_df[trackings_df['developer_id'] == user_id]
    if user_trackings.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name

    trackings_with_type = user_trackings.merge(
        tutorials_df, left_on='tutorial_id', right_on='id', how='left'
    )
    completed = trackings_with_type.dropna(subset=['completed_at', 'first_opened_at'])
    if completed.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name

    completed['durasi_belajar_detik'] = (completed['completed_at'] - completed['first_opened_at']).dt.total_seconds()
    valid = completed[(completed['durasi_belajar_detik'] > 5) & (completed['durasi_belajar_detik'] < 3 * 24 * 60 * 60)]
    if valid.empty:
        final_features_df = pd.DataFrame(0, index=[0], columns=FEATURE_COLUMNS_TOTAL)
        return final_features_df, user_name

    features_df['total_materi_selesai']    = valid.shape[0]
    features_df['avg_durasi_materi_detik'] = valid['durasi_belajar_detik'].mean()

    review_trackings = completed[completed['last_viewed'] > completed['completed_at']]
    features_df['total_review'] = review_trackings.shape[0]

    daily = completed.groupby(completed['completed_at'].dt.date).size().reset_index(name='materi_harian')
    features_df['total_hari_aktif']      = daily.shape[0]
    features_df['std_dev_materi_harian'] = daily['materi_harian'].std()

    duration_by_type = valid.groupby('type')['durasi_belajar_detik'].mean().add_prefix('avg_durasi_')
    count_by_type    = valid.groupby('type')['id_x'].count().add_prefix('count_')
    features_df = pd.concat([features_df, duration_by_type.to_frame().T, count_by_type.to_frame().T], axis=1)

    user_regs = registrations_df[registrations_df['examinees_id'] == user_id]
    if not user_regs.empty:
        exam = results_df.merge(user_regs, left_on='exam_registration_id', right_on='id')
        if not exam.empty:
            features_df['avg_skor_kuis']      = exam['score'].mean()
            features_df['pass_rate_kuis']     = exam['is_passed'].mean()
            features_df['total_kuis_diambil'] = exam.shape[0]

    user_subs = submissions_df[submissions_df['submitter_id'] == user_id].dropna(subset=['rating'])
    if not user_subs.empty:
        features_df['avg_rating_submission'] = user_subs['rating'].mean()
        features_df['total_submissions']     = user_subs.shape[0]

    final_features_df = features_df.reindex(columns=FEATURE_COLUMNS_TOTAL, fill_value=0)
    return final_features_df, user_name

def _predict_core(user_id: int) -> Tuple[str, int, str]:
    try:
        fitur_user_df, user_name = hitung_fitur_user(user_id)
    except HTTPException as e:
        if e.status_code == 404:
            return ("Not Active", -1, f"User {user_id}")
        raise
    if fitur_user_df['total_materi_selesai'].iloc[0] == 0:
        return ("Not Active", -1, user_name)
    fitur_scaled = scaler.transform(fitur_user_df.values)
    cluster_id = int(model.predict(fitur_scaled)[0])
    learning_style = CLUSTER_MAP.get(cluster_id, "Cluster Tidak Dikenal")
    return (learning_style, cluster_id, user_name)

@app.post("/predict")
async def predict_post(payload: PredictIn):
    learning_style, cluster_id, user_name = _predict_core(payload.student_id)
    if learning_style == "Not Active":
        return {
            "status": "success",
            "data": {
                "label": "Not Active",
                "confidence": 0.0,
                "reasons": [],
                "user_id": payload.student_id,
                "name": user_name,
                "cluster_id": -1
            }
        }
    reasons: List[Dict[str, Any]] = [
        {"key": "total_materi_selesai", "op": ">=", "value": 1}
    ]
    return {
        "status": "success",
        "data": {
            "label": learning_style,
            "confidence": 1.0,
            "reasons": reasons,
            "user_id": payload.student_id,
            "name": user_name,
            "cluster_id": cluster_id
        }
    }

@app.post("/predict/")
async def predict_post_trailing(payload: PredictIn):
    return await predict_post(payload)

@app.get("/")
def read_root():
    return {"message": "Selamat datang di API AI Learning Insight!"}

@app.get("/predict/{user_id}", response_model=PredictionOut)
async def predict_style(user_id: int):
    fitur_user_df, user_name = hitung_fitur_user(user_id)
    if fitur_user_df['total_materi_selesai'].iloc[0] == 0:
        return PredictionOut(
            user_id=user_id, name=user_name,
            learning_style="Not Active", cluster_id=-1,
            status="Siswa belum menyelesaikan materi apapun."
        )
    fitur_scaled = scaler.transform(fitur_user_df.values)
    cluster_id = int(model.predict(fitur_scaled)[0])
    learning_style = CLUSTER_MAP.get(cluster_id, "Cluster Tidak Dikenal")
    return PredictionOut(
        user_id=user_id, name=user_name,
        learning_style=learning_style, cluster_id=cluster_id,
        status="Prediksi berhasil."
    )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)
