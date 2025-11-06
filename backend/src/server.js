import 'dotenv/config'
import express from 'express'
import cors from 'cors'

import authRoutes from './routes/auth.js'
import studentRoutes from './routes/student.js'
import metricsRoutes from './routes/metrics.js'
import insightsRoutes from './routes/insights.js'
import { errorHandler } from './middlewares/errorHandler.js'

const app = express()
app.use(express.json())
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))

app.get('/', (_req, res) => res.json({ message: '✅ Backend ready' }))
app.use('/auth', authRoutes)
app.use('/students', studentRoutes)
app.use('/metrics', metricsRoutes)
app.use('/insights', insightsRoutes)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`))
