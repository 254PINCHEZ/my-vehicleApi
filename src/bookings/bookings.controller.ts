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