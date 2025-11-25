import { getDbPool } from "../db/dbconfig.ts";

// Interfaces

interface LocationInfo {
  location_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  created_at: Date;
}

export interface LocationResponse {
  location_id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  created_at: Date;
}


// GET ALL LOCATIONS

export const getAllLocations = async (): Promise<LocationResponse[]> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      location_id,
      name,
      address,
      city,
      country,
      created_at
    FROM Locations
    ORDER BY name
  `;

  const result = await db.request().query(query);

  return result.recordset.map((row: any) => ({
    location_id: row.location_id,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    created_at: row.created_at,
  }));
};


// GET SINGLE LOCATION BY ID

export const getLocationById = async (location_id: string): Promise<LocationResponse | null> => {
  const db = await getDbPool();

  const query = `
    SELECT 
      location_id,
      name,
      address,
      city,
      country,
      created_at
    FROM Locations
    WHERE location_id = @location_id
  `;

  const result = await db.request()
    .input("location_id", location_id)
    .query(query);

  if (!result.recordset.length) return null;

  const row = result.recordset[0];

  return {
    location_id: row.location_id,
    name: row.name,
    address: row.address,
    city: row.city,
    country: row.country,
    created_at: row.created_at,
  };
};


// CREATE LOCATION

export const createLocation = async (data: {
  name: string;
  address: string;
  city: string;
  country: string;
}): Promise<string> => {
  const db = await getDbPool();

  const query = `
    INSERT INTO Locations (location_id, name, address, city, country)
    VALUES (NEWID(), @name, @address, @city, @country)
  `;

  const result = await db.request()
    .input("name", data.name)
    .input("address", data.address)
    .input("city", data.city)
    .input("country", data.country)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Location created successfully ✅"
    : "Failed to create location ❌";
};


// UPDATE LOCATION

export const updateLocation = async (
  location_id: string,
  data: {
    name: string;
    address: string;
    city: string;
    country: string;
  }
): Promise<LocationResponse | null> => {
  const db = await getDbPool();

  const query = `
    UPDATE Locations
    SET 
      name = @name,
      address = @address,
      city = @city,
      country = @country
    WHERE location_id = @location_id
  `;

  await db.request()
    .input("location_id", location_id)
    .input("name", data.name)
    .input("address", data.address)
    .input("city", data.city)
    .input("country", data.country)
    .query(query);

  return await getLocationById(location_id);
};


// DELETE LOCATION

export const deleteLocation = async (location_id: string): Promise<string> => {
  const db = await getDbPool();

  const query = "DELETE FROM Locations WHERE location_id = @location_id";

  const result = await db.request()
    .input("location_id", location_id)
    .query(query);

  return result.rowsAffected[0] === 1
    ? "Location deleted successfully 🗑️"
    : "Failed to delete location ⚠️";
};