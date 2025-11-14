import axios from 'axios'
import { pool } from '../db/pool.js'
import { upsertMetricsFromML } from './metricsService.js'

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001'
const ML_TIMEOUT = Number.parseInt(process.env.ML_HTTP_TIMEOUT_MS || '8000', 10)

const FEATURE_COLUMNS = [
  'total_materi_selesai',
  'avg_durasi_materi_detik',
  'total_review',
  'total_hari_aktif',
  'std_dev_materi_harian',
  'avg_skor_kuis',
  'pass_rate_kuis',
  'total_kuis_diambil',
  'avg_rating_submission',
  'total_submissions',
  'avg_durasi_article',
  'avg_durasi_exam',
  'avg_durasi_interactivecode',
  'avg_durasi_quiz',
  'count_article',
  'count_exam',
  'count_interactivecode',
  'count_quiz'
]

function normalizeMlResponse(respData) {
  const ml = respData?.data
  if (!ml || typeof ml !== 'object') {
    throw Object.assign(
      new Error('Invalid ML response shape (missing `data`)'),
      { status: 502 }
    )
  }

  const label      = ml.label ?? 'Unknown'
  const confidence = typeof ml.confidence === 'number' ? ml.confidence : 0
  const reasons    = Array.isArray(ml.reasons) ? ml.reasons : []
  const clusterId  = Number.isInteger(ml.cluster_id) ? ml.cluster_id : -1
  const name       = typeof ml.name === 'string' ? ml.name : null
  const userId     = Number.isInteger(ml.user_id) ? ml.user_id : null
  const features   = (ml.features && typeof ml.features === 'object') ? ml.features : null

  return { label, confidence, reasons, cluster_id: clusterId, name, user_id: userId, features }
}

export async function predictAndSave({ studentId }) {
  studentId = parseInt(studentId, 10)
  if (Number.isNaN(studentId)) {
    const err = new Error('studentId must be an integer')
    err.status = 400
    throw err
  }

  const resp = await axios.post(
    `${ML_BASE_URL}/predict`,
    { student_id: studentId },
    { timeout: ML_TIMEOUT }
  )

  const mlNorm = normalizeMlResponse(resp.data)

  const featuresFromMl = {}
  FEATURE_COLUMNS.forEach((col) => {
    const v = mlNorm.features && Object.prototype.hasOwnProperty.call(mlNorm.features, col)
      ? mlNorm.features[col]
      : 0
    featuresFromMl[col] = Number.isFinite(Number(v)) ? Number(v) : 0
  })

  const client = await pool.connect()
  try {
    await client.query('begin')

    await upsertMetricsFromML(studentId, featuresFromMl)

    await client.query(
      `insert into insight_histories
        (student_id, label, confidence, reasons, raw_features, cluster_id, created_at)
       values ($1,$2,$3,$4::jsonb,$5::jsonb,$6, now())`,
      [
        studentId,
        mlNorm.label,
        mlNorm.confidence,
        JSON.stringify(mlNorm.reasons),
        JSON.stringify(featuresFromMl),
        mlNorm.cluster_id
      ]
    )

    await client.query(
      `insert into insights (student_id, label, confidence, reasons, cluster_id, updated_at)
       values ($1,$2,$3,$4::jsonb,$5, now())
       on conflict (student_id) do update set
         label       = excluded.label,
         confidence  = excluded.confidence,
         reasons     = excluded.reasons,
         cluster_id  = excluded.cluster_id,
         updated_at  = now()`,
      [
        studentId,
        mlNorm.label,
        mlNorm.confidence,
        JSON.stringify(mlNorm.reasons),
        mlNorm.cluster_id
      ]
    )

    await client.query('commit')
  } catch (e) {
    await client.query('rollback')
    throw e
  } finally {
    client.release()
  }

  return {
    label: mlNorm.label,
    confidence: mlNorm.confidence,
    reasons: mlNorm.reasons,
    cluster_id: mlNorm.cluster_id,
    student_id: studentId,
    name: mlNorm.name ?? null
  }
}

export async function getLastInsight(studentId) {
  studentId = parseInt(studentId, 10)
  const { rows } = await pool.query(
    `select student_id, label, confidence, reasons, cluster_id, updated_at
       from insights
      where student_id = $1`,
    [studentId]
  )
  return rows[0] || null
}

export async function listHistory(studentId, limit = 20, offset = 0) {
  studentId = parseInt(studentId, 10)
  const { rows } = await pool.query(
    `select created_at, label, confidence, reasons, cluster_id, raw_features
       from insight_histories
      where student_id = $1
      order by created_at desc
      limit $2 offset $3`,
    [studentId, limit, offset]
  )
  return rows
}