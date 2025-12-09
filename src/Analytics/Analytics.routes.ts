// src/routes/analytics.routes.ts
import { Hono } from 'hono'
import * as AnalyticsControllers from '../Analytics/Analytics.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const AnalyticsRoutes = new Hono()

// Apply admin authentication to all analytics routes
AnalyticsRoutes.use('*', adminRoleAuth)

// Get comprehensive analytics data - MAIN ENDPOINT
AnalyticsRoutes.get('/', AnalyticsControllers.getAnalyticsData)

// Get analytics statistics
AnalyticsRoutes.get('/stats', AnalyticsControllers.getAnalyticsStats)

// Get monthly revenue for analytics
AnalyticsRoutes.get('/monthly-revenue', AnalyticsControllers.getAnalyticsMonthlyRevenue)

// Get booking trends
AnalyticsRoutes.get('/booking-trends', AnalyticsControllers.getBookingTrends)

// Get user growth
AnalyticsRoutes.get('/user-growth', AnalyticsControllers.getUserGrowth)

// Get top performing vehicles
AnalyticsRoutes.get('/top-vehicles', AnalyticsControllers.getTopPerformingVehicles)

// Get popular vehicle types
AnalyticsRoutes.get('/vehicle-types', AnalyticsControllers.getPopularVehicleTypes)

// Get KPI metrics
AnalyticsRoutes.get('/kpis', AnalyticsControllers.getKpiMetrics)

// Health check endpoint
AnalyticsRoutes.get('/health', AnalyticsControllers.getAnalyticsHealth)

// Test endpoint for debugging
AnalyticsRoutes.get('/test-data', AnalyticsControllers.testAnalyticsData)

export default AnalyticsRoutes