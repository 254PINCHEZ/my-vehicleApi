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

// START SERVER
const PORT = parseInt(process.env.PORT || '3001', 10);

// Initialize database and start server
initDatabaseConnection()
  .then(() => {
    console.log("✅ Database connected successfully");
    
    serve({
      fetch: app.fetch,
      port: PORT
    }, (info) => {
      console.log(`\n******************************************************`);
      console.log(`🚀 API Server is running on http://localhost:${info.port}`);
      console.log(`Routes available at: http://localhost:${info.port}/api`);
      console.log(`Admin routes at: http://localhost:${info.port}/api/admin`);
      console.log(`Metrics available at: http://localhost:${info.port}/metrics`);
      console.log(`******************************************************`);
    });
  })
  .catch((error) => {
    console.error('❌ Fatal Error: Failed to start application:', error);
    process.exit(1);
  });