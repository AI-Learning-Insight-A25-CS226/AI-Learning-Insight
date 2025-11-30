import warnings
import pandas as pd
import pickle
from pathlib import Path
from typing import Optional, Dict, Any, List, Tuple
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from contextlib import asynccontextmanager

warnings.filterwarnings("ignore")

# Folder tempat main.py berada
BASE_DIR = Path(__file__).resolve().parent

# =========================================================
# 1. KONFIGURASI PROFIL & TEMPLATE (ISI ASLI ANDA)
# =========================================================

# 5 Fitur asli dari model Anda (sesuai CSV)
FEATURE_COLUMNS_TOTAL = [
    "total_active_days",
    "avg_completion_time_hours",
    "total_journeys_completed",
    "rejection_ratio",
    "avg_exam_score",
]

CLUSTER_PROFILES: Dict[int, Dict[str, Any]] = {
    0: {
        "label_id": "Fast Learner",
        "short_description": (
            "Aktivitas belajar masih jarang, tetapi ketika mulai belajar mampu menyelesaikan modul dengan sangat cepat "
            "dan mempertahankan nilai ujian yang cukup baik. Volume journey relatif rendah dan hampir tidak ada revisi submission."
        ),
        "concept_tag": "fast_learner",
    },
    1: {
        "label_id": "Consistent Learner",
        "short_description": (
            "Belajar secara konsisten, menyelesaikan banyak journey, dan memiliki nilai ujian yang tinggi. "
            "Tingkat refleksi berada pada kisaran sedang."
        ),
        "concept_tag": "consistent_learner",
    },
    2: {
        "label_id": "Reflective Learner",
        "short_description": (
            "Sangat sering aktif dan menyelesaikan banyak journey, namun membutuhkan waktu yang panjang per modul. "
            "Cenderung mengulas materi secara mendalam."
        ),
        "concept_tag": "reflective_learner",
    },
    3: {
        "label_id": "Struggling Learner",
        "short_description": (
            "Cukup aktif dan banyak bereksperimen dengan submission (revisi tinggi), "
            "namun nilai ujian relatif rendah sehingga masih perlu penguatan konsep."
        ),
        "concept_tag": "struggling_learner",
    },
}

# =========================================================
# TEMPLATE KALIMAT INSIGHT UNTUK SETIAP CLUSTER
# =========================================================

CLUSTER_TEMPLATES: Dict[int, str] = {
    0: (
        "Aktivitas belajarmu masih jarang (sekitar {active_days:.0f} hari aktif), "
        "tetapi ketika mulai belajar kamu bergerak sangat cepat dengan rata-rata waktu selesai "
        "sekitar {avg_time_hours:.1f} jam per modul. Kamu telah menyelesaikan sekitar {journeys:.0f} journey "
        "dengan nilai ujian rata-rata {score:.0f}. Cobalah meningkatkan frekuensi belajar agar dampak "
        "pembelajaranmu lebih konsisten."
    ),
    1: (
        "Kamu belajar secara cukup konsisten (sekitar {active_days:.0f} hari aktif) dan telah menyelesaikan "
        "sekitar {journeys:.0f} journey. Nilai ujian rata-ratamu tinggi, yaitu sekitar {score:.0f}. "
        "Tingkat refleksi melalui submission yang ditolak berada di kisaran {rejection_ratio:.2f}. "
        "Pertahankan pola belajar ini dan gunakan umpan balik untuk terus menyempurnakan pemahamanmu."
    ),
    2: (
        "Kamu sangat tekun dengan sekitar {active_days:.0f} hari aktif dan telah menyelesaikan "
        "sekitar {journeys:.0f} journey. Rata-rata waktu yang kamu habiskan per modul cukup panjang, "
        "sekitar {avg_time_hours:.1f} jam. Nilai ujian rata-ratamu sekitar {score:.0f}. "
        "Pertahankan kedalaman belajarmu, namun pertimbangkan pengelolaan waktu belajar yang lebih efisien."
    ),
    3: (
        "Kamu cukup aktif belajar (sekitar {active_days:.0f} hari aktif) dan telah menyelesaikan "
        "sekitar {journeys:.0f} journey. Rata-rata nilai ujianmu saat ini sekitar {score:.0f}, "
        "dengan rasio submission ditolak sekitar {rejection_ratio:.2f}. Ini menunjukkan kamu banyak "
        "bereksperimen, tetapi masih perlu memperkuat pemahaman konsep dasar. Manfaatkan kembali materi, "
        "contoh solusi, dan umpan balik dari submission untuk meningkatkan hasil ujian."
    ),
}

# Variable Global untuk Artifacts
data_storage: Dict[str, Any] = {}

# =========================================================
# 2. LIFESPAN (STRUKTUR YANG DIINGINKAN)
# =========================================================


@asynccontextmanager
async def lifespan(app: FastAPI):
    print("Startup: Memuat model dan data...")
    try:
        # Load Model & Scaler (Pakai pickle sesuai file asli Anda)
        with open(BASE_DIR / "model" / "scaler.pkl", "rb") as f:
            data_storage["scaler"] = pickle.load(f)

        with open(BASE_DIR / "model" / "kmeans_model.pkl", "rb") as f:
            data_storage["model"] = pickle.load(f)

        # Load Data CSV
        features_df = pd.read_csv(BASE_DIR / "data" / "clustered_students.csv")

        # Validasi Kolom (Sesuai CSV Anda)
        if "developer_id" not in features_df.columns:
            raise ValueError("CSV harus memiliki kolom 'developer_id'.")

        missing_cols = [
            col for col in FEATURE_COLUMNS_TOTAL if col not in features_df.columns
        ]
        if missing_cols:
            raise ValueError(f"Kolom fitur berikut hilang: {missing_cols}")

        # Indexing untuk pencarian cepat
        features_df = features_df.drop_duplicates(subset=["developer_id"])
        features_df = features_df.set_index("developer_id")

        data_storage["features"] = features_df

        print(f"Startup: Berhasil memuat data {len(features_df)} siswa dan model.")

    except FileNotFoundError as e:
        print(f"Error Startup: File tidak ditemukan. {e}")
        raise SystemExit("Gagal memuat file artifacts.")
    except Exception as e:
        print(f"Error Startup: {e}")
        raise SystemExit(f"Gagal inisialisasi: {e}")

    yield

    print("Shutdown: Membersihkan memory...")
    data_storage.clear()


app = FastAPI(title="AI Learning Insight API", version="1.0.0", lifespan=lifespan)

# =========================================================
# 3. PYDANTIC MODELS (STRUKTUR YANG DIINGINKAN)
# =========================================================


class PredictIn(BaseModel):
    developer_id: int  # Disesuaikan agar cocok dengan data Anda
    features: Optional[Dict[str, Any]] = None


class PredictOutData(BaseModel):
    label: str
    confidence: float
    reasons: List[Dict[str, Any]]
    developer_id: int
    developer_name: str
    cluster_id: int
    insight_text: str  # Tambahan agar insight Anda tetap muncul
    features: Dict[str, Any]


class PredictOutStatus(BaseModel):
    status: str
    data: Optional[PredictOutData] = None
    message: Optional[str] = None


class SimplePredictionOut(BaseModel):
    developer_id: int
    name: str
    learning_style: str
    cluster_id: int
    status: str


# =========================================================
# 4. CORE LOGIC
# =========================================================


def _generate_insight_text(cluster_id: int, row: Dict[str, float]) -> str:
    """Helper untuk membuat kalimat insight sesuai template asli"""
    template = CLUSTER_TEMPLATES.get(cluster_id, "")
    return template.format(
        active_days=row.get("total_active_days", 0),
        avg_time_hours=row.get("avg_completion_time_hours", 0),
        journeys=row.get("total_journeys_completed", 0),
        rejection_ratio=row.get("rejection_ratio", 0),
        score=row.get("avg_exam_score", 0),
    )


def _predict_core(dev_id: int) -> Tuple[str, int, str, str, float, Dict[str, Any]]:
    # 1. Cek Data di CSV
    try:
        user_data_series = data_storage["features"].loc[dev_id]
    except KeyError:
        # Jika user tidak ada di CSV
        empty = {col: 0 for col in FEATURE_COLUMNS_TOTAL}
        return ("Not Active", -1, "Unknown User", "User tidak ditemukan.", 0.0, empty)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lookup error: {e}")

    dev_name = str(user_data_series.get("developer_name", "Unknown"))

    # Ambil 5 fitur penting
    fitur_df = user_data_series[FEATURE_COLUMNS_TOTAL].to_frame().T
    raw_features = fitur_df.iloc[0].to_dict()

    # 2. Cek apakah aktif (Logic: journeys > 0)
    if raw_features["total_journeys_completed"] == 0:
        return (
            "Not Active",
            -1,
            dev_name,
            "User belum menyelesaikan journey.",
            0.0,              # confidence 0 kalau belum aktif
            raw_features,
        )

    # 3. Prediksi Model
    try:
        scaler = data_storage["scaler"]
        model = data_storage["model"]

        fitur_scaled = scaler.transform(fitur_df.values)
        cluster_id = int(model.predict(fitur_scaled)[0])
        distances = model.transform(fitur_scaled)[0]
        dist_to_own = float(distances[cluster_id])
        max_dist = float(distances.max())

        if max_dist == 0:
            confidence = 1.0
        else:
            confidence = max(0.0, 1.0 - dist_to_own / max_dist)

        profile = CLUSTER_PROFILES.get(cluster_id, {})
        label = profile.get("label_id", f"Cluster {cluster_id}")

        # Generate Text Insight
        insight_text = _generate_insight_text(cluster_id, raw_features)

    except Exception as e:
        print(f"Prediction Error: {e}")
        raise HTTPException(status_code=500, detail="Gagal melakukan prediksi model.")

    return (label, cluster_id, dev_name, insight_text, confidence, raw_features)


# =========================================================
# 5. ENDPOINTS
# =========================================================


@app.get("/")
def read_root():
    return {"message": "Selamat datang di API AI Learning Insight!"}


@app.post("/predict", response_model=PredictOutStatus)
async def predict_post(payload: PredictIn):
    (
        label,
        cluster_id,
        dev_name,
        insight_text,
        confidence,
        raw_features,
    ) = _predict_core(payload.developer_id)

    if label == "Not Active":
        # Response untuk user tidak aktif / tidak ketemu
        return PredictOutStatus(status="error", message=insight_text, data=None)

    # Response Sukses
    # 'reasons' diisi simple logic agar sesuai struktur referensi
    reasons = [
        {"key": "total_journeys_completed", "op": ">", "value": 0},
        {"key": "cluster_id", "value": cluster_id},
    ]

    data_obj = PredictOutData(
        label=label,
        confidence=confidence,
        reasons=reasons,
        developer_id=payload.developer_id,
        developer_name=dev_name,
        cluster_id=cluster_id,
        insight_text=insight_text,  # Menampilkan insight yang sudah digenerate
        features=raw_features,
    )

    return PredictOutStatus(status="success", data=data_obj)


@app.get("/predict/{developer_id}", response_model=SimplePredictionOut)
async def predict_style_get(developer_id: int):
    (label, cluster_id, dev_name, insight, _confidence, _features) = _predict_core(developer_id)

    status_msg = "Prediksi berhasil."
    if label == "Not Active":
        status_msg = insight

    return SimplePredictionOut(
        developer_id=developer_id,
        name=dev_name,
        learning_style=label,
        cluster_id=cluster_id,
        status=status_msg,
    )

if __name__ == "__main__":
    import uvicorn

    # Port 8001
    uvicorn.run("main:app", host="127.0.0.1", port=8001, reload=True)