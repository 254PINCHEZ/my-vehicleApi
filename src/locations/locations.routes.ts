import { Hono } from 'hono'
import * as LocationControllers from '../locations/locations.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const LocationRoutes = new Hono()

// Get all locations
LocationRoutes.get('/locations', LocationControllers.getAllLocations)

// Get location by location id
LocationRoutes.get('/locations/:location_id', LocationControllers.getLocationById)

// Create a location
LocationRoutes.post('/locations',  LocationControllers.createLocation)

// Update location by location id
LocationRoutes.put('/locations/:location_id', LocationControllers.updateLocation)

// Delete location by location id
LocationRoutes.delete('/locations/:location_id',  LocationControllers.deleteLocation)

export default LocationRoutes