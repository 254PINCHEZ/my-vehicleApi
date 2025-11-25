import { Hono } from 'hono'
import * as UserControllers from '../users/users.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const UserRoutes = new Hono()

// Get all users
UserRoutes.get('/users',  UserControllers.getAllUsers)

// Get user by user id
UserRoutes.get('/users/:user_id',  UserControllers.getUserById)

// Create a user
UserRoutes.post('/users', UserControllers.createUser)

// Update user by user id
UserRoutes.put('/users/:user_id',  UserControllers.updateUser)

// Delete user by user id
UserRoutes.delete('/users/:user_id',  UserControllers.deleteUser)

export default UserRoutes