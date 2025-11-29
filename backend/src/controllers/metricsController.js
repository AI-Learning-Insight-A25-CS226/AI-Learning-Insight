import { getMetricsByDeveloperId, upsertDirect, getOverviewMetrics, getWeeklyProgress, getHistoricalPerformance }
from '../services/metricsService.js'

export async function getMetrics (req, res, next) {
  try {
    const { developerId } = req.params
    const data = await getMetricsByDeveloperId(developerId)

    if (!data) {
      return res.status(404).json({
        status: 'fail',
        message: 'Metrics not found'
      })
    }

    return res.json({
      status: 'success',
      data
    })
  } catch (err) {
    next(err)
  }
}

export async function upsertMetrics (req, res, next) {
  try {
    const { developerId } = req.params
    const metrics = req.body

    const data = await upsertDirect({ developerId, metrics })

    return res.json({
      status: 'success',
      data
    })
  } catch (err) {
    next(err)
  }
}

export async function getMetricsOverview (req, res, next) {
  try {
    const { developerId } = req.params
    const data = await getOverviewMetrics(developerId)

    if (!data) {
      return res.status(404).json({
        status: 'fail',
        message: 'Metrics overview not found'
      })
    }

    return res.json({
      status: 'success',
      data
    })
  } catch (err) {
    next(err)
  }
}

export async function getWeeklyProgressHandler (req, res, next) {
  try {
    const { developerId } = req.params
    const data = await getWeeklyProgress(developerId)

    return res.json({
      status: 'success',
      data
    })
  } catch (err) {
    next(err)
  }
}

export async function getHistoricalPerformanceHandler (req, res, next) {
  try {
    const { developerId } = req.params
    const data = await getHistoricalPerformance(developerId)

    return res.json({
      status: 'success',
      data
    })
  } catch (err) {
    next(err)
  }
}