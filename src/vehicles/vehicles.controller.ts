import type { Context } from "hono";
import * as vehicleService from "../vehicles/vehicles.service.ts";

// ✅ Get all vehicles
export const getAllVehicles = async (c: Context) => {
  try {
    const vehicles = await vehicleService.getAllVehicles();
    return c.json(vehicles, 200);
  } catch (error: any) {
    console.error("Error fetching vehicles:", error.message);
    return c.json({ error: "Failed to fetch vehicles" }, 500);
  }
};

// ✅ Get vehicle by ID
export const getVehicleById = async (c: Context) => {
  const id = c.req.param("vehicle_id");
  if (!id) return c.json({ error: "Invalid vehicle ID" }, 400);

  try {
    const vehicle = await vehicleService.getVehicleById(id);
    if (!vehicle) return c.json({ error: "Vehicle not found" }, 404);
    return c.json(vehicle, 200);
  } catch (error: any) {
    console.error("Error fetching vehicle:", error.message);
    return c.json({ error: "Failed to fetch vehicle" }, 500);
  }
};

// ✅ Create vehicle
export const createVehicle = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await vehicleService.createVehicle(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating vehicle:", error.message);
    return c.json({ error: error.message || "Failed to create vehicle" }, 500);
  }
};

// ✅ Update vehicle
export const updateVehicle = async (c: Context) => {
  const id = c.req.param("vehicle_id");
  if (!id) return c.json({ error: "Invalid vehicle ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await vehicleService.updateVehicle(id, data);
    if (!updated) return c.json({ error: "Vehicle not found" }, 404);
    return c.json({ message: "Vehicle updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating vehicle:", error.message);
    return c.json({ error: "Failed to update vehicle" }, 500);
  }
};

// ✅ Delete vehicle
export const deleteVehicle = async (c: Context) => {
  const id = c.req.param("vehicle_id");
  if (!id) return c.json({ error: "Invalid vehicle ID" }, 400);

  try {
    const result = await vehicleService.deleteVehicle(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting vehicle:", error.message);
    return c.json({ error: "Failed to delete vehicle" }, 500);
  }
};