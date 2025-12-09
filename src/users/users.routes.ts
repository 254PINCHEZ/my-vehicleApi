import { Hono } from 'hono'
import * as userControllers from './users.controller.ts'
import { adminRoleAuth, customerRoleAuth } from '../middleware/bearauth.ts'

const userRoutes = new Hono()

// Change password (customer only)
userRoutes.put('/users/change-password', customerRoleAuth, userControllers.changePassword) 

// Create user
userRoutes.post('/users', userControllers.createUser) 

// Get all users
userRoutes.get('/users', adminRoleAuth, userControllers.getAllUsers)

// Get user by ID
userRoutes.get('/users/:user_id', adminRoleAuth, userControllers.getUserById)

// Update user (full update - PUT)
userRoutes.put('/users/:user_id', adminRoleAuth, userControllers.updateUser)

// Update user (partial update - PATCH)
userRoutes.patch('/users/:user_id', adminRoleAuth, userControllers.patchUser)

// Delete user
userRoutes.delete('/users/:user_id', adminRoleAuth, userControllers.deleteUser)

// Update user role only (specific PATCH endpoint)
userRoutes.patch('/user-status/:user_id', adminRoleAuth, userControllers.updateUserRole)

export default userRoutes