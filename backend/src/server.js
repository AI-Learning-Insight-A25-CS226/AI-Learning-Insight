import 'dotenv/config'
import express from 'express'
import swaggerUi from 'swagger-ui-express'
import YAML from 'yamljs'
import cors from 'cors'
import authRoutes from './routes/auth.js'
import metricsRoutes from './routes/metrics.js'
import insightsRoutes from './routes/insights.js'
import { notFoundHandler, errorHandler } from './middlewares/errorHandler.js'

const app = express()
const openapiDocument = YAML.load('./openapi.yaml')
app.use(express.json({ limit: '1mb' }))
app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }))
app.use('/docs', swaggerUi.serve, swaggerUi.setup(openapiDocument))
app.get('/health', (_req, res) => res.json({ status: 'ok', ml: process.env.ML_SERVICE_URL || null }))
app.get('/', (_req, res) => res.json({ message: '✅ Backend ready' }))
app.use('/auth', authRoutes)
app.use(metricsRoutes)
app.use(insightsRoutes)
app.use(notFoundHandler)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`)
})
