import * as metrics from '../services/metricsService.js'

export async function getMetrics(req, res, next) {
  try {
    const userId = Number(req.params.userId)
    const data = await metrics.getByUserId(userId)
    if (!data) return res.status(404).json({ status: 'fail', message: 'metrics not found' })
    res.json({ status: 'success', data: { metrics: data } })
  } catch (e) { next(e) }
}

export async function upsertMetrics(req, res, next) {
  try {
    const userId = Number(req.params.userId)
    const data = await metrics.upsertDirect({ userId, features: req.body })
    res.json({ status: 'success', data: { metrics: data } })
  } catch (e) { next(e) }
}

export async function recomputeMetrics(req, res, next) {
  try {
    const userId = Number(req.params.userId)
    const data = await metrics.recomputeFromRaw(userId)
    res.json({ status: 'success', data: { metrics: data } })
  } catch (e) { next(e) }
}