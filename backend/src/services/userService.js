import { pool } from '../db/pool.js'
import bcrypt from 'bcrypt'

export async function findByEmail(email) {
  const { rows } = await pool.query('select * from users where email=$1 limit 1', [email])
  return rows[0] || null
}

export async function verifyPassword(user, password) {
  return bcrypt.compare(password, user.password_hash)
}

export async function createUser({ email, password, name }) {
  const existed = await findByEmail(email)
  if (existed) {
    const e = new Error('email sudah digunakan')
    e.code = '23505'
    throw e
  }

  const hash = await bcrypt.hash(password, 10)
  const { rows } = await pool.query(
    `insert into users (email, password_hash, name, created_at)
     values ($1,$2,$3, now())
     returning id, email, name`,
    [email, hash, name]
  )
  return { user: rows[0] }
}