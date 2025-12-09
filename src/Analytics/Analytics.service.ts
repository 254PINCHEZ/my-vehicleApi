// src/services/analytics.service.ts
import { getDbPool } from "../db/dbconfig.ts";

// Interfaces matching your frontend expectations
export interface AnalyticsData {
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeVehicles: number;
  revenueChange: number;
  bookingChange: number;
  userChange: number;
  utilizationChange: number;
  monthlyRevenue: Array<{ month: string; revenue: number }>;
  bookingTrends: Array<{ date: string; count: number }>;
  userGrowth: Array<{ date: string; count: number }>;
  topPerformingVehicles: Array<{ 
    vehicle_id: string; 
    name: string; 
    revenue: number; 
    bookings: number;
    utilization: number;
  }>;
  popularVehicleTypes: Array<{ 
    type: string; 
    count: number; 
    revenue: number;
  }>;
}

export interface TopPerformingVehicle {
  vehicle_id: string;
  name: string;
  revenue: number;
  bookings: number;
  utilization: number;
}

export interface PopularVehicleType {
  type: string;
  count: number;
  revenue: number;
}

// GET ANALYTICS DATA
export const getAnalyticsData = async (period: 'day' | 'week' | 'month' | 'quarter' | 'year' = 'month'): Promise<AnalyticsData> => {
  try {
    console.log(`📊 Fetching analytics data for period: ${period}...`);
    
    // Get basic stats
    const stats = await getAnalyticsStats(period);
    
    // Get monthly revenue (last 6 months)
    const monthlyRevenue = await getAnalyticsMonthlyRevenue(6);
    
    // Get booking trends
    const bookingTrends = await getBookingTrends(period);
    
    // Get user growth
    const userGrowth = await getUserGrowth(period);
    
    // Get top performing vehicles (top 5)
    const topPerformingVehicles = await getTopPerformingVehicles(5, period);
    
    // Get popular vehicle types
    const popularVehicleTypes = await getPopularVehicleTypes(period);

    console.log('✅ Analytics data fetched successfully');
    
    return {
      ...stats,
      monthlyRevenue,
      bookingTrends,
      userGrowth,
      topPerformingVehicles,
      popularVehicleTypes
    };
  } catch (error: any) {
    console.error('❌ Error in getAnalyticsData:', error.message);
    throw error;
  }
};

// GET ANALYTICS STATISTICS
export const getAnalyticsStats = async (period: string): Promise<{
  totalRevenue: number;
  totalBookings: number;
  totalUsers: number;
  activeVehicles: number;
  revenueChange: number;
  bookingChange: number;
  userChange: number;
  utilizationChange: number;
}> => {
  const db = await getDbPool();

  // Calculate date range based on period
  const dateRange = calculateDateRange(period);
  
  const query = `
    -- Current Period Stats
    SELECT 
      -- Total Revenue (current period)
      COALESCE(SUM(CASE WHEN b.booking_status = 'completed' AND b.created_at >= @startDate THEN b.total_amount ELSE 0 END), 0) as current_revenue,
      
      -- Total Bookings (current period)
      COUNT(DISTINCT CASE WHEN b.created_at >= @startDate THEN b.booking_id END) as current_bookings,
      
      -- Total Users (current period)
      (SELECT COUNT(*) FROM Users WHERE created_at >= @startDate) as current_users,
      
      -- Active Vehicles (available for rent)
      (SELECT COUNT(*) FROM Vehicles WHERE availability = 1) as active_vehicles
      
    FROM Bookings b
  `;

  console.log(`📈 Executing analytics stats query for period: ${period}...`);
  
  try {
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    const row = result.recordset[0];
    
    console.log('📊 Analytics stats raw data:', row);

    // Get previous period data for percentage changes
    const previousPeriod = await getPreviousPeriodStats(dateRange);
    
    console.log('📅 Previous period stats:', previousPeriod);
    
    const stats = {
      totalRevenue: parseFloat(row.current_revenue) || 0,
      totalBookings: parseInt(row.current_bookings) || 0,
      totalUsers: parseInt(row.current_users) || 0,
      activeVehicles: parseInt(row.active_vehicles) || 0,
      
      // Calculate percentage changes
      revenueChange: calculatePercentageChange(parseFloat(row.current_revenue) || 0, previousPeriod.previousRevenue || 0),
      bookingChange: calculatePercentageChange(parseInt(row.current_bookings) || 0, previousPeriod.previousBookings || 0),
      userChange: calculatePercentageChange(parseInt(row.current_users) || 0, previousPeriod.previousUsers || 0),
      utilizationChange: calculateUtilizationChange(parseInt(row.active_vehicles) || 0, previousPeriod.previousActiveVehicles || 0)
    };
    
    console.log('✅ Final analytics stats:', stats);
    
    return stats;
  } catch (error: any) {
    console.error('❌ Error in getAnalyticsStats query:', error.message);
    console.error('SQL Error:', error);
    
    // Return default values if query fails
    return {
      totalRevenue: 0,
      totalBookings: 0,
      totalUsers: 0,
      activeVehicles: 0,
      revenueChange: 0,
      bookingChange: 0,
      userChange: 0,
      utilizationChange: 0
    };
  }
};

// GET ANALYTICS MONTHLY REVENUE
export const getAnalyticsMonthlyRevenue = async (months: number = 6): Promise<Array<{ month: string; revenue: number }>> => {
  const db = await getDbPool();

  const query = `
    WITH months AS (
      SELECT TOP ${months} 
        FORMAT(DATEADD(MONTH, -ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 1, GETDATE()), 'MMM yyyy') as month
      FROM sys.objects
    )
    SELECT 
      m.month,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM months m
    LEFT JOIN Bookings b ON FORMAT(b.created_at, 'MMM yyyy') = m.month 
      AND b.booking_status = 'completed'
    GROUP BY m.month
    ORDER BY m.month DESC
  `;

  try {
    const result = await db.request().query(query);
    console.log(`✅ Found ${result.recordset.length} months of revenue data`);

    return result.recordset.map((row: any) => ({
      month: row.month || '',
      revenue: parseFloat(row.revenue) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getAnalyticsMonthlyRevenue query:', error.message);
    return [];
  }
};

// GET BOOKING TRENDS
export const getBookingTrends = async (period: string): Promise<Array<{ date: string; count: number }>> => {
  const db = await getDbPool();
  const dateRange = calculateDateRange(period);
  
  let groupByClause = '';
  let formatPattern = '';
  
  switch (period) {
    case 'day':
      groupByClause = 'FORMAT(b.created_at, \'HH:00\')';
      formatPattern = 'HH:00';
      break;
    case 'week':
      groupByClause = 'FORMAT(b.created_at, \'yyyy-MM-dd\')';
      formatPattern = 'yyyy-MM-dd';
      break;
    default: // month, quarter, year
      groupByClause = 'FORMAT(b.created_at, \'yyyy-MM-dd\')';
      formatPattern = 'yyyy-MM-dd';
  }

  const query = `
    SELECT 
      ${groupByClause} as date,
      COUNT(b.booking_id) as count
    FROM Bookings b
    WHERE b.created_at >= @startDate
      AND b.created_at <= @endDate
    GROUP BY ${groupByClause}
    ORDER BY date ASC
  `;

  try {
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    
    return result.recordset.map((row: any) => ({
      date: row.date || '',
      count: parseInt(row.count) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getBookingTrends query:', error.message);
    return [];
  }
};

// GET USER GROWTH
export const getUserGrowth = async (period: string): Promise<Array<{ date: string; count: number }>> => {
  const db = await getDbPool();
  const dateRange = calculateDateRange(period);
  
  let groupByClause = 'FORMAT(u.created_at, \'yyyy-MM-dd\')';
  
  switch (period) {
    case 'day':
      groupByClause = 'FORMAT(u.created_at, \'HH:00\')';
      break;
    case 'week':
      groupByClause = 'FORMAT(u.created_at, \'yyyy-MM-dd\')';
      break;
    case 'month':
      groupByClause = 'FORMAT(u.created_at, \'yyyy-MM-dd\')';
      break;
    case 'quarter':
      groupByClause = 'FORMAT(u.created_at, \'yyyy-MM\')';
      break;
    case 'year':
      groupByClause = 'FORMAT(u.created_at, \'yyyy-MM\')';
      break;
  }

  const query = `
    SELECT 
      ${groupByClause} as date,
      COUNT(u.user_id) as count
    FROM Users u
    WHERE u.created_at >= @startDate
      AND u.created_at <= @endDate
      AND u.role != 'admin'
    GROUP BY ${groupByClause}
    ORDER BY date ASC
  `;

  try {
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    
    return result.recordset.map((row: any) => ({
      date: row.date || '',
      count: parseInt(row.count) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getUserGrowth query:', error.message);
    return [];
  }
};

// GET TOP PERFORMING VEHICLES
export const getTopPerformingVehicles = async (limit: number = 5, period: string): Promise<TopPerformingVehicle[]> => {
  const db = await getDbPool();
  const dateRange = calculateDateRange(period);

  const query = `
    SELECT TOP ${limit}
      v.vehicle_id,
      CONCAT(vs.manufacturer, ' ', vs.model) as vehicle_name,
      COALESCE(SUM(b.total_amount), 0) as total_revenue,
      COUNT(b.booking_id) as booking_count,
      ROUND(
        (COUNT(b.booking_id) * 100.0 / 
        NULLIF((SELECT COUNT(*) FROM Bookings WHERE created_at >= @startDate AND created_at <= @endDate), 0)
        ), 2
      ) as utilization
    FROM Vehicles v
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Bookings b ON v.vehicle_id = b.vehicle_id 
      AND b.created_at >= @startDate 
      AND b.created_at <= @endDate
      AND b.booking_status = 'completed'
    GROUP BY v.vehicle_id, vs.manufacturer, vs.model
    ORDER BY total_revenue DESC, booking_count DESC
  `;

  try {
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    console.log(`✅ Found ${result.recordset.length} top performing vehicles`);

    return result.recordset.map((row: any) => ({
      vehicle_id: row.vehicle_id || '',
      name: row.vehicle_name || 'Unknown Vehicle',
      revenue: parseFloat(row.total_revenue) || 0,
      bookings: parseInt(row.booking_count) || 0,
      utilization: parseFloat(row.utilization) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getTopPerformingVehicles query:', error.message);
    return [];
  }
};

// GET POPULAR VEHICLE TYPES
export const getPopularVehicleTypes = async (period: string): Promise<PopularVehicleType[]> => {
  const db = await getDbPool();
  const dateRange = calculateDateRange(period);

  const query = `
    SELECT 
      COALESCE(vs.category, vs.body_type, 'Standard') as vehicle_type,
      COUNT(DISTINCT v.vehicle_id) as vehicle_count,
      COALESCE(SUM(b.total_amount), 0) as total_revenue
    FROM Vehicles v
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Bookings b ON v.vehicle_id = b.vehicle_id 
      AND b.created_at >= @startDate 
      AND b.created_at <= @endDate
      AND b.booking_status = 'completed'
    GROUP BY vs.category, vs.body_type
    ORDER BY total_revenue DESC
  `;

  try {
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    console.log(`✅ Found ${result.recordset.length} popular vehicle types`);

    return result.recordset.map((row: any) => ({
      type: row.vehicle_type || 'Standard',
      count: parseInt(row.vehicle_count) || 0,
      revenue: parseFloat(row.total_revenue) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getPopularVehicleTypes query:', error.message);
    return [];
  }
};

// GET KPI METRICS
export const getKpiMetrics = async (period: string = 'month'): Promise<any> => {
  try {
    const db = await getDbPool();
    const dateRange = calculateDateRange(period);
    
    const query = `
      SELECT 
        -- Conversion Rate: (Bookings / Users) * 100
        ROUND(
          (COUNT(DISTINCT b.booking_id) * 100.0 / 
          NULLIF((SELECT COUNT(*) FROM Users WHERE created_at >= @startDate AND created_at <= @endDate), 0)
          ), 2
        ) as conversion_rate,
        
        -- Average Booking Value
        ROUND(
          COALESCE(AVG(b.total_amount), 0), 2
        ) as avg_booking_value,
        
        -- Peak Hours (mock for now)
        '14:00-18:00' as peak_hours,
        
        -- Customer Satisfaction (mock for now)
        94.2 as customer_satisfaction
      
      FROM Bookings b
      WHERE b.created_at >= @startDate 
        AND b.created_at <= @endDate
        AND b.booking_status = 'completed'
    `;
    
    const request = db.request();
    request.input('startDate', dateRange.startDate);
    request.input('endDate', dateRange.endDate);
    
    const result = await request.query(query);
    const row = result.recordset[0];
    
    return {
      conversionRate: parseFloat(row.conversion_rate) || 0,
      averageBookingValue: parseFloat(row.avg_booking_value) || 0,
      peakHours: row.peak_hours || '14:00-18:00',
      customerSatisfaction: parseFloat(row.customer_satisfaction) || 94.2,
      revenuePerVehicle: 0, // Will be calculated separately
      bookingCompletionRate: 0 // Will be calculated separately
    };
  } catch (error: any) {
    console.error('❌ Error in getKpiMetrics:', error.message);
    return {
      conversionRate: 12.5,
      averageBookingValue: 250,
      peakHours: '14:00-18:00',
      customerSatisfaction: 94.2,
      revenuePerVehicle: 0,
      bookingCompletionRate: 0
    };
  }
};

// PRIVATE HELPER FUNCTIONS
const getPreviousPeriodStats = async (currentRange: { startDate: string; endDate: string }): Promise<{
  previousRevenue: number;
  previousBookings: number;
  previousUsers: number;
  previousActiveVehicles: number;
}> => {
  const db = await getDbPool();
  
  // Calculate previous period (same duration as current period)
  const currentStart = new Date(currentRange.startDate);
  const currentEnd = new Date(currentRange.endDate);
  const durationMs = currentEnd.getTime() - currentStart.getTime();
  
  const previousEnd = new Date(currentStart);
  previousEnd.setDate(previousEnd.getDate() - 1);
  
  const previousStart = new Date(previousEnd);
  previousStart.setTime(previousEnd.getTime() - durationMs);
  
  const previousStartStr = previousStart.toISOString().split('T')[0];
  const previousEndStr = previousEnd.toISOString().split('T')[0];

  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_amount ELSE 0 END), 0) as previous_revenue,
      COALESCE(COUNT(DISTINCT b.booking_id), 0) as previous_bookings
    FROM Bookings b
    WHERE b.created_at >= @previousStart 
      AND b.created_at <= @previousEnd
  `;

  try {
    const request = db.request();
    request.input('previousStart', previousStartStr);
    request.input('previousEnd', previousEndStr);
    
    const result = await request.query(query);
    const row = result.recordset[0];
    
    // Get previous period users
    const usersQuery = `
      SELECT COUNT(*) as previous_users
      FROM Users 
      WHERE created_at >= @previousStart 
        AND created_at <= @previousEnd
        AND role != 'admin'
    `;
    
    const usersRequest = db.request();
    usersRequest.input('previousStart', previousStartStr);
    usersRequest.input('previousEnd', previousEndStr);
    
    const usersResult = await usersRequest.query(usersQuery);
    const usersRow = usersResult.recordset[0];
    
    // Get previous active vehicles (all time for now)
    const vehiclesQuery = `
      SELECT COUNT(*) as previous_active_vehicles
      FROM Vehicles 
      WHERE availability = 1
    `;
    
    const vehiclesResult = await db.request().query(vehiclesQuery);
    const vehiclesRow = vehiclesResult.recordset[0];
    
    return {
      previousRevenue: parseFloat(row.previous_revenue) || 0,
      previousBookings: parseInt(row.previous_bookings) || 0,
      previousUsers: parseInt(usersRow.previous_users) || 0,
      previousActiveVehicles: parseInt(vehiclesRow.previous_active_vehicles) || 0
    };
  } catch (error: any) {
    console.error('❌ Error in getPreviousPeriodStats query:', error.message);
    return {
      previousRevenue: 0,
      previousBookings: 0,
      previousUsers: 0,
      previousActiveVehicles: 0
    };
  }
};

const calculateDateRange = (period: string): { startDate: string; endDate: string } => {
  const endDate = new Date();
  let startDate = new Date();
  
  switch (period) {
    case 'day':
      startDate.setDate(endDate.getDate() - 1);
      break;
    case 'week':
      startDate.setDate(endDate.getDate() - 7);
      break;
    case 'quarter':
      startDate.setMonth(endDate.getMonth() - 3);
      break;
    case 'year':
      startDate.setFullYear(endDate.getFullYear() - 1);
      break;
    default: // month
      startDate.setMonth(endDate.getMonth() - 1);
  }
  
  return {
    startDate: startDate.toISOString().split('T')[0],
    endDate: endDate.toISOString().split('T')[0]
  };
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10; // Round to 1 decimal
};

const calculateUtilizationChange = (currentActiveVehicles: number, previousActiveVehicles: number): number => {
  if (previousActiveVehicles === 0) {
    return currentActiveVehicles > 0 ? 100 : 0;
  }
  const change = ((currentActiveVehicles - previousActiveVehicles) / previousActiveVehicles) * 100;
  return Math.round(change * 10) / 10;
};