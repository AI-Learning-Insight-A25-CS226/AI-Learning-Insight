import * as insights from '../services/insightsService.js'

function getDeveloperIdFromParams (req) {
  return req.params.developerId ?? req.params.userId
}

export async function createOrUpdateInsight (req, res, next) {
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

export async function getInsight (req, res, next) {
  try {
    const rawId = getDeveloperIdFromParams(req)
    const developerId = parseInt(rawId, 10)
    if (Number.isNaN(developerId)) {
      return res
        .status(400)
        .json({ status: 'fail', message: 'developerId must be an integer' })
    }

    let data = await insights.getLastInsight(developerId)
    if (!data) {
      data = await insights.predictAndSave({ developerId })
    }
    
    res.json({
      status: 'success',
      data: { insight: data }
    })
  } catch (e) {
    next(e)
  }
}
