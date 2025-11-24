import jwt from 'jsonwebtoken'
import { findByEmail, verifyPassword } from '../services/userService.js'

const SECRET = process.env.ACCESS_TOKEN_KEY || 'supersecret'

export async function login(req, res, next) {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        status: 'fail',
        message: 'email and password are required'
      })
    }

    const user = await findByEmail(email)
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'invalid credentials'
      })
    }

    const ok = await verifyPassword(password, user.password)
    if (!ok) {
      return res.status(401).json({
        status: 'fail',
        message: 'invalid credentials'
      })
    }

    const payload = { id: user.id, email: user.email }
    const token = jwt.sign(payload, SECRET, { expiresIn: '1h' })

    return res.json({
      status: 'success',
      data: {
        access_token: token,
        token_type: 'bearer',
        user: {
          id: user.id,
          email: user.email,
          name: user.name
        }
      }
    })
  } catch (err) {
    next(err)
  }
}

export async function me(req, res, next) {
  try {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Unauthorized'
      })
    }

    return res.json({
      status: 'success',
      data: {
        user: {
          id: req.user.id,
          email: req.user.email
        }
      }
    })
  } catch (err) {
    next(err)
  }
}