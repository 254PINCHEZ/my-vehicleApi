import { Hono } from 'hono'
import * as authControllers from '../Auth/auth.controller.ts'

const authRoutes = new Hono()

// Register new user
authRoutes.post('/register', authControllers.register)

// Login user
authRoutes.post('/login', authControllers.login)

// Verify email
authRoutes.post('/verify', authControllers.verify)

// Refresh token
authRoutes.post('/refresh', authControllers.refresh)

// Forgot password
authRoutes.post('/forgot-password', authControllers.forgotPassword)

export default authRoutes