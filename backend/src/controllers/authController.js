import * as users from '../services/userService.js'
import jwt from 'jsonwebtoken'

function signToken(payload) {
  return jwt.sign(payload, process.env.ACCESS_TOKEN_KEY, {
    expiresIn: Number(process.env.ACCESS_TOKEN_AGE || 900)
  })
}

export async function me(req, res) {
  return res.json({
    status: 'success',
    data: { user: req.user }
  })
}

export async function register(req, res, next) {
  try {
    const { email, password, name } = req.body
    const { user } = await users.createUser({ email, password, name })

    const token = jwt.sign({ id: user.id, email: user.email }, process.env.ACCESS_TOKEN_KEY, { expiresIn: '1h' })
    res.status(201).json({ status: 'success', data: { user, token } })
  } catch (err) {
    if (err?.code === '23505') {
      return res.status(409).json({ status: 'fail', message: 'email sudah digunakan' })
    }
    return next(err)
  }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ status: 'fail', message: 'email & password wajib' })
    }

    const user = await users.findByEmail(email)
    if (!user) return res.status(401).json({ status: 'fail', message: 'email / password salah' })
    const ok = await users.verifyPassword(user, password)
    if (!ok) return res.status(401).json({ status: 'fail', message: 'email / password salah' })


    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.ACCESS_TOKEN_KEY,
      { expiresIn: '1h' }
    )

    return res.json({
      status: 'success',
      data: { user: { id: user.id, email: user.email, name: user.name }, token }
    })
  } catch (err) {
    next(err)
  }
}