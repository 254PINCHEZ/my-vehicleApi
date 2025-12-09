// src/routes/support.routes.ts
import { Hono } from 'hono'
import * as supportControllers from '../support tickets/Support.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const SupportRoutes = new Hono()

// Apply admin authentication to all support routes
SupportRoutes.use('*', adminRoleAuth)

// === TICKET MANAGEMENT ===

// Get all support tickets - MAIN ENDPOINT
SupportRoutes.get('/tickets', supportControllers.getAllTickets)

// Get ticket by ID
SupportRoutes.get('/tickets/:ticket_id', supportControllers.getTicketById)

// Get tickets by customer
SupportRoutes.get('/tickets/customer/:customer_id', supportControllers.getTicketsByCustomer)

// Create new support ticket
SupportRoutes.post('/tickets', supportControllers.createTicket)

// Update ticket status
SupportRoutes.patch('/tickets/:ticket_id/status', supportControllers.updateTicketStatus)

// Update ticket priority
SupportRoutes.patch('/tickets/:ticket_id/priority', supportControllers.updateTicketPriority)

// Assign ticket to admin
SupportRoutes.patch('/tickets/:ticket_id/assign', supportControllers.assignTicket)

// Delete ticket
SupportRoutes.delete('/tickets/:ticket_id', supportControllers.deleteTicket)

// === TICKET REPLIES ===

// Get ticket replies
SupportRoutes.get('/tickets/:ticket_id/replies', supportControllers.getTicketReplies)

// Add reply to ticket
SupportRoutes.post('/tickets/:ticket_id/replies', supportControllers.addTicketReply)

// === TICKET ACTIONS ===

// Mark ticket as resolved
SupportRoutes.patch('/tickets/:ticket_id/resolve', supportControllers.markAsResolved)

// Reopen ticket
SupportRoutes.patch('/tickets/:ticket_id/reopen', supportControllers.reopenTicket)

// === STATISTICS & ANALYTICS ===

// Get support statistics
SupportRoutes.get('/stats', supportControllers.getSupportStats)

// Search tickets
SupportRoutes.get('/tickets/search', supportControllers.searchTickets)

// === SYSTEM HEALTH ===

// Health check endpoint
SupportRoutes.get('/health', supportControllers.getSupportHealth)

// Test endpoint for debugging
SupportRoutes.get('/test-data', supportControllers.testSupportData)

export default SupportRoutes