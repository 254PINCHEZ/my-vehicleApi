// src/controllers/support.controller.ts
import type { Context } from "hono";
import * as supportService from "../support tickets/Support.service.ts";

// ✅ GET ALL SUPPORT TICKETS - MAIN ENDPOINT
export const getAllTickets = async (c: Context) => {
  try {
    console.log('🔄 Fetching all support tickets...');
    
    const tickets = await supportService.getAllTickets();
    
    console.log('✅ Support tickets fetched successfully:', {
      count: tickets.length,
      sample: tickets.length > 0 ? tickets[0] : 'No tickets'
    });
    
    return c.json({
      success: true,
      data: tickets,
      count: tickets.length,
      message: "Support tickets retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching support tickets:", error.message);
    console.error("Full error:", error);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch support tickets",
      message: error.message || "Internal server error",
      data: [] // Return empty array for frontend compatibility
    }, 500);
  }
};

// ✅ GET TICKET BY ID
export const getTicketById = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    console.log(`🔄 Fetching ticket ${ticketId}...`);
    
    const ticket = await supportService.getTicketById(ticketId);
    
    if (!ticket) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: `Ticket with ID ${ticketId} not found`
      }, 404);
    }
    
    console.log('✅ Ticket fetched successfully:', ticket);
    
    return c.json({
      success: true,
      data: ticket,
      message: "Ticket retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error fetching ticket ${c.req.param("ticket_id")}:`, error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch ticket",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ GET TICKETS BY CUSTOMER
export const getTicketsByCustomer = async (c: Context) => {
  try {
    const customerId = c.req.param("customer_id");
    console.log(`🔄 Fetching tickets for customer ${customerId}...`);
    
    const tickets = await supportService.getTicketsByCustomer(customerId);
    
    console.log(`✅ Found ${tickets.length} tickets for customer ${customerId}`);
    
    return c.json({
      success: true,
      data: tickets,
      count: tickets.length,
      message: "Customer tickets retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error fetching tickets for customer ${c.req.param("customer_id")}:`, error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch customer tickets",
      message: error.message || "Internal server error",
      data: [] // Return empty array for frontend compatibility
    }, 500);
  }
};

// ✅ CREATE NEW SUPPORT TICKET
export const createTicket = async (c: Context) => {
  try {
    const ticketData = await c.req.json();
    console.log('🔄 Creating new support ticket...');
    console.log('Ticket data received:', ticketData);
    
    // Validate required fields
    if (!ticketData.customer_name || !ticketData.customer_email || !ticketData.subject || !ticketData.description) {
      return c.json({
        success: false,
        error: "Missing required fields",
        message: "customer_name, customer_email, subject, and description are required"
      }, 400);
    }
    
    const result = await supportService.createTicket(ticketData);
    
    console.log('✅ Ticket created successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Support ticket created successfully"
    }, 201);
  } catch (error: any) {
    console.error("❌ Error creating support ticket:", error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to create support ticket",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ UPDATE TICKET STATUS
export const updateTicketStatus = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    const { status } = await c.req.json();
    
    console.log(`🔄 Updating ticket ${ticketId} status to ${status}...`);
    
    if (!status) {
      return c.json({
        success: false,
        error: "Missing status",
        message: "Status is required"
      }, 400);
    }
    
    const result = await supportService.updateTicketStatus(ticketId, status);
    
    console.log('✅ Ticket status updated successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket status updated successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error updating ticket ${c.req.param("ticket_id")} status:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to update ticket status",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ UPDATE TICKET PRIORITY
export const updateTicketPriority = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    const { priority } = await c.req.json();
    
    console.log(`🔄 Updating ticket ${ticketId} priority to ${priority}...`);
    
    if (!priority) {
      return c.json({
        success: false,
        error: "Missing priority",
        message: "Priority is required"
      }, 400);
    }
    
    const result = await supportService.updateTicketPriority(ticketId, priority);
    
    console.log('✅ Ticket priority updated successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket priority updated successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error updating ticket ${c.req.param("ticket_id")} priority:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to update ticket priority",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ ASSIGN TICKET TO ADMIN
export const assignTicket = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    const { assigned_to } = await c.req.json();
    
    console.log(`🔄 Assigning ticket ${ticketId} to admin ${assigned_to}...`);
    
    if (!assigned_to) {
      return c.json({
        success: false,
        error: "Missing admin",
        message: "assigned_to is required"
      }, 400);
    }
    
    const result = await supportService.assignTicket(ticketId, assigned_to);
    
    console.log('✅ Ticket assigned successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket assigned successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error assigning ticket ${c.req.param("ticket_id")}:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to assign ticket",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ DELETE TICKET
export const deleteTicket = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    console.log(`🔄 Deleting ticket ${ticketId}...`);
    
    const result = await supportService.deleteTicket(ticketId);
    
    console.log('✅ Ticket deleted successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket deleted successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error deleting ticket ${c.req.param("ticket_id")}:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to delete ticket",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ GET TICKET REPLIES
export const getTicketReplies = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    console.log(`🔄 Fetching replies for ticket ${ticketId}...`);
    
    const replies = await supportService.getTicketReplies(ticketId);
    
    console.log(`✅ Found ${replies.length} replies for ticket ${ticketId}`);
    
    return c.json({
      success: true,
      data: replies,
      count: replies.length,
      message: "Ticket replies retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error fetching replies for ticket ${c.req.param("ticket_id")}:`, error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch ticket replies",
      message: error.message || "Internal server error",
      data: [] // Return empty array for frontend compatibility
    }, 500);
  }
};

// ✅ ADD REPLY TO TICKET
export const addTicketReply = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    const { message, is_admin, created_by } = await c.req.json();
    
    console.log(`🔄 Adding reply to ticket ${ticketId}...`);
    
    if (!message || !created_by) {
      return c.json({
        success: false,
        error: "Missing required fields",
        message: "message and created_by are required"
      }, 400);
    }
    
    const result = await supportService.addTicketReply(
      ticketId,
      message,
      is_admin || false,
      created_by
    );
    
    console.log('✅ Reply added successfully:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Reply added successfully"
    }, 201);
  } catch (error: any) {
    console.error(`❌ Error adding reply to ticket ${c.req.param("ticket_id")}:`, error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to add reply",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ MARK TICKET AS RESOLVED
export const markAsResolved = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    console.log(`🔄 Marking ticket ${ticketId} as resolved...`);
    
    const result = await supportService.markAsResolved(ticketId);
    
    console.log('✅ Ticket marked as resolved:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket marked as resolved"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error marking ticket ${c.req.param("ticket_id")} as resolved:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to mark ticket as resolved",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ REOPEN TICKET
export const reopenTicket = async (c: Context) => {
  try {
    const ticketId = c.req.param("ticket_id");
    console.log(`🔄 Reopening ticket ${ticketId}...`);
    
    const result = await supportService.reopenTicket(ticketId);
    
    console.log('✅ Ticket reopened:', result);
    
    return c.json({
      success: true,
      data: result,
      message: "Ticket reopened"
    }, 200);
  } catch (error: any) {
    console.error(`❌ Error reopening ticket ${c.req.param("ticket_id")}:`, error.message);
    
    if (error.message.includes("not found")) {
      return c.json({
        success: false,
        error: "Ticket not found",
        message: error.message
      }, 404);
    }
    
    return c.json({ 
      success: false,
      error: "Failed to reopen ticket",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ GET SUPPORT STATISTICS
export const getSupportStats = async (c: Context) => {
  try {
    console.log('🔄 Fetching support statistics...');
    
    const stats = await supportService.getSupportStats();
    
    console.log('✅ Support statistics fetched:', stats);
    
    return c.json({
      success: true,
      data: stats,
      message: "Support statistics retrieved successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error fetching support statistics:", error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to fetch support statistics",
      message: error.message || "Internal server error"
    }, 500);
  }
};

// ✅ SEARCH TICKETS
export const searchTickets = async (c: Context) => {
  try {
    const { query, status, priority, category } = c.req.query();
    
    console.log(`🔍 Searching tickets with parameters:`, { query, status, priority, category });
    
    const tickets = await supportService.searchTickets(query, status, priority, category);
    
    console.log(`✅ Found ${tickets.length} tickets matching search criteria`);
    
    return c.json({
      success: true,
      data: tickets,
      count: tickets.length,
      message: "Tickets search completed successfully"
    }, 200);
  } catch (error: any) {
    console.error("❌ Error searching tickets:", error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to search tickets",
      message: error.message || "Internal server error",
      data: [] // Return empty array for frontend compatibility
    }, 500);
  }
};

// ✅ HEALTH CHECK ENDPOINT FOR SUPPORT
export const getSupportHealth = async (c: Context) => {
  try {
    return c.json({
      success: true,
      message: "Support API is operational",
      status: "healthy",
      timestamp: new Date().toISOString(),
      endpoints: {
        getAllTickets: "GET /api/support/tickets",
        getTicketById: "GET /api/support/tickets/:ticket_id",
        createTicket: "POST /api/support/tickets",
        updateStatus: "PATCH /api/support/tickets/:ticket_id/status",
        getStats: "GET /api/support/stats",
        health: "GET /api/support/health"
      }
    }, 200);
  } catch (error: any) {
    console.error("❌ Support health check error:", error.message);
    
    return c.json({ 
      success: false,
      message: "Support API health check failed",
      status: "unhealthy",
      error: error.message || "Unknown error",
      timestamp: new Date().toISOString()
    }, 500);
  }
};

// ✅ TEST ENDPOINT TO VERIFY SUPPORT DATA
export const testSupportData = async (c: Context) => {
  try {
    console.log('🧪 Testing support data connectivity...');
    
    // Try to create the support tables if they don't exist
    try {
      await supportService.createSupportTicketsTable();
      console.log('✅ Support tables created/verified');
    } catch (tableError) {
      console.log('⚠️ Could not create tables, might already exist:', tableError.message);
    }
    
    // Test basic queries
    const testResults = {
      getAllTickets: await supportService.getAllTickets(),
      getSupportStats: await supportService.getSupportStats(),
      tableStatus: 'SupportTickets table exists and is accessible',
      timestamp: new Date().toISOString()
    };
    
    return c.json({
      success: true,
      message: 'Support database test results',
      data: testResults
    }, 200);
  } catch (error: any) {
    console.error("❌ Error testing support data:", error.message);
    
    return c.json({ 
      success: false,
      error: "Failed to test support data",
      message: error.message || "Internal server error",
      data: {
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }, 500);
  }
};