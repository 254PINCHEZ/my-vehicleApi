import { Hono } from 'hono'
import * as VehicleSpecControllers from '../vehiclespecs/vehiclespecs.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const VehicleSpecRoutes = new Hono()

// Get all vehicle specifications
VehicleSpecRoutes.get('/vehiclespecs', VehicleSpecControllers.getAllVehicleSpecs)

// Get vehicle specification by vehicle spec id
VehicleSpecRoutes.get('/vehiclespecs/:vehicleSpec_id', VehicleSpecControllers.getVehicleSpecById)

// Create a vehicle specification
VehicleSpecRoutes.post('/vehiclespecs',  VehicleSpecControllers.createVehicleSpec)

// Update vehicle specification by vehicle spec id
VehicleSpecRoutes.put('/vehiclespecs/:vehicleSpec_id',  VehicleSpecControllers.updateVehicleSpec)

// Delete vehicle specification by vehicle spec id
VehicleSpecRoutes.delete('/vehiclespecs/:vehicleSpec_id',  VehicleSpecControllers.deleteVehicleSpec)

export default VehicleSpecRoutes