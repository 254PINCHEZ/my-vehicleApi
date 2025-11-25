import type { Context } from "hono";
import * as vehicleSpecService from "../vehiclespecs/vehiclespecs.service.ts";

// ✅ Get all vehicle specifications
export const getAllVehicleSpecs = async (c: Context) => {
  try {
    const vehicleSpecs = await vehicleSpecService.getAllVehicleSpecs();
    return c.json(vehicleSpecs, 200);
  } catch (error: any) {
    console.error("Error fetching vehicle specifications:", error.message);
    return c.json({ error: "Failed to fetch vehicle specifications" }, 500);
  }
};

// ✅ Get vehicle specification by ID
export const getVehicleSpecById = async (c: Context) => {
  const id = c.req.param("vehicleSpec_id");
  if (!id) return c.json({ error: "Invalid vehicle specification ID" }, 400);

  try {
    const vehicleSpec = await vehicleSpecService.getVehicleSpecById(id);
    if (!vehicleSpec) return c.json({ error: "Vehicle specification not found" }, 404);
    return c.json(vehicleSpec, 200);
  } catch (error: any) {
    console.error("Error fetching vehicle specification:", error.message);
    return c.json({ error: "Failed to fetch vehicle specification" }, 500);
  }
};

// ✅ Create vehicle specification
export const createVehicleSpec = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await vehicleSpecService.createVehicleSpec(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating vehicle specification:", error.message);
    return c.json({ error: error.message || "Failed to create vehicle specification" }, 500);
  }
};

// ✅ Update vehicle specification
export const updateVehicleSpec = async (c: Context) => {
  const id = c.req.param("vehicleSpec_id");
  if (!id) return c.json({ error: "Invalid vehicle specification ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await vehicleSpecService.updateVehicleSpec(id, data);
    if (!updated) return c.json({ error: "Vehicle specification not found" }, 404);
    return c.json({ message: "Vehicle specification updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating vehicle specification:", error.message);
    return c.json({ error: "Failed to update vehicle specification" }, 500);
  }
};

// ✅ Delete vehicle specification
export const deleteVehicleSpec = async (c: Context) => {
  const id = c.req.param("vehicleSpec_id");
  if (!id) return c.json({ error: "Invalid vehicle specification ID" }, 400);

  try {
    const result = await vehicleSpecService.deleteVehicleSpec(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting vehicle specification:", error.message);
    return c.json({ error: "Failed to delete vehicle specification" }, 500);
  }
};