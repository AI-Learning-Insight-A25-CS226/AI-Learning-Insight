import * as insights from '../services/insightsService.js'

export async function createOrUpdateInsight(req, res, next) {
  try {
    const studentId = parseInt(req.params.userId, 10)
    const result = await insights.predictAndSave({
      studentId,
      features: req.body?.features
    })
    res.json({ status: 'success', data: { insight: result } })
  } catch (e) { next(e) }
}

export async function getInsight(req, res, next) {
  try {
    const studentId = parseInt(req.params.userId, 10)
    const data = await insights.getLastInsight(studentId)
    if (!data) {
      return res.status(404).json({ status: 'fail', message: 'insight not found' })
    }
    res.json({ status: 'success', data: { insight: data } })
  } catch (e) { next(e) }
}