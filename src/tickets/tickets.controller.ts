import type { Context } from "hono";
import * as ticketService from "../tickets/tickets.service.ts";

// ✅ Get all tickets
export const getAllTickets = async (c: Context) => {
  try {
    const tickets = await ticketService.getAllTickets();
    return c.json(tickets, 200);
  } catch (error: any) {
    console.error("Error fetching tickets:", error.message);
    return c.json({ error: "Failed to fetch tickets" }, 500);
  }
};

// ✅ Get ticket by ID
export const getTicketById = async (c: Context) => {
  const id = c.req.param("ticket_id");
  if (!id) return c.json({ error: "Invalid ticket ID" }, 400);

  try {
    const ticket = await ticketService.getTicketById(id);
    if (!ticket) return c.json({ error: "Ticket not found" }, 404);
    return c.json(ticket, 200);
  } catch (error: any) {
    console.error("Error fetching ticket:", error.message);
    return c.json({ error: "Failed to fetch ticket" }, 500);
  }
};

// ✅ Create ticket
export const createTicket = async (c: Context) => {
  try {
    const data = await c.req.json();
    const result = await ticketService.createTicket(data);
    return c.json({ message: result }, 201);
  } catch (error: any) {
    console.error("Error creating ticket:", error.message);
    return c.json({ error: error.message || "Failed to create ticket" }, 500);
  }
};

// ✅ Update ticket
export const updateTicket = async (c: Context) => {
  const id = c.req.param("ticket_id");
  if (!id) return c.json({ error: "Invalid ticket ID" }, 400);

  try {
    const data = await c.req.json();
    const updated = await ticketService.updateTicket(id, data);
    if (!updated) return c.json({ error: "Ticket not found" }, 404);
    return c.json({ message: "Ticket updated successfully" }, 200);
  } catch (error: any) {
    console.error("Error updating ticket:", error.message);
    return c.json({ error: "Failed to update ticket" }, 500);
  }
};

// ✅ Delete ticket
export const deleteTicket = async (c: Context) => {
  const id = c.req.param("ticket_id");
  if (!id) return c.json({ error: "Invalid ticket ID" }, 400);

  try {
    const result = await ticketService.deleteTicket(id);
    return c.json({ message: result }, 200);
  } catch (error: any) {
    console.error("Error deleting ticket:", error.message);
    return c.json({ error: "Failed to delete ticket" }, 500);
  }
};