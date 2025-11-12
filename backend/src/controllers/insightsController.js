import * as insights from '../services/insightsService.js'

export async function createOrUpdateInsight(req, res, next) {
  try {
    const userId = Number(req.params.userId)
    const result = await insights.predictAndSave({ userId, features: req.body?.features })
    res.json({ status: 'success', data: { insight: result } })
  } catch (e) { next(e) }
}

export async function getInsight(req, res, next) {
  try {
    const userId = Number(req.params.userId)
    const data = await insights.getLastInsight(userId)
    if (!data) return res.status(404).json({ status: 'fail', message: 'insight not found' })
    res.json({ status: 'success', data: { insight: data } })
  } catch (e) { next(e) }
}