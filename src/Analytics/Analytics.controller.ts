// src/controllers/analytics.controller.ts
import type { Context } from "hono";
import * as analyticsService from "../Analytics/Analytics.service.ts";

// ✅ Get analytics data - MAIN ENDPOINT
export const getAnalyticsData = async (c: Context) => {
  try {
    const period = c.req.query("period") as 'day' | 'week' | 'month' | 'quarter' | 'year' || 'month';
    console.log(`🔄 Fetching analytics data for period: ${period}...`);
    
    const analyticsData = await analyticsService.getAnalyticsData(period);
    
    console.log('✅ Analytics data fetched successfully:', {
      totalRevenue: analyticsData.totalRevenue,
      totalBookings: analyticsData.totalBookings,
      totalUsers: analyticsData.totalUsers,
      activeVehicles: analyticsData.activeVehicles
    });
    
    return c.json({
      success: true,
      data: analyticsData,
      message: "Analytics data retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching analytics data:", error.message);
    console.error("Full error:", error);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch analytics data",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ Get analytics statistics
export const getAnalyticsStats = async (c: Context) => {
  try {
    const period = c.req.query("period") || 'month';
    
    const stats = await analyticsService.getAnalyticsStats(period);
    
    return c.json({
      success: true,
      data: stats,
      message: "Analytics statistics retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching analytics statistics:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch analytics statistics" 
    }, 500);
  }
};

// ✅ Get monthly revenue for analytics
export const getAnalyticsMonthlyRevenue = async (c: Context) => {
  try {
    const months = c.req.query("months");
    const monthlyRevenue = await analyticsService.getAnalyticsMonthlyRevenue(
      months ? parseInt(months) : 6
    );
    
    return c.json({
      success: true,
      data: monthlyRevenue,
      count: monthlyRevenue.length,
      message: "Monthly revenue data retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching monthly revenue:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch monthly revenue" 
    }, 500);
  }
};

// ✅ Get booking trends
export const getBookingTrends = async (c: Context) => {
  try {
    const period = c.req.query("period") || 'month';
    
    const bookingTrends = await analyticsService.getBookingTrends(period);
    
    return c.json({
      success: true,
      data: bookingTrends,
      count: bookingTrends.length,
      message: "Booking trends retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching booking trends:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch booking trends" 
    }, 500);
  }
};

// ✅ Get user growth
export const getUserGrowth = async (c: Context) => {
  try {
    const period = c.req.query("period") || 'month';
    
    const userGrowth = await analyticsService.getUserGrowth(period);
    
    return c.json({
      success: true,
      data: userGrowth,
      count: userGrowth.length,
      message: "User growth data retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching user growth:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch user growth" 
    }, 500);
  }
};

// ✅ Get top performing vehicles
export const getTopPerformingVehicles = async (c: Context) => {
  try {
    const limit = c.req.query("limit");
    const period = c.req.query("period") || 'month';
    
    const topVehicles = await analyticsService.getTopPerformingVehicles(
      limit ? parseInt(limit) : 5,
      period
    );
    
    return c.json({
      success: true,
      data: topVehicles,
      count: topVehicles.length,
      message: "Top performing vehicles retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching top performing vehicles:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch top performing vehicles" 
    }, 500);
  }
};

// ✅ Get popular vehicle types
export const getPopularVehicleTypes = async (c: Context) => {
  try {
    const period = c.req.query("period") || 'month';
    
    const vehicleTypes = await analyticsService.getPopularVehicleTypes(period);
    
    return c.json({
      success: true,
      data: vehicleTypes,
      count: vehicleTypes.length,
      message: "Popular vehicle types retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching popular vehicle types:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch popular vehicle types" 
    }, 500);
  }
};

// ✅ Get KPI metrics
export const getKpiMetrics = async (c: Context) => {
  try {
    const period = c.req.query("period") || 'month';
    
    const kpiMetrics = await analyticsService.getKpiMetrics(period);
    
    return c.json({
      success: true,
      data: kpiMetrics,
      message: "KPI metrics retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching KPI metrics:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to fetch KPI metrics" 
    }, 500);
  }
};

// ✅ Health check endpoint for analytics
export const getAnalyticsHealth = async (c: Context) => {
  try {
    return c.json({
      success: true,
      message: "Analytics API is operational",
      status: "healthy",
      timestamp: new Date().toISOString()
    }, 200);
  } catch (error: any) {
    console.error("❌ Analytics health check error:", error.message);
    return c.json({ 
      success: false,
      error: "Analytics API health check failed" 
    }, 500);
  }
};

// ✅ Test endpoint to verify analytics data
export const testAnalyticsData = async (c: Context) => {
  try {
    const db = await import("../db/dbconfig.ts").then(module => module.getDbPool());
    
    const testQueries = {
      totalRevenue: "SELECT SUM(total_amount) as revenue FROM Bookings WHERE booking_status = 'completed'",
      totalBookings: 'SELECT COUNT(*) as count FROM Bookings',
      totalUsers: 'SELECT COUNT(*) as count FROM Users WHERE role != "admin"',
      activeVehicles: 'SELECT COUNT(*) as count FROM Vehicles WHERE availability = 1',
      vehicleCategories: 'SELECT DISTINCT category FROM VehicleSpecification',
      recentAnalytics: 'SELECT TOP 5 * FROM Bookings ORDER BY created_at DESC'
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
      message: 'Analytics database test results',
      timestamp: new Date().toISOString(),
      data: results
    }, 200);
  } catch (error: any) {
    console.error("❌ Error testing analytics data:", error.message);
    return c.json({ 
      success: false,
      error: "Failed to test analytics data" 
    }, 500);
  }
};