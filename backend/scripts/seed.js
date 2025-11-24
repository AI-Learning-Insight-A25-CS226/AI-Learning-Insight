import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import bcrypt from 'bcrypt'
import { pool } from '../src/db/pool.js'

async function main () {
  const filePath = path.resolve('scripts/seed.sql')
  let sql = fs.readFileSync(filePath, 'utf8')

  const plainPassword = '12345'
  console.log("🔐 Generating bcrypt hash for password:", plainPassword)
  const hashedPassword = await bcrypt.hash(plainPassword, 12)
  console.log("➡️ Hash:", hashedPassword)
  sql = sql.replace(/{{PASSWORD_HASH}}/g, hashedPassword)
  console.log('\n🌱 Running scripts/seed.sql...\n')

  try {
    await pool.query(sql)
    console.log('✅ Seeding completed successfully!')
  } catch (err) {
    console.error('❌ Error while running seed.sql:', err.message)
  } finally {
    await pool.end()
  }
}

main()