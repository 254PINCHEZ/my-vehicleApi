// src/index.ts
import { serve } from '@hono/node-server';
import { type Context, Hono } from 'hono';
import { logger } from 'hono/logger'; 
import * as dotenv from 'dotenv';
import { prometheus } from '@hono/prometheus'; 
import { limiter } from './middleware/ratelimiter.ts'; 
import { adminRoleAuth } from './middleware/bearauth.ts'; 
import initDatabaseConnection from './db/dbconfig.ts'; 

// Import routes
import authRoutes from './Auth/auth.routes.ts';
import userRoutes from './users/users.routes.ts';
import vehicleRoutes from './vehicles/vehicles.routes.ts';
import vehiclespecRoutes from './vehiclespecs/vehiclespecs.routes.ts';
import locationRoutes from './locations/locations.routes.ts';
import bookingRoutes from './bookings/bookings.routes.ts';
import paymentRoutes from './payments/payments.routes.ts';
import ticketRoutes from './tickets/tickets.routes.ts';
import DashboardRoutes from './dashboardData/dashboard-data.routes.ts';
import AnalyticsRoutes from './Analytics/Analytics.routes.ts';

// ✅ NEW: Import Support Routes
import SupportRoutes from './support tickets/Support.route.ts';

// Import controllers for admin routes
import { getAllUsers } from './users/users.controller.ts';
import { getAllVehicles } from './vehicles/vehicles.controller.ts';
import { getAllBookings } from './bookings/bookings.controller.ts';
import { getAllPayments } from './payments/payments.controller.ts';
import { getAllTickets } from './tickets/tickets.controller.ts';

import { cors } from 'hono/cors'; 

dotenv.config(); 

const app = new Hono();

// MIDDLEWARE CONFIGURATION 

// Prometheus Metrics
const { registerMetrics, printMetrics } = prometheus(); 
app.use('*', registerMetrics); 
app.get('/metrics', printMetrics); 

// Logger Middleware
app.use('*', logger());

// CORS Middleware
app.use('*', cors());

// Rate Limiting
app.use('/api/*', limiter); 

// BASE ROUTE 
app.get('/', (c) => {
    return c.text('Vehicle Rental Management System API is running. Welcome to Hono!');
});

// API ROUTES REGISTRATION 
app.route('/api/auth', authRoutes); 
app.route('/api', userRoutes); 
app.route('/api', vehicleRoutes); 
app.route('/api', vehiclespecRoutes); 
app.route('/api', locationRoutes); 
app.route('/api', bookingRoutes); 
app.route('/api', paymentRoutes); 
app.route('/api', ticketRoutes); 

// Dashboard Routes
app.route('/api', DashboardRoutes);

// ✅ ADD: Support Routes
app.route('/api/support', SupportRoutes);

// Analytics Routes (Register at multiple endpoints for flexibility)
app.route('/api/analytics', AnalyticsRoutes); // Main endpoint: /api/analytics
app.route('/analytics', AnalyticsRoutes); // Alternative: /analytics
app.route('/dashboard/analytics', AnalyticsRoutes); // For dashboard: /dashboard/analytics

// ADMIN API 
const adminApi = new Hono();

// admin-only authorization middleware to all routes
adminApi.use('*', adminRoleAuth);

// admin endpoints to get all data
adminApi.get('/users', getAllUsers); 
adminApi.get('/vehicles', getAllVehicles); 
adminApi.get('/bookings', getAllBookings); 
adminApi.get('/payments', getAllPayments); 
adminApi.get('/tickets', getAllTickets); 

// mount admin API
app.route('/api/admin', adminApi);

// Health check endpoints
app.get('/api/dashboard/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'Dashboard endpoint is accessible',
        timestamp: new Date().toISOString()
    });
});

app.get('/api/analytics/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'Analytics endpoint is accessible',
        timestamp: new Date().toISOString()
    });
});

// ✅ ADD: Support Health Check
app.get('/api/support/health', (c) => {
    return c.json({
        status: 'ok',
        message: 'Support endpoint is accessible',
        timestamp: new Date().toISOString()
    });
});

// Debug endpoint to list all available endpoints
app.get('/api/endpoints', (c) => {
    return c.json({
        // ✅ UPDATED: Added Support Endpoints
        support: {
            main: '/api/support',
            endpoints: [
                'GET    /api/support/tickets',
                'GET    /api/support/tickets/:ticket_id',
                'GET    /api/support/tickets/customer/:customer_id',
                'POST   /api/support/tickets',
                'PATCH  /api/support/tickets/:ticket_id/status',
                'PATCH  /api/support/tickets/:ticket_id/priority',
                'PATCH  /api/support/tickets/:ticket_id/assign',
                'DELETE /api/support/tickets/:ticket_id',
                'GET    /api/support/tickets/:ticket_id/replies',
                'POST   /api/support/tickets/:ticket_id/replies',
                'PATCH  /api/support/tickets/:ticket_id/resolve',
                'PATCH  /api/support/tickets/:ticket_id/reopen',
                'GET    /api/support/stats',
                'GET    /api/support/tickets/search',
                'GET    /api/support/health',
                'GET    /api/support/test-data'
            ]
        },
        analytics: {
            main: '/api/analytics',
            alternatives: [
                '/analytics',
                '/dashboard/analytics'
            ],
            endpoints: [
                'GET /api/analytics/?period=month',
                'GET /api/analytics/stats?period=month',
                'GET /api/analytics/monthly-revenue?months=6',
                'GET /api/analytics/booking-trends?period=month',
                'GET /api/analytics/user-growth?period=month',
                'GET /api/analytics/top-vehicles?limit=5&period=month',
                'GET /api/analytics/vehicle-types?period=month',
                'GET /api/analytics/kpis?period=month',
                'GET /api/analytics/health',
                'GET /api/analytics/test-data'
            ]
        },
        dashboard: {
            main: '/api/dashboard/admin',
            endpoints: [
                'GET /api/dashboard/admin',
                'GET /api/dashboard/stats',
                'GET /api/dashboard/recent-bookings',
                'GET /api/dashboard/bookings',
                'GET /api/dashboard/top-vehicles',
                'GET /api/dashboard/monthly-revenue',
                'GET /api/dashboard/health',
                'GET /api/dashboard/test-data'
            ]
        },
        admin: {
            main: '/api/admin',
            endpoints: [
                'GET /api/admin/users',
                'GET /api/admin/vehicles',
                'GET /api/admin/bookings',
                'GET /api/admin/payments',
                'GET /api/admin/tickets'
            ]
        }
    });
});

// START SERVER
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize database and start server
initDatabaseConnection()
  .then(() => {
    console.log("✅ Database connected successfully");
    
    // Log all available routes
    console.log("\n📋 Available Routes:");
    console.log("==================");
    
    // ✅ NEW: Support Routes
    console.log("\n🎫 SUPPORT ROUTES:");
    console.log("• GET    /api/support/tickets");
    console.log("• GET    /api/support/tickets/:ticket_id");
    console.log("• GET    /api/support/tickets/customer/:customer_id");
    console.log("• POST   /api/support/tickets");
    console.log("• PATCH  /api/support/tickets/:ticket_id/status");
    console.log("• PATCH  /api/support/tickets/:ticket_id/priority");
    console.log("• PATCH  /api/support/tickets/:ticket_id/assign");
    console.log("• DELETE /api/support/tickets/:ticket_id");
    console.log("• GET    /api/support/tickets/:ticket_id/replies");
    console.log("• POST   /api/support/tickets/:ticket_id/replies");
    console.log("• PATCH  /api/support/tickets/:ticket_id/resolve");
    console.log("• PATCH  /api/support/tickets/:ticket_id/reopen");
    console.log("• GET    /api/support/stats");
    console.log("• GET    /api/support/tickets/search");
    console.log("• GET    /api/support/health");
    console.log("• GET    /api/support/test-data");
    
    // Dashboard Routes
    console.log("\n📊 DASHBOARD ROUTES:");
    console.log("• GET  /api/dashboard/admin");
    console.log("• GET  /api/dashboard/stats");
    console.log("• GET  /api/dashboard/recent-bookings");
    console.log("• GET  /api/dashboard/bookings");
    console.log("• GET  /api/dashboard/top-vehicles");
    console.log("• GET  /api/dashboard/monthly-revenue");
    console.log("• GET  /api/dashboard/health");
    console.log("• GET  /api/dashboard/test-data");
    
    // Analytics Routes
    console.log("\n📈 ANALYTICS ROUTES:");
    console.log("• GET  /api/analytics/?period=month");
    console.log("• GET  /api/analytics/stats?period=month");
    console.log("• GET  /api/analytics/monthly-revenue?months=6");
    console.log("• GET  /api/analytics/booking-trends?period=month");
    console.log("• GET  /api/analytics/user-growth?period=month");
    console.log("• GET  /api/analytics/top-vehicles?limit=5&period=month");
    console.log("• GET  /api/analytics/vehicle-types?period=month");
    console.log("• GET  /api/analytics/kpis?period=month");
    console.log("• GET  /api/analytics/health");
    console.log("• GET  /api/analytics/test-data");
    
    // Admin Routes
    console.log("\n👑 ADMIN ROUTES:");
    console.log("• GET  /api/admin/users");
    console.log("• GET  /api/admin/vehicles");
    console.log("• GET  /api/admin/bookings");
    console.log("• GET  /api/admin/payments");
    console.log("• GET  /api/admin/tickets");
    
    // Other Routes
    console.log("\n🔧 OTHER ROUTES:");
    console.log("• GET  /api/endpoints (List all endpoints)");
    console.log("• GET  /metrics (Prometheus metrics)");
    console.log("==================");
    
    serve({
      fetch: app.fetch,
      port: PORT
    }, (info) => {
      console.log(`\n******************************************************`);
      console.log(`🚀 API Server is running on http://localhost:${info.port}`);
      console.log(`🎫 Support: http://localhost:${info.port}/api/support/tickets`);
      console.log(`📊 Dashboard: http://localhost:${info.port}/api/dashboard/admin`);
      console.log(`📈 Analytics: http://localhost:${info.port}/api/analytics/?period=month`);
      console.log(`👑 Admin: http://localhost:${info.port}/api/admin/users`);
      console.log(`📋 Endpoints list: http://localhost:${info.port}/api/endpoints`);
      console.log(`📊 Prometheus: http://localhost:${info.port}/metrics`);
      console.log(`******************************************************`);
      
      // Test message for frontend
      console.log(`\n💡 For your frontend support system, use these endpoints:`);
      console.log(`1. All tickets: http://localhost:${info.port}/api/support/tickets`);
      console.log(`2. Support stats: http://localhost:${info.port}/api/support/stats`);
      console.log(`3. Health check: http://localhost:${info.port}/api/support/health`);
      console.log(`4. Test data: http://localhost:${info.port}/api/support/test-data`);
      
      console.log(`\n📱 Example: http://localhost:${info.port}/api/support/tickets`);
    });
  })
  .catch((error) => {
    console.error('❌ Fatal Error: Failed to start application:', error);
    process.exit(1);
  });