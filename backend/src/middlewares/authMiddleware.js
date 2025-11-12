import jwt from 'jsonwebtoken'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const [, token] = auth.split(' ')
  if (!token) return res.status(401).json({ status: 'fail', message: 'Unauthorized' })
  try {
    const payload = jwt.verify(token, process.env.ACCESS_TOKEN_KEY)
    req.user = { id: payload.id, email: payload.email }
    next()
  } catch (err) {
    console.log('JWT verify failed:', err.message)
    return res.status(401).json({ status: 'fail', message: 'Token tidak valid' })
  }
}  