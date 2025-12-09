import type { Context } from "hono";
import * as bookingService from "../bookings/bookings.service.ts";

// ✅ Get all bookings
export const getAllBookings = async (c: Context) => {
  try {
    const bookings = await bookingService.getAllBookings();
    return c.json(bookings, 200);
  } catch (error: any) {
    console.error("Error fetching bookings:", error.message);
    return c.json({ error: "Failed to fetch bookings" }, 500);
  }
};

// ✅ Get booking by ID
export const getBookingById = async (c: Context) => {
  const id = c.req.param("booking_id");
  if (!id) return c.json({ error: "Invalid booking ID" }, 400);

  try {
    const booking = await bookingService.getBookingById(id);
    if (!booking) return c.json({ error: "Booking not found" }, 404);
    return c.json(booking, 200);
  } catch (error: any) {
    console.error("Error fetching booking:", error.message);
    return c.json({ error: "Failed to fetch booking" }, 500);
  }
};

// ✅ Get all bookings for a specific user
export const getBookingsByUserId = async (c: Context) => {
  try {
    // Get user_id from query parameter or from authenticated user
    const user_id = c.req.query('user_id') || c.get('user')?.user_id;
    
    if (!user_id) {
      return c.json({ error: "User ID is required" }, 400);
    }

    // Optional: Verify the authenticated user can only access their own bookings
    // unless they are admin
    const authUser = c.get('user');
    if (authUser?.role !== 'admin' && authUser?.user_id !== user_id) {
      return c.json({ error: "Unauthorized to access these bookings" }, 403);
    }

    const bookings = await bookingService.getBookingsByUserId(user_id);
    return c.json(bookings, 200);
  } catch (error: any) {
    console.error("Error fetching user bookings:", error.message);
    return c.json({ error: "Failed to fetch user bookings" }, 500);
  }
};

// ✅ Cancel booking
export const cancelBooking = async (c: Context) => {
  const booking_id = c.req.param("booking_id");
  if (!booking_id) return c.json({ error: "Invalid booking ID" }, 400);

  try {
    const { cancellation_reason } = await c.req.json();
    
    // Verify user can only cancel their own booking unless admin
    const authUser = c.get('user');
    
    if (authUser?.role !== 'admin') {
      // Check if this booking belongs to the authenticated user
      const booking = await bookingService.getBookingById(booking_id);
      if (!booking) {
        return c.json({ error: "Booking not found" }, 404);
      }
      if (booking.user_id !== authUser?.user_id) {
        return c.json({ error: "Unauthorized to cancel this booking" }, 403);
      }
    }

    const result = await bookingService.cancelBooking(booking_id, cancellation_reason);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error cancelling booking:", error.message);
    
    // Return appropriate error messages
    if (error.message.includes("already cancelled")) {
      return c.json({ error: error.message }, 400);
    }
    if (error.message.includes("cannot be cancelled")) {
      return c.json({ error: error.message }, 400);
    }
    if (error.message.includes("not found")) {
      return c.json({ error: error.message }, 404);
    }
    
    return c.json({ error: error.message || "Failed to cancel booking" }, 500);
  }
};

// ✅ Create booking
export const createBooking = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await bookingService.createBooking(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating booking:", error.message);
    return c.json({ error: error.message || "Failed to create booking" }, 500);
  }
};

// ✅ Update booking
export const updateBooking = async (c: Context) => {
  const id = c.req.param("booking_id");
  if (!id) return c.json({ error: "Invalid booking ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await bookingService.updateBooking(id, data);
    if (!updated) return c.json({ error: "Booking not found" }, 404);
    return c.json({ message: "Booking updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating booking:", error.message);
    return c.json({ error: "Failed to update booking" }, 500);
  }
};

// ✅ Delete booking
export const deleteBooking = async (c: Context) => {
  const id = c.req.param("booking_id");
  if (!id) return c.json({ error: "Invalid booking ID" }, 400);

  try {
    const result = await bookingService.deleteBooking(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting booking:", error.message);
    return c.json({ error: "Failed to delete booking" }, 500);
  }
};