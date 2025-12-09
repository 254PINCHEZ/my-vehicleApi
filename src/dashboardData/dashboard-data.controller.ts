import type { Context } from "hono";
import * as dashboardService from "../dashboardData/dashboard-data.service.ts";

// ✅ Get admin dashboard data - MAIN ENDPOINT
export const getAdminDashboardData = async (c: Context) => {
  try {
    console.log('🔄 Fetching admin dashboard data...');
    const dashboardData = await dashboardService.getAdminDashboardData();
    
    console.log('✅ Dashboard data fetched successfully:', {
      totalBookings: dashboardData.totalBookings,
      totalRevenue: dashboardData.totalRevenue,
      totalUsers: dashboardData.totalUsers,
      activeVehicles: dashboardData.activeVehicles
    });
    
    return c.json({
      success: true,
      data: dashboardData,
      message: "Dashboard data retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching dashboard data:", error.message);
    console.error("Full error:", error);
    
    // Return a proper error response
    return c.json({ 
      success: false,
      error: "Failed to fetch dashboard data",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ Get recent bookings
export const getRecentBookings = async (c: Context) => {
  try {
    const limit = c.req.query("limit");
    const recentBookings = await dashboardService.getRecentBookings(
      limit ? parseInt(limit) : 10
    );
    return c.json({
      success: true,
      data: recentBookings,
      count: recentBookings.length
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching recent bookings:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch recent bookings" 
    }, 500);
  }
};

// ✅ Get all bookings for admin
export const getAllBookings = async (c: Context) => {
  try {
    const bookings = await dashboardService.getAllBookingsForAdmin();
    return c.json({
      success: true,
      data: bookings,
      count: bookings.length
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching all bookings:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch all bookings" 
    }, 500);
  }
};

// ✅ Get dashboard statistics
export const getDashboardStats = async (c: Context) => {
  try {
    const stats = await dashboardService.getDashboardStats();
    return c.json({
      success: true,
      data: stats
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching dashboard statistics:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch dashboard statistics" 
    }, 500);
  }
};

// ✅ Get top vehicles
export const getTopVehicles = async (c: Context) => {
  try {
    const limit = c.req.query("limit");
    const topVehicles = await dashboardService.getTopVehicles(
      limit ? parseInt(limit) : 5
    );
    return c.json({
      success: true,
      data: topVehicles,
      count: topVehicles.length
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching top vehicles:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch top vehicles" 
    }, 500);
  }
};

// ✅ Get monthly revenue
export const getMonthlyRevenue = async (c: Context) => {
  try {
    const months = c.req.query("months");
    const monthlyRevenue = await dashboardService.getMonthlyRevenue(
      months ? parseInt(months) : 6
    );
    return c.json({
      success: true,
      data: monthlyRevenue,
      count: monthlyRevenue.length
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching monthly revenue:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch monthly revenue" 
    }, 500);
  }
};

// ✅ Test endpoint to verify data
export const testDashboardData = async (c: Context) => {
  try {
    const db = await import("../db/dbconfig.ts").then(module => module.getDbPool());
    
    const testQueries = {
      totalBookings: 'SELECT COUNT(*) as count FROM Bookings',
      totalRevenue: "SELECT SUM(total_amount) as revenue FROM Bookings WHERE booking_status = 'completed'",
      totalUsers: 'SELECT COUNT(*) as count FROM Users',
      activeVehicles: 'SELECT COUNT(*) as count FROM Vehicles WHERE availability = 1',
      bookingStatus: 'SELECT booking_status, COUNT(*) as count FROM Bookings GROUP BY booking_status',
      recentBookings: 'SELECT TOP 5 booking_id, total_amount, booking_status FROM Bookings ORDER BY created_at DESC'
    };
    
    const results: any = {};
    
    for (const [key, query] of Object.entries(testQueries)) {
      try {
        const result = await db.request().query(query);
        results[key] = result.recordset;
      } catch (error: any) {
        results[key] = { error: error.message };
      }
    }
    
    return c.json({
      success: true,
      message: 'Database test results',
      timestamp: new Date().toISOString(),
      data: results
    }, 200);
  } catch (error: any) {
    console.error("❌ Error testing dashboard data:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to test dashboard data" 
    }, 500);
  }
};