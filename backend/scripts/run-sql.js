import fs from 'fs'
import path from 'path'
import 'dotenv/config'
import pkg from 'pg'

const { Client } = pkg

const MIGRATIONS_DIR = path.resolve('src/db/migrations')

async function runSqlFile(client, filePath) {
  const sql = fs.readFileSync(filePath, 'utf8')
  console.log(`\n🚀 Running migration: ${path.basename(filePath)}`)
  try {
    await client.query(sql)
    console.log(`✅ Success: ${path.basename(filePath)}`)
  } catch (err) {
    console.error(`❌ Error in ${path.basename(filePath)}:`, err.message)
  }
}

async function main() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL,
    ssl: { rejectUnauthorized: false }
  })

  await client.connect()

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter(f => f.endsWith('.sql'))
    .sort()

  if (files.length === 0) {
    console.log('⚠️  No SQL migration files found in:', MIGRATIONS_DIR)
    await client.end()
    return
  }

  for (const file of files) {
    const fullPath = path.join(MIGRATIONS_DIR, file)
    await runSqlFile(client, fullPath)
  }

  await client.end()
  console.log('\n🎉 All migrations executed successfully!')
}

main().catch(err => {
  console.error('Unexpected error:', err)
})