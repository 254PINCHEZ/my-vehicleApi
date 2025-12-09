import { getDbPool } from "../db/dbconfig.ts";
import sql from 'mssql';

// Interfaces
interface BookingInfo {
  booking_id: string;
  user_id: string;
  vehicle_id: string;
  total_amount: number;
  booking_status: string;
}

interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
}

export interface PaymentResponse {
  payment_id: string;
  booking_id: string;
  amount: number;
  payment_status: string;
  payment_date: Date;
  payment_method: string;
  transaction_id: string;
  created_at: Date;
  updated_at: Date;
  booking: BookingInfo;
  user: UserInfo;
}

interface StripePaymentConfirmation {
  paymentIntentId: string;
  userId: string;      // GUID
  vehicleId: string;   // GUID
  bookingId: string;   // GUID
  amount: number;
  startDate: string;
  endDate: string;
  paymentMethod: string;
}

// ✅ YOUR ORIGINAL FUNCTIONS (THAT ARE MISSING):

// GET ALL PAYMENTS
export const getAllPayments = async (): Promise<PaymentResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      p.payment_id,
      p.booking_id,
      p.amount,
      p.payment_status,
      p.payment_date,
      p.payment_method,
      p.transaction_id,
      p.created_at,
      p.updated_at,

      -- Booking details
      b.user_id AS booking_user_id,
      b.vehicle_id AS booking_vehicle_id,
      b.total_amount AS booking_total_amount,
      b.booking_status AS booking_status,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email

    FROM Payments p
    INNER JOIN Bookings b ON p.booking_id = b.booking_id
    INNER JOIN Users u ON b.user_id = u.user_id
    ORDER BY p.created_at DESC
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    payment_id: row.payment_id,
    booking_id: row.booking_id,
    amount: row.amount,
    payment_status: row.payment_status,
    payment_date: row.payment_date,
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    created_at: row.created_at,
    updated_at: row.updated_at,

    booking: {
      booking_id: row.booking_id,
      user_id: row.booking_user_id,
      vehicle_id: row.booking_vehicle_id,
      total_amount: row.booking_total_amount,
      booking_status: row.booking_status,
    },

    user: {
      user_id: row.booking_user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
    },
  }));
};

// GET SINGLE PAYMENT BY ID
export const getPaymentById = async (payment_id: string): Promise<PaymentResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      p.payment_id,
      p.booking_id,
      p.amount,
      p.payment_status,
      p.payment_date,
      p.payment_method,
      p.transaction_id,
      p.created_at,
      p.updated_at,

      -- Booking details
      b.user_id AS booking_user_id,
      b.vehicle_id AS booking_vehicle_id,
      b.total_amount AS booking_total_amount,
      b.booking_status AS booking_status,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email

    FROM Payments p
    INNER JOIN Bookings b ON p.booking_id = b.booking_id
    INNER JOIN Users u ON b.user_id = u.user_id
    WHERE p.payment_id = @payment_id
  `;

  const result = await db.request()
    .input("payment_id", payment_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    payment_id: row.payment_id,
    booking_id: row.booking_id,
    amount: row.amount,
    payment_status: row.payment_status,
    payment_date: row.payment_date,
    payment_method: row.payment_method,
    transaction_id: row.transaction_id,
    created_at: row.created_at,
    updated_at: row.updated_at,

    booking: {
      booking_id: row.booking_id,
      user_id: row.booking_user_id,
      vehicle_id: row.booking_vehicle_id,
      total_amount: row.booking_total_amount,
      booking_status: row.booking_status,
    },

    user: {
      user_id: row.booking_user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
    },
  };
};

// CREATE PAYMENT
export const createPayment = async (data: {
  booking_id: string;
  amount: number;
  payment_status: string;
  payment_method: string;
  transaction_id: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO Payments (
      payment_id, 
      booking_id, 
      amount, 
      payment_status, 
      payment_method, 
      transaction_id
    )
    VALUES (NEWID(), @booking_id, @amount, @payment_status, @payment_method, @transaction_id)
  `;

  const result = await db.request()
    .input("booking_id", data.booking_id)
    .input("amount", data.amount)
    .input("payment_status", data.payment_status)
    .input("payment_method", data.payment_method)
    .input("transaction_id", data.transaction_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Payment created successfully ✅"
    : "Failed to create payment ❌";
};

// UPDATE PAYMENT
export const updatePayment = async (
  payment_id: string,
  data: {
    booking_id: string;
    amount: number;
    payment_status: string;
    payment_method: string;
    transaction_id: string;
  }
): Promise<void> => {
  const db = await getDbPool();

  const query = `
    UPDATE Payments
    SET 
      booking_id = @booking_id,
      amount = @amount,
      payment_status = @payment_status,
      payment_method = @payment_method,
      transaction_id = @transaction_id,
      updated_at = GETDATE()
    WHERE payment_id = @payment_id
  `;

  await db.request()
    .input("payment_id", payment_id)
    .input("booking_id", data.booking_id)
    .input("amount", data.amount)
    .input("payment_status", data.payment_status)
    .input("payment_method", data.payment_method)
    .input("transaction_id", data.transaction_id)
    .query(query);
};

// DELETE PAYMENT
export const deletePayment = async (payment_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM Payments WHERE payment_id = @payment_id";

  const result = await db.request()
    .input("payment_id", payment_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Payment deleted successfully 🗑️"
    : "Failed to delete payment ⚠️";
};

// ✅ THEN ADD YOUR STRIPE FUNCTIONS BELOW:

// Stripe interfaces
interface StripePaymentIntentData {
  amount: number;
  currency?: string;
  metadata?: {
    booking_id?: string;
    vehicle_id?: string;
    user_id?: string;
  };
}

interface StripePaymentConfirmation {
  paymentIntentId: string;
  bookingData: {
    user_id: string;  // This is now GUID string, not INT
    vehicle_id: string;
    startDate: string;
    endDate: string;
    totalCost: number;
    booking_id?: string;
  };
}

// Initialize Stripe
import Stripe from 'stripe';
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_your_key_here', {
  // apiVersion: '2023-10-16',
});

// CREATE STRIPE PAYMENT INTENT
export const createStripePaymentIntent = async (data: StripePaymentIntentData): Promise<{
  clientSecret: string;
  amount: number;
  id: string;
}> => {
  try {
    // Create PaymentIntent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount), // amount in cents
      currency: data.currency || 'usd',
      metadata: data.metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    return {
      clientSecret: paymentIntent.client_secret!,
      amount: paymentIntent.amount,
      id: paymentIntent.id,
    };

  } catch (error: any) {
    console.error('Stripe service error creating payment intent:', error);
    throw new Error(`Failed to create payment intent: ${error.message}`);
  }
};

// CONFIRM STRIPE PAYMENT AND CREATE BOOKING & PAYMENT - FIXED VERSION
export const confirmStripePayment = async (data: StripePaymentConfirmation): Promise<{
  success: boolean;
  bookingId: string;
  paymentId: string;
  paymentIntent: any;
}> => {
  const db = await getDbPool();
  
  try {
    console.log('🔍 confirmStripePayment called with:', data);

    // Verify the payment with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(data.paymentIntentId);
    console.log('✅ Payment intent retrieved:', paymentIntent.id, paymentIntent.status);

    if (paymentIntent.status !== 'succeeded') {
      throw new Error(`Payment not successful. Status: ${paymentIntent.status}`);
    }

    // Generate IDs
    const bookingId = data.bookingId || generateUUID();
    const paymentId = generateUUID();

    // ✅ FIXED: Use proper SQL parameter types for GUIDs
    const bookingQuery = `
      INSERT INTO Bookings (
        booking_id, 
        user_id,
        vehicle_id, 
        location_id,
        booking_date, 
        return_date, 
        total_amount, 
        booking_status,
        created_at, 
        updated_at
      )
      VALUES (
        @booking_id, 
        @user_id, 
        @vehicle_id, 
        @location_id, 
        @booking_date, 
        @return_date, 
        @total_amount, 
        @booking_status, 
        SYSDATETIMEOFFSET(), 
        SYSDATETIMEOFFSET()
      )
    `;

    // Use a valid location ID from your database
    // First, let's get a valid location ID or create a default one
    let locationId = '00000000-0000-0000-0000-000000000000';
    
    try {
      // Try to get a location from the database
      const locationResult = await db.request().query("SELECT TOP 1 location_id FROM Locations");
      if (locationResult.recordset.length > 0) {
        locationId = locationResult.recordset[0].location_id;
      } else {
        // If no locations exist, create a default one
        const insertLocationQuery = `
          INSERT INTO Locations (location_id, name, address, city, country)
          VALUES (NEWID(), 'Default Location', '123 Main St', 'Nairobi', 'Kenya')
        `;
        await db.request().query(insertLocationQuery);
        
        const newLocationResult = await db.request().query("SELECT TOP 1 location_id FROM Locations");
        if (newLocationResult.recordset.length > 0) {
          locationId = newLocationResult.recordset[0].location_id;
        }
      }
    } catch (locationError) {
      console.warn('⚠️ Could not fetch location, using default:', locationError.message);
    }

    console.log('📍 Using location ID:', locationId);

    // ✅ CRITICAL FIX: Use the correct SQL parameter types
    const request = db.request();
    
    // For GUID columns, ensure we're passing them correctly
    request.input("booking_id", sql.UniqueIdentifier, bookingId);
    request.input("user_id", sql.UniqueIdentifier, data.userId);
    request.input("vehicle_id", sql.UniqueIdentifier, data.vehicleId);
    request.input("location_id", sql.UniqueIdentifier, locationId);
    request.input("booking_date", sql.DateTimeOffset, data.startDate);
    request.input("return_date", sql.DateTimeOffset, data.endDate);
    request.input("total_amount", sql.Decimal(10, 2), data.amount);
    request.input("booking_status", sql.NVarChar(50), 'Confirmed');

    const bookingResult = await request.query(bookingQuery);
    
    if (bookingResult.rowsAffected[0] !== 1) {
      throw new Error('Failed to create booking record');
    }

    console.log('✅ Booking created with ID:', bookingId);

    // Create payment record
    const paymentQuery = `
      INSERT INTO Payments (
        payment_id, 
        booking_id, 
        amount, 
        payment_status, 
        payment_method, 
        transaction_id,
        provider_payment_id,
        currency,
        provider_metadata,
        payment_date,
        created_at, 
        updated_at
      )
      VALUES (
        @payment_id, 
        @booking_id, 
        @amount, 
        @payment_status, 
        @payment_method, 
        @transaction_id,
        @provider_payment_id,
        @currency,
        @provider_metadata,
        SYSDATETIMEOFFSET(),
        SYSDATETIMEOFFSET(), 
        SYSDATETIMEOFFSET()
      )
    `;

    // ✅ FIXED: Use correct parameter types for payment creation
    const paymentRequest = db.request();
    
    paymentRequest.input("payment_id", sql.UniqueIdentifier, paymentId);
    paymentRequest.input("booking_id", sql.UniqueIdentifier, bookingId);
    paymentRequest.input("amount", sql.Decimal(10, 2), data.amount);
    paymentRequest.input("payment_status", sql.NVarChar(50), 'success');
    paymentRequest.input("payment_method", sql.NVarChar(50), 'Stripe');
    paymentRequest.input("transaction_id", sql.NVarChar(255), data.paymentIntentId);
    paymentRequest.input("provider_payment_id", sql.NVarChar(255), data.paymentIntentId);
    paymentRequest.input("currency", sql.NVarChar(3), 'USD');
    paymentRequest.input("provider_metadata", sql.NVarChar(sql.MAX), JSON.stringify({
      stripe_payment_intent: data.paymentIntentId,
      stripe_status: 'succeeded',
      booking_id: bookingId,
      created_at: new Date().toISOString()
    }));

    const paymentResult = await paymentRequest.query(paymentQuery);
    
    if (paymentResult.rowsAffected[0] !== 1) {
      throw new Error('Failed to create payment record');
    }

    console.log('✅ Payment created with ID:', paymentId);

    return {
      success: true,
      bookingId: bookingId,
      paymentId: paymentId,
      paymentIntent: {
        id: paymentIntent.id,
        amount: paymentIntent.amount,
        status: paymentIntent.status,
      },
    };

  } catch (error: any) {
    console.error('❌ Stripe service error confirming payment:', {
      message: error.message,
      number: error.number,
      state: error.state,
      lineNumber: error.lineNumber,
      stack: error.stack,
    });
    
    // Provide helpful error message based on error type
    if (error.message.includes('foreign key constraint')) {
      throw new Error(`Foreign key violation: Check if User (${data.userId}) or Vehicle (${data.vehicleId}) exists.`);
    }
    
    if (error.message.includes('uniqueidentifier')) {
      throw new Error(`Invalid GUID format for user_id: ${data.userId}`);
    }
    
    throw new Error(`Failed to confirm payment: ${error.message}`);
  }
};

// Development bypass for testing (optional)
export const confirmStripePaymentDev = async (data: StripePaymentConfirmation): Promise<{
  success: boolean;
  bookingId: string;
  paymentId: string;
  paymentIntent: any;
}> => {
  console.log('🛠️ DEVELOPMENT MODE: Simulating payment confirmation');
  
  // Simulate database delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return {
    success: true,
    bookingId: 'dev_booking_' + Date.now(),
    paymentId: 'dev_payment_' + Date.now(),
    paymentIntent: {
      id: data.paymentIntentId,
      amount: data.bookingData.totalCost * 100,
      status: 'succeeded',
    },
  };
};

// VERIFY STRIPE PAYMENT (Optional helper function)
export const verifyStripePayment = async (paymentIntentId: string): Promise<boolean> => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent.status === 'succeeded';
  } catch (error) {
    console.error('Error verifying Stripe payment:', error);
    return false;
  }
};

// Helper function to generate UUID (like NEWID() in SQL)
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Optional: Add a function to check if user exists
export const checkUserExists = async (userGuid: string): Promise<boolean> => {
  try {
    const db = await getDbPool();
    const result = await db.request()
      .input("user_id", userGuid)
      .query("SELECT user_id FROM Users WHERE user_id = @user_id");
    
    return result.recordset.length > 0;
  } catch (error) {
    console.error('Error checking user existence:', error);
    return false;
  }
};