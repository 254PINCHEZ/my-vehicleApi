import { Hono } from 'hono'
import * as TicketControllers from '../tickets/tickets.controller.ts'
import { adminRoleAuth } from '../middleware/bearauth.ts'

const TicketRoutes = new Hono()

// Get all tickets
TicketRoutes.get('/tickets',  TicketControllers.getAllTickets)

// Get ticket by ticket id
TicketRoutes.get('/tickets/:ticket_id',  TicketControllers.getTicketById)

// Create a ticket
TicketRoutes.post('/tickets', TicketControllers.createTicket)

// Update ticket by ticket id
TicketRoutes.put('/tickets/:ticket_id',  TicketControllers.updateTicket)

// Delete ticket by ticket id
TicketRoutes.delete('/tickets/:ticket_id',  TicketControllers.deleteTicket)

export default TicketRoutes