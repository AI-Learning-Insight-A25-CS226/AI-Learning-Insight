// src/controllers/metricsController.js
import * as metrics from '../services/metricsService.js'

function getDeveloperIdFromParams (req) {
  // dukung dua nama param: developerId & userId (kompatibel dengan route lama)
  return req.params.developerId ?? req.params.userId
}

export async function getMetrics (req, res, next) {
  try {
    const rawId = getDeveloperIdFromParams(req)
    const data = await metrics.getByUserId(rawId)

    if (!data) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'metrics not found' })
    }

    res.json({ status: 'success', data: { metrics: data } })
  } catch (e) {
    next(e)
  }
}

export async function upsertMetrics (req, res, next) {
  try {
    const rawId = getDeveloperIdFromParams(req)

    const data = await metrics.upsertDirect({
      developerId: rawId,
      metrics: req.body
    })

    res.json({ status: 'success', data: { metrics: data } })
  } catch (e) {
    next(e)
  }
}