import { Router } from 'express'
import { requireAuth } from '../middlewares/authMiddleware.js'
import { createOrUpdateInsight, getInsight } from '../controllers/insightsController.js'

const router = Router()
router.use(requireAuth)

router.get('/users/:userId/insights', getInsight)
router.post('/users/:userId/insights', createOrUpdateInsight)

export default router