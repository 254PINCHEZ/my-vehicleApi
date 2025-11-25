import { getDbPool } from "../db/dbconfig.ts";

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
): Promise<PaymentResponse | null> => {
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

  return await getPaymentById(payment_id);
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