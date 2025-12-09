import { getDbPool } from "../db/dbconfig.ts";

// Interfaces matching your frontend expectations
export interface AdminDashboardStats {
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activeVehicles: number;
  revenueChange: number;
  bookingChange: number;
  userChange: number;
  utilizationChange: number;
  pendingBookings: number;
  completedBookings: number;
  activeBookings: number;
  recentBookings: any[];
  topVehicles: any[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

export interface RecentBooking {
  booking_id: string;
  booking_reference: string;
  customer_name: string;
  customer_email: string;
  vehicle_name: string;
  vehicle_type: string;
  total_amount: number;
  daily_rate?: number;
  status: 'pending' | 'confirmed' | 'active' | 'cancelled' | 'completed';
  created_at: string;
  start_date: string;
  end_date: string;
  pickup_location?: string;
  vehicle_license_plate?: string;
}

// GET ADMIN DASHBOARD DATA
export const getAdminDashboardData = async (): Promise<AdminDashboardStats> => {
  try {
    console.log('📊 Fetching admin dashboard data...');
    
    // Get basic stats
    const stats = await getDashboardStats();
    
    // Get recent bookings (last 10)
    const recentBookings = await getRecentBookings(10);
    
    // Get top vehicles (top 5)
    const topVehicles = await getTopVehicles(5);
    
    // Get monthly revenue (last 6 months)
    const monthlyRevenue = await getMonthlyRevenue(6);

    console.log('✅ Dashboard data fetched successfully');
    
    return {
      ...stats,
      recentBookings,
      topVehicles,
      monthlyRevenue
    };
  } catch (error: any) {
    console.error('❌ Error in getAdminDashboardData:', error.message);
    throw error;
  }
};

// GET DASHBOARD STATISTICS - FIXED
export const getDashboardStats = async (): Promise<{
  totalBookings: number;
  totalRevenue: number;
  totalUsers: number;
  activeVehicles: number;
  revenueChange: number;
  bookingChange: number;
  userChange: number;
  utilizationChange: number;
  pendingBookings: number;
  completedBookings: number;
  activeBookings: number;
}> => {
  const db = await getDbPool();

  // ALL-TIME STATS (no date filtering)
  const query = `
    -- Total Bookings (ALL TIME)
    SELECT 
      COUNT(DISTINCT b.booking_id) as total_bookings,
      COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_amount ELSE 0 END), 0) as total_revenue,
      
      -- Total Users (ALL USERS)
      (SELECT COUNT(*) FROM Users) as total_users,
      
      -- Active Vehicles (available for rent)
      (SELECT COUNT(*) FROM Vehicles WHERE availability = 1) as active_vehicles,
      
      -- Booking Status Counts (ALL TIME)
      SUM(CASE WHEN b.booking_status = 'pending' THEN 1 ELSE 0 END) as pending_bookings,
      SUM(CASE WHEN b.booking_status = 'completed' THEN 1 ELSE 0 END) as completed_bookings,
      SUM(CASE WHEN b.booking_status = 'active' THEN 1 ELSE 0 END) as active_bookings
      
    FROM Bookings b
  `;

  console.log('📈 Executing dashboard stats query...');
  
  try {
    const result = await db.request().query(query);
    const row = result.recordset[0];
    
    console.log('📊 Dashboard stats raw data:', row);

    // Get previous period data for percentage changes (last 30 days vs previous 30 days)
    const previousPeriod = await getPreviousPeriodStats();
    
    console.log('📅 Previous period stats:', previousPeriod);
    
    const stats = {
      totalBookings: parseInt(row.total_bookings) || 0,
      totalRevenue: parseFloat(row.total_revenue) || 0,
      totalUsers: parseInt(row.total_users) || 0,
      activeVehicles: parseInt(row.active_vehicles) || 0,
      
      // Calculate percentage changes
      revenueChange: calculatePercentageChange(parseFloat(row.total_revenue) || 0, previousPeriod.previousRevenue || 0),
      bookingChange: calculatePercentageChange(parseInt(row.total_bookings) || 0, previousPeriod.previousBookings || 0),
      userChange: calculatePercentageChange(parseInt(row.total_users) || 0, previousPeriod.previousUsers || 0),
      utilizationChange: 5.2, // Mock value for now
      
      pendingBookings: parseInt(row.pending_bookings) || 0,
      completedBookings: parseInt(row.completed_bookings) || 0,
      activeBookings: parseInt(row.active_bookings) || 0
    };
    
    console.log('✅ Final dashboard stats:', stats);
    
    return stats;
  } catch (error: any) {
    console.error('❌ Error in getDashboardStats query:', error.message);
    console.error('SQL Error:', error);
    
    // Return default values if query fails
    return {
      totalBookings: 0,
      totalRevenue: 0,
      totalUsers: 0,
      activeVehicles: 0,
      revenueChange: 0,
      bookingChange: 0,
      userChange: 0,
      utilizationChange: 0,
      pendingBookings: 0,
      completedBookings: 0,
      activeBookings: 0
    };
  }
};

// GET RECENT BOOKINGS - FIXED
export const getRecentBookings = async (limit: number = 10): Promise<RecentBooking[]> => {
  const db = await getDbPool();

  const query = `
    SELECT TOP ${limit}
      b.booking_id,
      'BOOK-' + SUBSTRING(CONVERT(VARCHAR(36), b.booking_id), 1, 8) as booking_reference,
      CONCAT(u.first_name, ' ', u.last_name) as customer_name,
      u.email as customer_email,
      CONCAT(vs.manufacturer, ' ', vs.model) as vehicle_name,
      -- Use COALESCE to handle missing vehicle_type gracefully
      COALESCE(vs.category, vs.body_type, 'Standard') as vehicle_type,
      b.total_amount,
      v.rental_rate as daily_rate,
      b.booking_status as status,
      CONVERT(VARCHAR, b.created_at, 120) as created_at,
      CONVERT(VARCHAR, b.booking_date, 120) as start_date,
      CONVERT(VARCHAR, b.return_date, 120) as end_date,
      COALESCE(l.name, 'Not specified') as pickup_location,
      COALESCE(v.license_plate, 'N/A') as vehicle_license_plate
    FROM Bookings b
    INNER JOIN Users u ON b.user_id = u.user_id
    INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Locations l ON b.location_id = l.location_id
    ORDER BY b.created_at DESC
  `;

  console.log(`📋 Fetching ${limit} recent bookings...`);
  
  try {
    const result = await db.request().query(query);
    console.log(`✅ Found ${result.recordset.length} recent bookings`);
    
    return result.recordset.map((row: any) => ({
      booking_id: row.booking_id || '',
      booking_reference: row.booking_reference || 'BOOK-00000000',
      customer_name: row.customer_name || 'Unknown Customer',
      customer_email: row.customer_email || '',
      vehicle_name: row.vehicle_name || 'Unknown Vehicle',
      vehicle_type: row.vehicle_type || 'Standard',
      total_amount: parseFloat(row.total_amount) || 0,
      daily_rate: parseFloat(row.daily_rate) || 0,
      status: (row.status || 'pending').toLowerCase() as any,
      created_at: row.created_at || new Date().toISOString(),
      start_date: row.start_date || new Date().toISOString(),
      end_date: row.end_date || new Date().toISOString(),
      pickup_location: row.pickup_location,
      vehicle_license_plate: row.vehicle_license_plate
    }));
  } catch (error: any) {
    console.error('❌ Error in getRecentBookings query:', error.message);
    console.error('SQL Error:', error);
    
    // Return empty array if query fails
    return [];
  }
};

// GET TOP VEHICLES - FIXED
export const getTopVehicles = async (limit: number = 5): Promise<any[]> => {
  const db = await getDbPool();

  const query = `
    SELECT TOP ${limit}
      v.vehicle_id,
      CONCAT(vs.manufacturer, ' ', vs.model) as vehicle_name,
      COALESCE(SUM(b.total_amount), 0) as total_revenue,
      COUNT(b.booking_id) as booking_count,
      COALESCE(vs.category, vs.body_type, 'Standard') as vehicle_type,
      v.rental_rate
    FROM Vehicles v
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Bookings b ON v.vehicle_id = b.vehicle_id AND b.booking_status = 'completed'
    GROUP BY v.vehicle_id, vs.manufacturer, vs.model, vs.category, vs.body_type, v.rental_rate
    ORDER BY total_revenue DESC, booking_count DESC
  `;

  try {
    const result = await db.request().query(query);
    console.log(`✅ Found ${result.recordset.length} top vehicles`);

    return result.recordset.map((row: any) => ({
      vehicle_id: row.vehicle_id || '',
      name: row.vehicle_name || 'Unknown Vehicle',
      revenue: parseFloat(row.total_revenue) || 0,
      bookings: parseInt(row.booking_count) || 0,
      type: row.vehicle_type || 'Standard',
      daily_rate: parseFloat(row.rental_rate) || 0,
      utilization: Math.min(Math.round((parseInt(row.booking_count) * 100) / 30), 100) || 0
    }));
  } catch (error: any) {
    console.error('❌ Error in getTopVehicles query:', error.message);
    return [];
  }
};

// GET MONTHLY REVENUE - FIXED
export const getMonthlyRevenue = async (months: number = 6): Promise<Array<{ month: string; revenue: number }>> => {
  const db = await getDbPool();

  const query = `
    WITH months AS (
      SELECT TOP ${months} 
        FORMAT(DATEADD(MONTH, -ROW_NUMBER() OVER (ORDER BY (SELECT NULL)) + 1, GETDATE()), 'yyyy-MM') as month
      FROM sys.objects
    )
    SELECT 
      m.month,
      COALESCE(SUM(b.total_amount), 0) as revenue
    FROM months m
    LEFT JOIN Bookings b ON FORMAT(b.created_at, 'yyyy-MM') = m.month 
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
    console.error('❌ Error in getMonthlyRevenue query:', error.message);
    return [];
  }
};

// Additional function for bookings API
export const getAllBookingsForAdmin = async (): Promise<RecentBooking[]> => {
  return await getRecentBookings(50);
};

// PRIVATE HELPER FUNCTIONS
const getPreviousPeriodStats = async (): Promise<{
  previousRevenue: number;
  previousBookings: number;
  previousUsers: number;
}> => {
  const db = await getDbPool();

  // Get stats from 60-30 days ago (previous period)
  const query = `
    SELECT 
      COALESCE(SUM(CASE WHEN b.booking_status = 'completed' THEN b.total_amount ELSE 0 END), 0) as previous_revenue,
      COALESCE(COUNT(DISTINCT b.booking_id), 0) as previous_bookings
    FROM Bookings b
    WHERE b.created_at >= DATEADD(DAY, -60, GETDATE()) 
      AND b.created_at < DATEADD(DAY, -30, GETDATE())
  `;

  try {
    const result = await db.request().query(query);
    const row = result.recordset[0];
    
    // Get previous period users
    const usersQuery = `
      SELECT COUNT(*) as previous_users
      FROM Users 
      WHERE created_at >= DATEADD(DAY, -60, GETDATE()) 
        AND created_at < DATEADD(DAY, -30, GETDATE())
    `;
    
    const usersResult = await db.request().query(usersQuery);
    const usersRow = usersResult.recordset[0];
    
    return {
      previousRevenue: parseFloat(row.previous_revenue) || 0,
      previousBookings: parseInt(row.previous_bookings) || 0,
      previousUsers: parseInt(usersRow.previous_users) || 0
    };
  } catch (error: any) {
    console.error('❌ Error in getPreviousPeriodStats query:', error.message);
    return {
      previousRevenue: 0,
      previousBookings: 0,
      previousUsers: 0
    };
  }
};

const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  const change = ((current - previous) / previous) * 100;
  return Math.round(change * 10) / 10; // Round to 1 decimal
};

const calculateUtilizationChange = (activeVehicles: number): number => {
  // Simple mock calculation - in production, compare with previous period
  return activeVehicles > 0 ? 5.2 : 0;
};