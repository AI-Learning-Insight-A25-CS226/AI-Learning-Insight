import * as insights from '../services/insightsService.js'

function getDeveloperIdFromParams(req) {
  return req.params.developerId ?? req.params.userId
}

export async function createOrUpdateInsight(req, res, next) {
  try {
    const rawId = getDeveloperIdFromParams(req)
    const result = await insights.predictAndSave({
      developerId: rawId
    })

    res.json({
      status: 'success',
      data: { insight: result }
    })
  } catch (e) {
    next(e)
  }
}

export async function getInsight(req, res, next) {
  try {
    const rawId = getDeveloperIdFromParams(req)
    const data = await insights.getLastInsight(rawId)

    if (!data) {
      return res
        .status(404)
        .json({ status: 'fail', message: 'insight not found' })
    }

    res.json({
      status: 'success',
      data: { insight: data }
    })
  } catch (e) {
    next(e)
  }
}