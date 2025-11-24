import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import {
  getMetrics,
  upsertMetrics
} from '../controllers/metricsController.js'

const router = Router()
router.use(requireAuth)
router.get('/developers/:developerId/metrics', getMetrics)
router.put('/developers/:developerId/metrics', upsertMetrics)

export default router