// src/services/metricsService.js
import { pool } from '../db/pool.js'

export async function getByUserId(userId) {
  const { rows } = await pool.query(
    `select student_id, study_hours, attendance, assignment_completion,
            motivation, stress_level, discussions, resources, last_calculated_at
     from metrics
     where student_id = $1`,
    [userId]
  )
  return rows[0] || null
}

// upsert langsung dari body FE (manual entry dari form)
export async function upsertDirect({ userId, features }) {
  const {
    study_hours, attendance, assignment_completion,
    motivation, stress_level, discussions, resources
  } = features

  await pool.query(
    `insert into metrics
      (student_id, study_hours, attendance, assignment_completion,
       motivation, stress_level, discussions, resources, last_calculated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8, now())
     on conflict (student_id) do update set
       study_hours=$2, attendance=$3, assignment_completion=$4,
       motivation=$5, stress_level=$6, discussions=$7, resources=$8,
       last_calculated_at=now()`,
    [userId, study_hours, attendance, assignment_completion, motivation, stress_level, discussions, resources]
  )
  return getByUserId(userId)
}

// OPTIONAL: hitung metrics dari tabel dev_journey_* + exam_results
// -> sesuaikan logic agregasi sesuai kebutuhanmu
export async function recomputeFromRaw(userId) {
  // Contoh agregasi:
  // - study_hours: total/avg durasi dari dev_journey_trackings/tutorials (menit -> jam)
  // - discussions/resources: dummy contoh (silakan ganti sesuai data real mu)
  // - attendance: kalau belum ada sumber, isi null/0 (FE/ML boleh handle)
  const { rows } = await pool.query(
    `
    with t as (
      select coalesce(sum(duration_in_minutes),0) as track_min
      from dev_journey_trackings
      where user_id = $1
    ),
    tut as (
      select coalesce(sum(duration_in_minutes),0) as tut_min
      from dev_journey_tutorials
      where user_id = $1
    ),
    exams as (
      select
        avg(final_score)::numeric(6,2) as avg_score,
        count(*) as exam_taken
      from exam_results
      where user_id = $1
    )
    select
      round(((t.track_min + tut.tut_min) / 60.0)::numeric, 2) as study_hours,
      null::numeric(5,2) as attendance,                -- belum ada sumber attendance → biarkan null
      null::numeric(5,2) as assignment_completion,     -- kalau ada sumber lain, isi di sini
      null::numeric(5,2) as motivation,                -- idem
      null::numeric(5,2) as stress_level,              -- idem
      coalesce(exams.exam_taken,0)::numeric(10,2) as discussions,  -- contoh placeholder
      coalesce(exams.avg_score,0)::numeric(10,2) as resources      -- contoh placeholder
    from t, tut, exams
    `,
    [userId]
  )

  const f = rows[0] || {
    study_hours: 0, attendance: null, assignment_completion: null,
    motivation: null, stress_level: null, discussions: 0, resources: 0
  }

  await pool.query(
    `insert into metrics
      (student_id, study_hours, attendance, assignment_completion,
       motivation, stress_level, discussions, resources, last_calculated_at)
     values ($1,$2,$3,$4,$5,$6,$7,$8, now())
     on conflict (student_id) do update set
       study_hours=$2, attendance=$3, assignment_completion=$4,
       motivation=$5, stress_level=$6, discussions=$7, resources=$8,
       last_calculated_at=now()`,
    [userId, f.study_hours, f.attendance, f.assignment_completion, f.motivation, f.stress_level, f.discussions, f.resources]
  )

  return getByUserId(userId)
}