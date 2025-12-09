import { Hono } from 'hono'
import * as DashboardControllers from '../dashboardData/dashboard-data.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const DashboardRoutes = new Hono()

// Apply admin authentication to all dashboard routes
DashboardRoutes.use('*', adminRoleAuth)

// Get admin dashboard data - MAIN ENDPOINT
DashboardRoutes.get('/dashboard/admin', DashboardControllers.getAdminDashboardData)

// Get dashboard statistics
DashboardRoutes.get('/dashboard/stats', DashboardControllers.getDashboardStats)

// Get recent bookings
DashboardRoutes.get('/dashboard/recent-bookings', DashboardControllers.getRecentBookings)

// Get all bookings for admin
DashboardRoutes.get('/dashboard/bookings', DashboardControllers.getAllBookings)

// Get top vehicles
DashboardRoutes.get('/dashboard/top-vehicles', DashboardControllers.getTopVehicles)

// Get monthly revenue
DashboardRoutes.get('/dashboard/monthly-revenue', DashboardControllers.getMonthlyRevenue)

// Test endpoint for debugging
DashboardRoutes.get('/dashboard/test-data', DashboardControllers.testDashboardData)

export default DashboardRoutes