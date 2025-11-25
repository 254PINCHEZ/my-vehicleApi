import { Hono } from 'hono'
import * as VehicleControllers from '../vehicles/vehicles.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const VehicleRoutes = new Hono()

// Get all vehicles
VehicleRoutes.get('/vehicles', VehicleControllers.getAllVehicles)

// Get vehicle by vehicle id
VehicleRoutes.get('/vehicles/:vehicle_id', VehicleControllers.getVehicleById)

// Create a vehicle
VehicleRoutes.post('/vehicles', VehicleControllers.createVehicle)

// Update vehicle by vehicle id
VehicleRoutes.put('/vehicles/:vehicle_id', VehicleControllers.updateVehicle)

// Delete vehicle by vehicle id
VehicleRoutes.delete('/vehicles/:vehicle_id',  VehicleControllers.deleteVehicle)

export default VehicleRoutes