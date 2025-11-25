import { getDbPool } from "../db/dbconfig.ts";

// Interfaces

interface VehicleSpecInfo {
  vehicleSpec_id: string;
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string;
  engine_capacity: string;
  transmission: string;
  seating_capacity: number;
  color: string;
  features: string;
}

interface LocationInfo {
  location_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  created_at: Date;
}

export interface VehicleResponse {
  vehicle_id: string;
  vehicle_spec_id: string;
  rental_rate: number;
  availability: boolean;
  created_at: Date;
  updated_at: Date;

  vehicle_spec: VehicleSpecInfo;
  location: LocationInfo;
}


// GET ALL VEHICLES (with JOIN)

export const getAllVehicles = async (): Promise<VehicleResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      v.vehicle_id,
      v.vehicle_spec_id,
      v.rental_rate,
      v.availability,
      v.created_at,
      v.updated_at,

      -- Vehicle specification details
      vs.manufacturer AS spec_manufacturer,
      vs.model AS spec_model,
      vs.year AS spec_year,
      vs.fuel_type AS spec_fuel_type,
      vs.engine_capacity AS spec_engine_capacity,
      vs.transmission AS spec_transmission,
      vs.seating_capacity AS spec_seating_capacity,
      vs.color AS spec_color,
      vs.features AS spec_features,

      -- Location details (assuming vehicles have location or join through bookings)
      l.location_id AS vehicle_location_id,
      l.name AS location_name,
      l.address AS location_address,
      l.city AS location_city,
      l.country AS location_country,
      l.created_at AS location_created_at

    FROM Vehicles v
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Locations l ON l.location_id = (
      SELECT TOP 1 location_id FROM Bookings 
      WHERE vehicle_id = v.vehicle_id 
      ORDER BY created_at DESC
    )
    ORDER BY v.created_at DESC
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    vehicle_id: row.vehicle_id,
    vehicle_spec_id: row.vehicle_spec_id,
    rental_rate: row.rental_rate,
    availability: row.availability,
    created_at: row.created_at,
    updated_at: row.updated_at,

    vehicle_spec: {
      vehicleSpec_id: row.vehicle_spec_id,
      manufacturer: row.spec_manufacturer,
      model: row.spec_model,
      year: row.spec_year,
      fuel_type: row.spec_fuel_type,
      engine_capacity: row.spec_engine_capacity,
      transmission: row.spec_transmission,
      seating_capacity: row.spec_seating_capacity,
      color: row.spec_color,
      features: row.spec_features,
    },

    location: {
      location_id: row.vehicle_location_id,
      name: row.location_name,
      address: row.location_address,
      city: row.location_city,
      country: row.location_country,
      created_at: row.location_created_at,
    },
  }));
};


// GET SINGLE VEHICLE BY ID

export const getVehicleById = async (vehicle_id: string): Promise<VehicleResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      v.vehicle_id,
      v.vehicle_spec_id,
      v.rental_rate,
      v.availability,
      v.created_at,
      v.updated_at,

      -- Vehicle specification details
      vs.manufacturer AS spec_manufacturer,
      vs.model AS spec_model,
      vs.year AS spec_year,
      vs.fuel_type AS spec_fuel_type,
      vs.engine_capacity AS spec_engine_capacity,
      vs.transmission AS spec_transmission,
      vs.seating_capacity AS spec_seating_capacity,
      vs.color AS spec_color,
      vs.features AS spec_features,

      -- Location details
      l.location_id AS vehicle_location_id,
      l.name AS location_name,
      l.address AS location_address,
      l.city AS location_city,
      l.country AS location_country,
      l.created_at AS location_created_at

    FROM Vehicles v
    INNER JOIN VehicleSpecification vs ON v.vehicle_spec_id = vs.vehicleSpec_id
    LEFT JOIN Locations l ON l.location_id = (
      SELECT TOP 1 location_id FROM Bookings 
      WHERE vehicle_id = v.vehicle_id 
      ORDER BY created_at DESC
    )
    WHERE v.vehicle_id = @vehicle_id
  `;

  const result = await db.request()
    .input("vehicle_id", vehicle_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    vehicle_id: row.vehicle_id,
    vehicle_spec_id: row.vehicle_spec_id,
    rental_rate: row.rental_rate,
    availability: row.availability,
    created_at: row.created_at,
    updated_at: row.updated_at,

    vehicle_spec: {
      vehicleSpec_id: row.vehicle_spec_id,
      manufacturer: row.spec_manufacturer,
      model: row.spec_model,
      year: row.spec_year,
      fuel_type: row.spec_fuel_type,
      engine_capacity: row.spec_engine_capacity,
      transmission: row.spec_transmission,
      seating_capacity: row.spec_seating_capacity,
      color: row.spec_color,
      features: row.spec_features,
    },

    location: {
      location_id: row.vehicle_location_id,
      name: row.location_name,
      address: row.location_address,
      city: row.location_city,
      country: row.location_country,
      created_at: row.location_created_at,
    },
  };
};


// CREATE VEHICLE

export const createVehicle = async (data: {
  vehicle_spec_id: string;
  rental_rate: number;
  availability: boolean;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO Vehicles (vehicle_id, vehicle_spec_id, rental_rate, availability)
    VALUES (NEWID(), @vehicle_spec_id, @rental_rate, @availability)
  `;

  const result = await db.request()
    .input("vehicle_spec_id", data.vehicle_spec_id)
    .input("rental_rate", data.rental_rate)
    .input("availability", data.availability)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Vehicle created successfully ✅"
    : "Failed to create vehicle ❌";
};


// UPDATE VEHICLE

export const updateVehicle = async (
  vehicle_id: string,
  data: {
    vehicle_spec_id: string;
    rental_rate: number;
    availability: boolean;
  }
): Promise<VehicleResponse | null> => {
  const db = await getDbPool();

  const query = `
    UPDATE Vehicles
    SET 
      vehicle_spec_id = @vehicle_spec_id,
      rental_rate = @rental_rate,
      availability = @availability,
      updated_at = GETDATE()
    WHERE vehicle_id = @vehicle_id
  `;

  await db.request()
    .input("vehicle_id", vehicle_id)
    .input("vehicle_spec_id", data.vehicle_spec_id)
    .input("rental_rate", data.rental_rate)
    .input("availability", data.availability)
    .query(query);

  return await getVehicleById(vehicle_id);
};


// DELETE VEHICLE

export const deleteVehicle = async (vehicle_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM Vehicles WHERE vehicle_id = @vehicle_id";

  const result = await db.request()
    .input("vehicle_id", vehicle_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Vehicle deleted successfully 🗑️"
    : "Failed to delete vehicle ⚠️";
};