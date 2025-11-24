import { pool } from '../db/pool.js'

const FEATURE_COLUMNS = [
  'total_active_days',
  'avg_completion_time_hours',
  'total_journeys_completed',
  'total_submissions',
  'rejected_submissions',
  'avg_exam_score',
  'rejection_ratio',
  'cluster_label'
]

export async function upsertLearningMetrics (developerId, metrics) {
  developerId = parseInt(developerId, 10)
  if (Number.isNaN(developerId)) {
    const err = new Error('developerId must be an integer')
    err.status = 400
    throw err
  }

  const cols = FEATURE_COLUMNS
  const values = cols.map((c) => {
    const v = metrics?.[c]
    return Number.isFinite(Number(v)) ? Number(v) : 0
  })

  const placeholders = values.map((_, i) => `$${i + 2}`)

  await pool.query(
    `
    insert into learning_metrics (
      developer_id,
      ${cols.join(', ')},
      created_at,
      updated_at
    )
    values (
      $1,
      ${placeholders.join(', ')},
      now(),
      now()
    )
    on conflict (developer_id) do update set
      ${cols.map((c) => `${c} = excluded.${c}`).join(', ')},
      updated_at = now()
    `,
    [developerId, ...values]
  )
}

export async function getMetricsByDeveloperId (developerId) {
  developerId = parseInt(developerId, 10)
  const { rows } = await pool.query(
    `
    select
      developer_id,
      ${FEATURE_COLUMNS.join(', ')},
      created_at,
      updated_at
    from learning_metrics
    where developer_id = $1
    `,
    [developerId]
  )

  return rows[0] || null
}

export async function getByUserId (userId) {
  return getMetricsByDeveloperId(userId)
}

export async function upsertDirect ({ developerId, metrics }) {
  await upsertLearningMetrics(developerId, metrics)
  return getMetricsByDeveloperId(developerId)
}