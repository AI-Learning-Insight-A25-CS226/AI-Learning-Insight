import { pool } from '../db/pool.js'

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

export async function upsertMetricsFromML(studentId, features) {
  const cols = FEATURE_COLUMNS
  const values = cols.map((c) => features[c] ?? 0)
  const placeholders = values.map((_, i) => `$${i + 2}`)

  await pool.query(
    `
    insert into metrics (
      student_id,
      ${cols.join(', ')},
      last_calculated_at
    )
    values (
      $1,
      ${placeholders.join(', ')},
      now()
    )
    on conflict (student_id) do update set
      ${cols.map((c, i) => `${c} = EXCLUDED.${c}`).join(', ')},
      last_calculated_at = now()
    `,
    [studentId, ...values]
  )
}

export async function getMetricsByStudentId(studentId) {
  const { rows } = await pool.query(
    `
    select
      student_id,
      ${FEATURE_COLUMNS.join(', ')},
      last_calculated_at
    from metrics
    where student_id = $1
    `,
    [studentId]
  )

  return rows[0] || null
}

export async function getByUserId(userId) {
  return getMetricsByStudentId(userId)
}

export async function upsertDirect({ studentId, features }) {
  await upsertMetricsFromML(studentId, features)
  return getMetricsByStudentId(studentId)
}