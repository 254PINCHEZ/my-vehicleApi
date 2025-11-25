import type { Context } from "hono";
import * as locationService from "../locations/locations.service.ts";

// ✅ Get all locations
export const getAllLocations = async (c: Context) => {
  try {
    const locations = await locationService.getAllLocations();
    return c.json(locations, 200);
  } catch (error: any) {
    console.error("Error fetching locations:", error.message);
    return c.json({ error: "Failed to fetch locations" }, 500);
  }
};

// ✅ Get location by ID
export const getLocationById = async (c: Context) => {
  const id = c.req.param("location_id");
  if (!id) return c.json({ error: "Invalid location ID" }, 400);

  try {
    const location = await locationService.getLocationById(id);
    if (!location) return c.json({ error: "Location not found" }, 404);
    return c.json(location, 200);
  } catch (error: any) {
    console.error("Error fetching location:", error.message);
    return c.json({ error: "Failed to fetch location" }, 500);
  }
};

// ✅ Create location
export const createLocation = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await locationService.createLocation(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating location:", error.message);
    return c.json({ error: error.message || "Failed to create location" }, 500);
  }
};

// ✅ Update location
export const updateLocation = async (c: Context) => {
  const id = c.req.param("location_id");
  if (!id) return c.json({ error: "Invalid location ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await locationService.updateLocation(id, data);
    if (!updated) return c.json({ error: "Location not found" }, 404);
    return c.json({ message: "Location updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating location:", error.message);
    return c.json({ error: "Failed to update location" }, 500);
  }
};

// ✅ Delete location
export const deleteLocation = async (c: Context) => {
  const id = c.req.param("location_id");
  if (!id) return c.json({ error: "Invalid location ID" }, 400);

  try {
    const result = await locationService.deleteLocation(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting location:", error.message);
    return c.json({ error: "Failed to delete location" }, 500);
  }
};