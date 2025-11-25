import { getDbPool } from "../db/dbconfig.ts";

// Interfaces

interface UserInfo {
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  contact_phone: string;
}

interface VehicleInfo {
  vehicle_id: string;
  rental_rate: number;
  availability: boolean;
}

interface VehicleSpecInfo {
  vehicleSpec_id: string;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string;
}

interface LocationInfo {
  location_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
}

export interface BookingResponse {
  booking_id: string;
  user_id: string;
  vehicle_id: string;
  location_id: string;
  booking_date: Date;
  return_date: Date;
  total_amount: number;
  booking_status: string;
  created_at: Date;
  updated_at: Date;

  user: UserInfo;
  vehicle: VehicleInfo & { vehicle_spec: VehicleSpecInfo };
  location: LocationInfo;
}


// GET ALL BOOKINGS

export const getAllBookings = async (): Promise<BookingResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      b.booking_id,
      b.user_id,
      b.vehicle_id,
      b.location_id,
      b.booking_date,
      b.return_date,
      b.total_amount,
      b.booking_status,
      b.created_at,
      b.updated_at,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email,
      u.contact_phone AS user_contact_phone,

      -- Vehicle details
      v.rental_rate AS vehicle_rental_rate,
      v.availability AS vehicle_availability,

      -- Vehicle specification details
      vs.vehicleSpec_id AS spec_id,
      vs.manufacturer AS spec_manufacturer,
      vs.model AS spec_model,
      vs.year AS spec_year,
      vs.fuel_type AS spec_fuel_type,

      -- Location details
      l.name AS location_name,
      l.address AS location_address,
      l.city AS location_city,
      l.country AS location_country

    FROM Bookings b
    INNER JOIN Users u ON b.user_id = u.user_id
    INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    INNER JOIN Locations l ON b.location_id = l.location_id
    ORDER BY b.created_at DESC
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    booking_id: row.booking_id,
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    location_id: row.location_id,
    booking_date: row.booking_date,
    return_date: row.return_date,
    total_amount: row.total_amount,
    booking_status: row.booking_status,
    created_at: row.created_at,
    updated_at: row.updated_at,

    user: {
      user_id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      contact_phone: row.user_contact_phone,
    },

    vehicle: {
      vehicle_id: row.vehicle_id,
      rental_rate: row.vehicle_rental_rate,
      availability: row.vehicle_availability,
      vehicle_spec: {
        vehicleSpec_id: row.spec_id,
        manufacturer: row.spec_manufacturer,
        model: row.spec_model,
        year: row.spec_year,
        fuel_type: row.spec_fuel_type,
      },
    },

    location: {
      location_id: row.location_id,
      name: row.location_name,
      address: row.location_address,
      city: row.location_city,
      country: row.location_country,
    },
  }));
};


// GET SINGLE BOOKING BY ID

export const getBookingById = async (booking_id: string): Promise<BookingResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      b.booking_id,
      b.user_id,
      b.vehicle_id,
      b.location_id,
      b.booking_date,
      b.return_date,
      b.total_amount,
      b.booking_status,
      b.created_at,
      b.updated_at,

      -- User details
      u.first_name AS user_first_name,
      u.last_name AS user_last_name,
      u.email AS user_email,
      u.contact_phone AS user_contact_phone,

      -- Vehicle details
      v.rental_rate AS vehicle_rental_rate,
      v.availability AS vehicle_availability,

      -- Vehicle specification details
      vs.vehicleSpec_id AS spec_id,
      vs.manufacturer AS spec_manufacturer,
      vs.model AS spec_model,
      vs.year AS spec_year,
      vs.fuel_type AS spec_fuel_type,

      -- Location details
      l.name AS location_name,
      l.address AS location_address,
      l.city AS location_city,
      l.country AS location_country

    FROM Bookings b
    INNER JOIN Users u ON b.user_id = u.user_id
    INNER JOIN Vehicles v ON b.vehicle_id = v.vehicle_id
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    INNER JOIN Locations l ON b.location_id = l.location_id
    WHERE b.booking_id = @booking_id
  `;

  const result = await db.request()
    .input("booking_id", booking_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    booking_id: row.booking_id,
    user_id: row.user_id,
    vehicle_id: row.vehicle_id,
    location_id: row.location_id,
    booking_date: row.booking_date,
    return_date: row.return_date,
    total_amount: row.total_amount,
    booking_status: row.booking_status,
    created_at: row.created_at,
    updated_at: row.updated_at,

    user: {
      user_id: row.user_id,
      first_name: row.user_first_name,
      last_name: row.user_last_name,
      email: row.user_email,
      contact_phone: row.user_contact_phone,
    },

    vehicle: {
      vehicle_id: row.vehicle_id,
      rental_rate: row.vehicle_rental_rate,
      availability: row.vehicle_availability,
      vehicle_spec: {
        vehicleSpec_id: row.spec_id,
        manufacturer: row.spec_manufacturer,
        model: row.spec_model,
        year: row.spec_year,
        fuel_type: row.spec_fuel_type,
      },
    },

    location: {
      location_id: row.location_id,
      name: row.location_name,
      address: row.location_address,
      city: row.location_city,
      country: row.location_country,
    },
  };
};


// CREATE BOOKING

export const createBooking = async (data: {
  user_id: string;
  vehicle_id: string;
  location_id: string;
  booking_date: Date;
  return_date: Date;
  total_amount: number;
  booking_status: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO Bookings (
      booking_id, 
      user_id, 
      vehicle_id, 
      location_id, 
      booking_date, 
      return_date, 
      total_amount, 
      booking_status
    )
    VALUES (NEWID(), @user_id, @vehicle_id, @location_id, @booking_date, @return_date, @total_amount, @booking_status)
  `;

  const result = await db.request()
    .input("user_id", data.user_id)
    .input("vehicle_id", data.vehicle_id)
    .input("location_id", data.location_id)
    .input("booking_date", data.booking_date)
    .input("return_date", data.return_date)
    .input("total_amount", data.total_amount)
    .input("booking_status", data.booking_status)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Booking created successfully ✅"
    : "Failed to create booking ❌";
};


// UPDATE BOOKING

export const updateBooking = async (
  booking_id: string,
  data: {
    user_id: string;
    vehicle_id: string;
    location_id: string;
    booking_date: Date;
    return_date: Date;
    total_amount: number;
    booking_status: string;
  }
): Promise<BookingResponse | null> => {
  const db = await getDbPool();

  const query = `
    UPDATE Bookings
    SET 
      user_id = @user_id,
      vehicle_id = @vehicle_id,
      location_id = @location_id,
      booking_date = @booking_date,
      return_date = @return_date,
      total_amount = @total_amount,
      booking_status = @booking_status,
      updated_at = GETDATE()
    WHERE booking_id = @booking_id
  `;

  await db.request()
    .input("booking_id", booking_id)
    .input("user_id", data.user_id)
    .input("vehicle_id", data.vehicle_id)
    .input("location_id", data.location_id)
    .input("booking_date", data.booking_date)
    .input("return_date", data.return_date)
    .input("total_amount", data.total_amount)
    .input("booking_status", data.booking_status)
    .query(query);

  return await getBookingById(booking_id);
};


// DELETE BOOKING

export const deleteBooking = async (booking_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM Bookings WHERE booking_id = @booking_id";

  const result = await db.request()
    .input("booking_id", booking_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Booking deleted successfully 🗑️"
    : "Failed to delete booking ⚠️";
};