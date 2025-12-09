import { getDbPool } from "../db/dbconfig.ts";
import sql from "mssql";

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

// Interface for creating a vehicle with specifications
export interface CreateVehicleWithSpecData {
  rental_rate: number;
  availability: boolean;
  location_id?: string;
  vehicle_spec: {
    manufacturer: string;
    model: string;
    year: number;
    fuel_type: string;
    engine_capacity?: string;
    transmission?: string;
    seating_capacity: number;
    color: string;
    features: string;
  };
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

// CREATE VEHICLE (UPDATED - Now accepts vehicle_spec object)
export const createVehicle = async (data: CreateVehicleWithSpecData): Promise<{ message: string; vehicle_id?: string }> => {
  const db = await getDbPool();

  try {
    // Start transaction to ensure both inserts succeed or fail together
    const transaction = new sql.Transaction(db);
    
    try {
      await transaction.begin();

      // 1. Create Vehicle Specification
      const createSpecQuery = `
        INSERT INTO VehicleSpecification (
          vehicleSpec_id, manufacturer, model, year, fuel_type, 
          engine_capacity, transmission, seating_capacity, color, features
        )
        OUTPUT INSERTED.vehicleSpec_id
        VALUES (NEWID(), @manufacturer, @model, @year, @fuel_type, 
                @engine_capacity, @transmission, @seating_capacity, @color, @features);
      `;

      const specRequest = new sql.Request(transaction);
      const specResult = await specRequest
        .input("manufacturer", sql.VarChar, data.vehicle_spec.manufacturer)
        .input("model", sql.VarChar, data.vehicle_spec.model)
        .input("year", sql.Int, data.vehicle_spec.year)
        .input("fuel_type", sql.VarChar, data.vehicle_spec.fuel_type)
        .input("engine_capacity", sql.VarChar, data.vehicle_spec.engine_capacity || null)
        .input("transmission", sql.VarChar, data.vehicle_spec.transmission || null)
        .input("seating_capacity", sql.Int, data.vehicle_spec.seating_capacity)
        .input("color", sql.VarChar, data.vehicle_spec.color)
        .input("features", sql.VarChar, data.vehicle_spec.features)
        .query(createSpecQuery);

      if (!specResult.recordset.length) {
        throw new Error("Failed to create vehicle specification");
      }

      const vehicleSpec_id = specResult.recordset[0].vehicleSpec_id;

      // 2. Create Vehicle with the generated specification ID
      const createVehicleQuery = `
        INSERT INTO Vehicles (vehicle_id, vehicle_spec_id, rental_rate, availability)
        OUTPUT INSERTED.vehicle_id
        VALUES (NEWID(), @vehicle_spec_id, @rental_rate, @availability);
      `;

      const vehicleRequest = new sql.Request(transaction);
      const vehicleResult = await vehicleRequest
        .input("vehicle_spec_id", sql.UniqueIdentifier, vehicleSpec_id)
        .input("rental_rate", sql.Decimal(10, 2), data.rental_rate)
        .input("availability", sql.Bit, data.availability)
        .query(createVehicleQuery);

      if (!vehicleResult.recordset.length) {
        throw new Error("Failed to create vehicle");
      }

      const vehicle_id = vehicleResult.recordset[0].vehicle_id;

      await transaction.commit();

      return {
        message: "Vehicle created successfully ✅",
        vehicle_id: vehicle_id
      };

    } catch (transactionError) {
      await transaction.rollback();
      console.error("Transaction error:", transactionError);
      throw new Error(`Transaction failed: ${transactionError.message}`);
    }
  } catch (error: any) {
    console.error("Error in createVehicle service:", error);
    throw new Error(`Failed to create vehicle: ${error.message}`);
  }
};

// UPDATE VEHICLE (Updated to handle specification updates too if needed)
export const updateVehicle = async (
  vehicle_id: string,
  data: {
    rental_rate: number;
    availability: boolean;
    vehicle_spec_id?: string; // Optional if updating specification separately
  }
): Promise<VehicleResponse | null> => {
  const db = await getDbPool();

  try {
    const query = `
      UPDATE Vehicles
      SET 
        rental_rate = @rental_rate,
        availability = @availability,
        updated_at = SYSDATETIMEOFFSET()
      WHERE vehicle_id = @vehicle_id
    `;

    await db.request()
      .input("vehicle_id", sql.UniqueIdentifier, vehicle_id)
      .input("rental_rate", sql.Decimal(10, 2), data.rental_rate)
      .input("availability", sql.Bit, data.availability)
      .query(query);

    // Return the updated vehicle
    return await getVehicleById(vehicle_id);
  } catch (error: any) {
    console.error("Error in updateVehicle service:", error);
    throw new Error(`Failed to update vehicle: ${error.message}`);
  }
};

// UPDATE VEHICLE SPECIFICATION
export const updateVehicleSpecification = async (
  vehicleSpec_id: string,
  data: {
    manufacturer: string;
    model: string;
    year: number;
    fuel_type: string;
    engine_capacity?: string;
    transmission?: string;
    seating_capacity: number;
    color: string;
    features: string;
  }
): Promise<string> => {
  const db = await getDbPool();

  try {
    const query = `
      UPDATE VehicleSpecification
      SET 
        manufacturer = @manufacturer,
        model = @model,
        year = @year,
        fuel_type = @fuel_type,
        engine_capacity = @engine_capacity,
        transmission = @transmission,
        seating_capacity = @seating_capacity,
        color = @color,
        features = @features,
        updated_at = SYSDATETIMEOFFSET()
      WHERE vehicleSpec_id = @vehicleSpec_id
    `;

    await db.request()
      .input("vehicleSpec_id", sql.UniqueIdentifier, vehicleSpec_id)
      .input("manufacturer", sql.VarChar, data.manufacturer)
      .input("model", sql.VarChar, data.model)
      .input("year", sql.Int, data.year)
      .input("fuel_type", sql.VarChar, data.fuel_type)
      .input("engine_capacity", sql.VarChar, data.engine_capacity || null)
      .input("transmission", sql.VarChar, data.transmission || null)
      .input("seating_capacity", sql.Int, data.seating_capacity)
      .input("color", sql.VarChar, data.color)
      .input("features", sql.VarChar, data.features)
      .query(query);

    return "Vehicle specification updated successfully ✅";
  } catch (error: any) {
    console.error("Error in updateVehicleSpecification service:", error);
    throw new Error(`Failed to update vehicle specification: ${error.message}`);
  }
};

// DELETE VEHICLE (Also deletes the associated specification)
export const deleteVehicle = async (vehicle_id: string): Promise<string> => {
  const db = await getDbPool();

  try {
    // First get the vehicle_spec_id
    const getSpecIdQuery = `
      SELECT vehicle_spec_id FROM Vehicles WHERE vehicle_id = @vehicle_id
    `;

    const specResult = await db.request()
      .input("vehicle_id", sql.UniqueIdentifier, vehicle_id)
      .query(getSpecIdQuery);

    if (!specResult.recordset.length) {
      throw new Error("Vehicle not found");
    }

    const vehicle_spec_id = specResult.recordset[0].vehicle_spec_id;

    // Start transaction
    const transaction = new sql.Transaction(db);
    
    try {
      await transaction.begin();

      // 1. Delete the vehicle
      const deleteVehicleQuery = `
        DELETE FROM Vehicles WHERE vehicle_id = @vehicle_id
      `;

      const vehicleRequest = new sql.Request(transaction);
      await vehicleRequest
        .input("vehicle_id", sql.UniqueIdentifier, vehicle_id)
        .query(deleteVehicleQuery);

      // 2. Delete the vehicle specification (only if no other vehicle uses it)
      const checkSpecUsageQuery = `
        SELECT COUNT(*) as usage_count 
        FROM Vehicles 
        WHERE vehicle_spec_id = @vehicle_spec_id
      `;

      const checkRequest = new sql.Request(transaction);
      const usageResult = await checkRequest
        .input("vehicle_spec_id", sql.UniqueIdentifier, vehicle_spec_id)
        .query(checkSpecUsageQuery);

      const usageCount = usageResult.recordset[0].usage_count;

      if (usageCount === 0) {
        // No other vehicle uses this spec, so delete it
        const deleteSpecQuery = `
          DELETE FROM VehicleSpecification WHERE vehicleSpec_id = @vehicle_spec_id
        `;

        await new sql.Request(transaction)
          .input("vehicle_spec_id", sql.UniqueIdentifier, vehicle_spec_id)
          .query(deleteSpecQuery);
      }

      await transaction.commit();
      
      return "Vehicle deleted successfully 🗑️";

    } catch (transactionError) {
      await transaction.rollback();
      throw transactionError;
    }
  } catch (error: any) {
    console.error("Error in deleteVehicle service:", error);
    throw new Error(`Failed to delete vehicle: ${error.message}`);
  }
};

// GET VEHICLE SPECIFICATION BY ID
export const getVehicleSpecificationById = async (vehicleSpec_id: string): Promise<VehicleSpecInfo | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      vehicleSpec_id,
      manufacturer,
      model,
      year,
      fuel_type,
      engine_capacity,
      transmission,
      seating_capacity,
      color,
      features
    FROM VehicleSpecification
    WHERE vehicleSpec_id = @vehicleSpec_id
  `;

  const result = await db.request()
    .input("vehicleSpec_id", sql.UniqueIdentifier, vehicleSpec_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    vehicleSpec_id: row.vehicleSpec_id,
    manufacturer: row.manufacturer,
    model: row.model,
    year: row.year,
    fuel_type: row.fuel_type,
    engine_capacity: row.engine_capacity,
    transmission: row.transmission,
    seating_capacity: row.seating_capacity,
    color: row.color,
    features: row.features,
  };
};