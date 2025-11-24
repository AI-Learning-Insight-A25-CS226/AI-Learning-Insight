import jwt from 'jsonwebtoken'

const SECRET = process.env.ACCESS_TOKEN_KEY || 'supersecret'

export function requireAuth(req, res, next) {
  const auth = req.headers.authorization || ''
  const [, token] = auth.split(' ')

  if (!token) {
    return res.status(401).json({ status: 'fail', message: 'Unauthorized' })
  }

  try {
    const payload = jwt.verify(token, SECRET)
    req.user = { 
      id: payload.developerId,
      developerId: payload.developerId,
      email: payload.email 
    }    
    next()
  } catch (err) {
    console.log('JWT verify failed:', err.message)
    return res.status(401).json({ status: 'fail', message: 'Token tidak valid' })
  }
}