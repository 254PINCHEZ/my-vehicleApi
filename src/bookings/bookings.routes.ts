import { Hono } from 'hono'
import * as BookingControllers from '../bookings/bookings.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const BookingRoutes = new Hono()

// Get all bookings
BookingRoutes.get('/bookings',  BookingControllers.getAllBookings)

// Get booking by booking id
BookingRoutes.get('/bookings/:booking_id',  BookingControllers.getBookingById)

// Create a booking
BookingRoutes.post('/bookings', BookingControllers.createBooking)

// Update booking by booking id
BookingRoutes.put('/bookings/:booking_id',  BookingControllers.updateBooking)

// Delete booking by booking id
BookingRoutes.delete('/bookings/:booking_id',  BookingControllers.deleteBooking)

export default BookingRoutes