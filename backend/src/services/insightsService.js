import axios from 'axios'
import { pool } from '../db/pool.js'

const ML_BASE_URL = process.env.ML_SERVICE_URL || 'http://127.0.0.1:8001'
const ML_PREDICT_PATH = process.env.ML_PREDICT_PATH || '/predict'
const ML_TIMEOUT = Number.parseInt(process.env.ML_HTTP_TIMEOUT_MS || '8000', 10)

const FEATURE_COLUMNS = [
  'total_active_days',
  'avg_completion_time_hours',
  'total_journeys_completed',
  'rejection_ratio',
  'avg_exam_score'
]

function normalizeMlResponse(respBody) {
  const ml = respBody?.data
  if (!ml || typeof ml !== 'object') {
    const err = new Error('Invalid ML response shape (missing `data`)')
    err.status = 502
    throw err
  }

  const learningStyle = ml.label ?? ml.learning_style ?? 'Unknown'

  const confidenceScore =
    typeof ml.confidence === 'number'
      ? ml.confidence
      : (typeof ml.confidence_score === 'number' ? ml.confidence_score : 0)

  const name =
    typeof ml.developer_name === 'string'
      ? ml.developer_name
      : (typeof ml.name === 'string' ? ml.name : null)

  const developerId =
    Number.isInteger(ml.developer_id)
      ? ml.developer_id
      : (Number.isInteger(ml.user_id) ? ml.user_id : null)

  const clusterId = Number.isInteger(ml.cluster_id) ? ml.cluster_id : null

  const features =
    ml.features && typeof ml.features === 'object' ? ml.features : null

  const insightText =
    typeof ml.insight_text === 'string' ? ml.insight_text : null

  return {
    learning_style: learningStyle,
    confidence_score: confidenceScore,
    name,
    developer_id: developerId,
    cluster_id: clusterId,
    features,
    insight_text: insightText
  }
}

export async function predictAndSave({ developerId }) {
  developerId = parseInt(developerId, 10)
  if (Number.isNaN(developerId)) {
    const err = new Error('developerId must be an integer')
    err.status = 400
    throw err
  }

  const resp = await axios.post(
    `${ML_BASE_URL}${ML_PREDICT_PATH}`,
    { developer_id: developerId },
    { timeout: ML_TIMEOUT }
  )

  if (resp.data?.status !== 'success' || !resp.data.data) {
    const err = new Error(resp.data?.message || 'ML prediction failed')
    err.status = 400
    throw err
  }

  const mlNorm = normalizeMlResponse(resp.data)
  const effectiveDeveloperId = developerId || mlNorm.developer_id

  const featuresFromMl = {}
  FEATURE_COLUMNS.forEach((col) => {
    const v =
      mlNorm.features && Object.prototype.hasOwnProperty.call(mlNorm.features, col)
        ? mlNorm.features[col]
        : 0
    featuresFromMl[col] = Number.isFinite(Number(v)) ? Number(v) : 0
  })

  const client = await pool.connect()
  try {
    await client.query('begin')

    // Upsert developers (id + name)
    await client.query(
      `
      insert into developers (id, name)
      values ($1, $2)
      on conflict (id) do update set
        name = excluded.name
      `,
      [effectiveDeveloperId, mlNorm.name]
    )

    await client.query(
      `
      insert into learning_metrics (
        developer_id,
        total_active_days,
        avg_completion_time_hours,
        total_journeys_completed,
        rejection_ratio,
        avg_exam_score,
        cluster_label
      )
      values ($1, $2, $3, $4, $5, $6, $7)
      on conflict (developer_id) do update set
        total_active_days            = excluded.total_active_days,
        avg_completion_time_hours    = excluded.avg_completion_time_hours,
        total_journeys_completed     = excluded.total_journeys_completed,
        rejection_ratio              = excluded.rejection_ratio,
        avg_exam_score               = excluded.avg_exam_score,
        cluster_label                = excluded.cluster_label,
        updated_at                   = now()
      `,
      [
        effectiveDeveloperId,
        featuresFromMl.total_active_days,
        featuresFromMl.avg_completion_time_hours,
        featuresFromMl.total_journeys_completed,
        featuresFromMl.rejection_ratio,
        featuresFromMl.avg_exam_score,
        mlNorm.cluster_id
      ]
    )

    await client.query(
      `
      insert into insight_histories
        (developer_id, learning_style, confidence_score, insight_text, created_at)
      values ($1, $2, $3, $4, now())
      `,
      [
        effectiveDeveloperId,
        mlNorm.learning_style,
        mlNorm.confidence_score,
        mlNorm.insight_text
      ]
    )

    await client.query(
      `
      insert into insights
        (developer_id, learning_style, confidence_score, insight_text, updated_at)
      values ($1, $2, $3, $4, now())
      on conflict (developer_id) do update set
        learning_style   = excluded.learning_style,
        confidence_score = excluded.confidence_score,
        insight_text     = excluded.insight_text,
        updated_at       = now()
      `,
      [
        effectiveDeveloperId,
        mlNorm.learning_style,
        mlNorm.confidence_score,
        mlNorm.insight_text
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
    developer_id: effectiveDeveloperId,
    learning_style: mlNorm.learning_style,
    confidence_score: mlNorm.confidence_score,
    name: mlNorm.name ?? null,
    cluster_id: mlNorm.cluster_id,
    insight_text: mlNorm.insight_text ?? null,
    features: featuresFromMl
  }
}

export async function getLastInsight(developerId) {
  developerId = parseInt(developerId, 10)
  const { rows } = await pool.query(
    `
    select
      i.developer_id,
      d.name,
      i.learning_style,
      i.confidence_score,
      i.insight_text,
      i.updated_at,
      lm.cluster_label
    from insights i
    join developers d on d.id = i.developer_id
    left join learning_metrics lm on lm.developer_id = i.developer_id
    where i.developer_id = $1
    `,
    [developerId]
  )
  return rows[0] || null
}

export async function listHistory(developerId, limit = 20, offset = 0) {
  developerId = parseInt(developerId, 10)
  const { rows } = await pool.query(
    `
    select
      created_at,
      learning_style,
      confidence_score,
      insight_text
    from insight_histories
    where developer_id = $1
    order by created_at desc
    limit $2 offset $3
    `,
    [developerId, limit, offset]
  )
  return rows
}