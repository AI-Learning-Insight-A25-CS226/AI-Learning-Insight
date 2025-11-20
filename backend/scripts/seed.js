import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import { pool } from '../src/db/pool.js'

async function main () {
  const filePath = path.resolve('scripts/seed.sql')
  const sql = fs.readFileSync(filePath, 'utf8')

  console.log('\n🌱 running scripts/seed.sql...\n')

  try {
    await pool.query(sql)
    console.log('✅ seeding completed successfully!')
  } catch (err) {
    console.error('❌ error while running seed.sql:', err.message)
  } finally {
    await pool.end()
  }
}

main()