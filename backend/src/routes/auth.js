import { Router } from 'express'
const r = Router()

r.get('/', (req, res) => {
  res.json({ message: 'Auth route placeholder ✅' })
})

export default r
