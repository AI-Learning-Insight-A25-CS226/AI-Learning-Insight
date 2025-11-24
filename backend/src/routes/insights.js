import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import {
  createOrUpdateInsight,
  getInsight
} from '../controllers/insightsController.js'

const router = Router()
router.use(requireAuth)
router.get('/developers/:developerId/insights', getInsight)
router.post('/developers/:developerId/insights', createOrUpdateInsight)

export default router