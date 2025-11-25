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

export interface VehicleSpecResponse {
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


// GET ALL VEHICLE SPECIFICATIONS

export const getAllVehicleSpecs = async (): Promise<VehicleSpecResponse[]> => {
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
    ORDER BY manufacturer, model
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
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
  }));
};


// GET SINGLE VEHICLE SPECIFICATION BY ID

export const getVehicleSpecById = async (vehicleSpec_id: string): Promise<VehicleSpecResponse | null> => {
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
    .input("vehicleSpec_id", vehicleSpec_id)
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


// CREATE VEHICLE SPECIFICATION

export const createVehicleSpec = async (data: {
  manufacturer: string;
  model: string;
  year: number;
  fuel_type: string;
  engine_capacity: string;
  transmission: string;
  seating_capacity: number;
  color: string;
  features: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO VehicleSpecification (
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
    )
    VALUES (NEWID(), @manufacturer, @model, @year, @fuel_type, @engine_capacity, @transmission, @seating_capacity, @color, @features)
  `;

  const result = await db.request()
    .input("manufacturer", data.manufacturer)
    .input("model", data.model)
    .input("year", data.year)
    .input("fuel_type", data.fuel_type)
    .input("engine_capacity", data.engine_capacity)
    .input("transmission", data.transmission)
    .input("seating_capacity", data.seating_capacity)
    .input("color", data.color)
    .input("features", data.features)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Vehicle specification created successfully ✅"
    : "Failed to create vehicle specification ❌";
};


// UPDATE VEHICLE SPECIFICATION

export const updateVehicleSpec = async (
  vehicleSpec_id: string,
  data: {
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
): Promise<VehicleSpecResponse | null> => {
  const db = await getDbPool();

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
      features = @features
    WHERE vehicleSpec_id = @vehicleSpec_id
  `;

  await db.request()
    .input("vehicleSpec_id", vehicleSpec_id)
    .input("manufacturer", data.manufacturer)
    .input("model", data.model)
    .input("year", data.year)
    .input("fuel_type", data.fuel_type)
    .input("engine_capacity", data.engine_capacity)
    .input("transmission", data.transmission)
    .input("seating_capacity", data.seating_capacity)
    .input("color", data.color)
    .input("features", data.features)
    .query(query);

  return await getVehicleSpecById(vehicleSpec_id);
};


// DELETE VEHICLE SPECIFICATION

export const deleteVehicleSpec = async (vehicleSpec_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM VehicleSpecification WHERE vehicleSpec_id = @vehicleSpec_id";

  const result = await db.request()
    .input("vehicleSpec_id", vehicleSpec_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Vehicle specification deleted successfully 🗑️"
    : "Failed to delete vehicle specification ⚠️";
};