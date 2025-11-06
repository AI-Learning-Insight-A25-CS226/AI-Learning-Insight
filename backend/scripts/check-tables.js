import 'dotenv/config'
import pkg from 'pg'
const { Client } = pkg

const client = new Client({
  connectionString: process.env.SUPABASE_DB_URL,
  ssl: { rejectUnauthorized: false }
})

await client.connect()
const res = await client.query(`
  select table_name 
  from information_schema.tables 
  where table_schema='public' 
  and table_name in ('users','students','metrics','insights');
`)
console.log(res.rows)
await client.end()
